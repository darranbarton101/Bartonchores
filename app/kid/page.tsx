import { redirect } from "next/navigation";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";
import { formatDate, formatPence, weekdayIndex } from "@/lib/utils";
import SectionHeader from "@/components/SectionHeader";
import {
  addToTodayList,
  requestCompletion,
  signOut
} from "@/app/actions";

const weekdayLabels = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat"
];

export default async function KidPage() {
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

  if (!profile || profile.role !== "kid") {
    redirect("/login");
  }

  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  const weekday = weekdayIndex(today);

  const { data: dueChores } = await supabase
    .from("chores")
    .select(
      "id, title, value_pence, active, chore_schedules!inner(days_of_week)"
    )
    .eq("active", true)
    .contains("chore_schedules.days_of_week", [weekday]);

  const { data: allChores } = await supabase
    .from("chores")
    .select("id, title, value_pence, active")
    .eq("active", true)
    .order("title");

  const { data: todayList } = await supabase
    .from("kid_today_list")
    .select("id, date, chore:chores(id, title, value_pence)")
    .eq("kid_id", profile.id)
    .eq("date", todayIso);

  const { data: completionRequests } = await supabase
    .from("completion_requests")
    .select("id, date, status, chore:chores(id, title, value_pence)")
    .eq("kid_id", profile.id)
    .eq("date", todayIso);

  const { data: ledgerEntries } = await supabase
    .from("ledger_entries")
    .select("id, created_at, type, amount_pence, note")
    .eq("kid_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const balance =
    ledgerEntries?.reduce((sum, entry) => sum + entry.amount_pence, 0) ?? 0;

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const weeklyEarned =
    ledgerEntries
      ?.filter(
        (entry) =>
          entry.type === "earn" && new Date(entry.created_at) >= weekStart
      )
      .reduce((sum, entry) => sum + entry.amount_pence, 0) ?? 0;

  const todayStatusMap = new Map(
    completionRequests?.map((request) => [request.chore.id, request]) ?? []
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Hello, {profile.display_name}</p>
          <h1 className="text-2xl font-semibold">Today&apos;s plan</h1>
          <p className="text-sm text-slate-500">
            {formatDate(todayIso)} · {weekdayLabels[weekday]}
          </p>
        </div>
        <form action={signOut}>
          <button type="submit" className="bg-slate-200 text-slate-700">
            Sign out
          </button>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <SectionHeader
            title="Balance"
            subtitle="Ledger-only total across all earnings and payouts."
          />
          <div className="text-3xl font-semibold text-slate-900">
            {formatPence(balance)}
          </div>
          <div className="mt-2 text-sm text-slate-500">
            This week earned: {formatPence(weeklyEarned)}
          </div>
        </div>
        <div className="card">
          <SectionHeader title="Ledger" subtitle="Most recent activity." />
          <ul className="space-y-2 text-sm">
            {ledgerEntries && ledgerEntries.length > 0 ? (
              ledgerEntries.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between rounded-lg bg-bubble px-3 py-2"
                >
                  <div>
                    <div className="font-medium capitalize">{entry.type}</div>
                    <div className="text-xs text-slate-500">
                      {formatDate(entry.created_at)}
                      {entry.note ? ` · ${entry.note}` : ""}
                    </div>
                  </div>
                  <div
                    className={`font-semibold ${
                      entry.amount_pence >= 0
                        ? "text-emerald-600"
                        : "text-rose-500"
                    }`}
                  >
                    {formatPence(entry.amount_pence)}
                  </div>
                </li>
              ))
            ) : (
              <li className="text-slate-400">No ledger activity yet.</li>
            )}
          </ul>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <SectionHeader
            title="Today list"
            subtitle="Add chores, mark them done, then wait for approval."
          />
          <div className="space-y-3">
            {todayList && todayList.length > 0 ? (
              todayList.map((item) => {
                const status = todayStatusMap.get(item.chore.id)?.status;
                return (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-white p-3"
                  >
                    <div>
                      <div className="font-medium">{item.chore.title}</div>
                      <div className="text-xs text-slate-500">
                        {formatPence(item.chore.value_pence)} · {status ?? "Not started"}
                      </div>
                    </div>
                    <form
                      action={async () =>
                        requestCompletion(profile.id, item.chore.id, todayIso)
                      }
                    >
                      <button
                        type="submit"
                        disabled={status === "pending" || status === "approved"}
                        className="bg-mint text-emerald-900"
                      >
                        {status === "approved"
                          ? "Approved"
                          : status === "pending"
                          ? "Pending"
                          : "Mark done"}
                      </button>
                    </form>
                  </div>
                );
              })
            ) : (
              <div className="text-sm text-slate-400">
                Nothing in your today list yet.
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <SectionHeader
            title="Due today"
            subtitle="Add chores due today or choose any active chore below."
          />
          <div className="space-y-3">
            {dueChores && dueChores.length > 0 ? (
              dueChores.map((chore) => (
                <div
                  key={chore.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-white p-3"
                >
                  <div>
                    <div className="font-medium">{chore.title}</div>
                    <div className="text-xs text-slate-500">
                      {formatPence(chore.value_pence)} · scheduled
                    </div>
                  </div>
                  <form
                    action={async () =>
                      addToTodayList(profile.id, chore.id, todayIso)
                    }
                  >
                    <button type="submit" className="bg-slate-100 text-slate-700">
                      Add
                    </button>
                  </form>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-400">No scheduled chores today.</div>
            )}
            <div className="border-t border-dashed border-slate-200 pt-3">
              <div className="text-xs uppercase tracking-wide text-slate-400">
                All chores
              </div>
              <ul className="mt-2 space-y-2">
                {allChores && allChores.length > 0 ? (
                  allChores.map((chore) => (
                    <li
                      key={chore.id}
                      className="flex items-center justify-between rounded-lg bg-white px-3 py-2"
                    >
                      <span>{chore.title}</span>
                      <form
                        action={async () =>
                          addToTodayList(profile.id, chore.id, todayIso)
                        }
                      >
                        <button
                          type="submit"
                          className="bg-slate-100 text-slate-700"
                        >
                          Add
                        </button>
                      </form>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-slate-400">No chores available.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
