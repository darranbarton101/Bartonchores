import { redirect } from "next/navigation";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";
import { formatDate, formatPence } from "@/lib/utils";
import SectionHeader from "@/components/SectionHeader";
import {
  approveCompletion,
  createChore,
  createPayout,
  denyCompletion,
  setSchedule,
  signOut,
  updateChore
} from "@/app/actions";

const weekdayLabels = [
  { id: 0, label: "Sun" },
  { id: 1, label: "Mon" },
  { id: 2, label: "Tue" },
  { id: 3, label: "Wed" },
  { id: 4, label: "Thu" },
  { id: 5, label: "Fri" },
  { id: 6, label: "Sat" }
];

export default async function AdultPage() {
  const supabase = createSupabaseServerComponentClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, role")
    .eq("id", session.user.id)
    .single();

  if (!profile || profile.role !== "adult") {
    redirect("/login");
  }

  const { data: kids } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("role", "kid")
    .order("display_name");

  const { data: pendingRequests } = await supabase
    .from("completion_requests")
    .select(
      "id, date, status, kid:profiles(id, display_name), chore:chores(id, title, value_pence)"
    )
    .eq("status", "pending")
    .order("date", { ascending: false });

  const { data: chores } = await supabase
    .from("chores")
    .select("id, title, value_pence, active")
    .order("title");

  const { data: schedules } = await supabase
    .from("chore_schedules")
    .select("id, chore_id, days_of_week");

  const { data: ledgerEntries } = await supabase
    .from("ledger_entries")
    .select("kid_id, amount_pence");

  const balanceByKid = new Map<string, number>();
  ledgerEntries?.forEach((entry) => {
    balanceByKid.set(
      entry.kid_id,
      (balanceByKid.get(entry.kid_id) ?? 0) + entry.amount_pence
    );
  });

  const scheduleMap = new Map(
    schedules?.map((schedule) => [schedule.chore_id, schedule]) ?? []
  );

  const pendingByKid = new Map<string, number>();
  pendingRequests?.forEach((request) => {
    pendingByKid.set(
      request.kid.id,
      (pendingByKid.get(request.kid.id) ?? 0) + 1
    );
  });

  const createChoreAction = async (formData: FormData) => {
    "use server";
    const title = String(formData.get("title") ?? "").trim();
    const value = Number(formData.get("value"));
    if (!title || Number.isNaN(value)) {
      return;
    }
    await createChore(title, value);
  };

  const updateChoreAction = async (formData: FormData) => {
    "use server";
    const id = String(formData.get("id"));
    const title = String(formData.get("title") ?? "").trim();
    const value = Number(formData.get("value"));
    const active = formData.get("active") === "on";
    if (!title || Number.isNaN(value)) {
      return;
    }
    await updateChore(id, title, value, active);
  };

  const scheduleAction = async (formData: FormData) => {
    "use server";
    const id = String(formData.get("choreId"));
    const days = formData.getAll("days").map((day) => Number(day));
    await setSchedule(id, days);
  };

  const payoutAction = async (formData: FormData) => {
    "use server";
    const kidId = String(formData.get("kidId"));
    const note = String(formData.get("note") ?? "Weekly pocket money");
    await createPayout(kidId, note);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Welcome, {profile.display_name}</p>
          <h1 className="text-2xl font-semibold">Adult dashboard</h1>
          <p className="text-sm text-slate-500">
            Approve chores, manage schedules, and run payday.
          </p>
        </div>
        <form action={signOut}>
          <button type="submit" className="bg-slate-200 text-slate-700">
            Sign out
          </button>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {kids?.map((kid) => (
          <div key={kid.id} className="card">
            <SectionHeader title={kid.display_name} />
            <div className="text-2xl font-semibold">
              {formatPence(balanceByKid.get(kid.id) ?? 0)}
            </div>
            <div className="text-sm text-slate-500">
              Pending approvals: {pendingByKid.get(kid.id) ?? 0}
            </div>
            <form action={payoutAction} className="mt-3 space-y-2">
              <input type="hidden" name="kidId" value={kid.id} />
              <input
                name="note"
                placeholder="Payout note"
                className="w-full"
              />
              <button type="submit" className="w-full">
                Payday (Reset to £0)
              </button>
            </form>
          </div>
        ))}
      </div>

      <div className="card">
        <SectionHeader
          title="Approvals"
          subtitle="Inbox of completion requests waiting for review."
        />
        <div className="space-y-3">
          {pendingRequests && pendingRequests.length > 0 ? (
            pendingRequests.map((request) => (
              <div
                key={request.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white p-3"
              >
                <div>
                  <div className="font-medium">{request.chore.title}</div>
                  <div className="text-xs text-slate-500">
                    {request.kid.display_name} · {formatDate(request.date)} ·
                    {" "}
                    {formatPence(request.chore.value_pence)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <form action={async () => approveCompletion(request.id)}>
                    <button type="submit" className="bg-emerald-500">
                      Approve
                    </button>
                  </form>
                  <form action={async () => denyCompletion(request.id)}>
                    <button type="submit" className="bg-rose-500">
                      Deny
                    </button>
                  </form>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-slate-400">No pending approvals.</div>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <SectionHeader
            title="Chore management"
            subtitle="Create new chores and update values."
          />
          <form action={createChoreAction} className="mb-4 space-y-2">
            <input
              name="title"
              placeholder="New chore title"
              required
              className="w-full"
            />
            <input
              name="value"
              type="number"
              placeholder="Value (pence)"
              required
              min={0}
              className="w-full"
            />
            <button type="submit" className="w-full">
              Add chore
            </button>
          </form>
          <div className="space-y-3">
            {chores?.map((chore) => (
              <form
                key={chore.id}
                action={updateChoreAction}
                className="rounded-xl border border-slate-100 bg-white p-3"
              >
                <input type="hidden" name="id" value={chore.id} />
                <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                  <input name="title" defaultValue={chore.title} />
                  <input
                    name="value"
                    type="number"
                    defaultValue={chore.value_pence}
                    className="md:w-32"
                  />
                </div>
                <label className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  <input
                    type="checkbox"
                    name="active"
                    defaultChecked={chore.active}
                  />
                  Active
                </label>
                <button type="submit" className="mt-2 w-full">
                  Update
                </button>
              </form>
            ))}
          </div>
        </div>

        <div className="card">
          <SectionHeader
            title="Scheduling"
            subtitle="Choose which days each chore is due."
          />
          <div className="space-y-3">
            {chores?.map((chore) => {
              const schedule = scheduleMap.get(chore.id);
              return (
                <form
                  key={chore.id}
                  action={scheduleAction}
                  className="rounded-xl border border-slate-100 bg-white p-3"
                >
                  <input type="hidden" name="choreId" value={chore.id} />
                  <div className="font-medium">{chore.title}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {weekdayLabels.map((day) => (
                      <label
                        key={`${chore.id}-${day.id}`}
                        className="flex items-center gap-1 text-xs text-slate-600"
                      >
                        <input
                          type="checkbox"
                          name="days"
                          value={day.id}
                          defaultChecked={schedule?.days_of_week?.includes(day.id)}
                        />
                        {day.label}
                      </label>
                    ))}
                  </div>
                  <button type="submit" className="mt-2 w-full">
                    Save schedule
                  </button>
                </form>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
