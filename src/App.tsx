import { useMemo, useState } from "react";
import SectionHeader from "./components/SectionHeader";
import {
  createSeedState,
  exportState,
  importState,
  kids,
  loadState,
  saveState,
  type Chore,
  type CompletionRequest,
  type CompletionStatus,
  type DataState,
  type KidId
} from "./lib/storage";
import {
  balanceForKid,
  formatDate,
  formatPence,
  todayIso,
  uniqueId,
  weekdayLabels,
  weeklyEarned
} from "./lib/utils";

const defaultNote = "Weekly pocket money";

const statusLabel = (status?: CompletionStatus) => {
  if (!status) return "Not started";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export default function App() {
  const [view, setView] = useState<"home" | "parent" | KidId>("home");
  const [state, setState] = useState<DataState>(() => loadState());
  const [importError, setImportError] = useState<string | null>(null);

  const updateState = (next: DataState) => {
    setState(next);
    saveState(next);
  };

  const today = todayIso();
  const weekday = new Date().getDay();

  const choreById = useMemo(
    () => new Map(state.chores.map((chore) => [chore.id, chore])),
    [state.chores]
  );

  const scheduleByChore = useMemo(
    () => new Map(state.schedules.map((schedule) => [schedule.choreId, schedule])),
    [state.schedules]
  );

  const completionByKey = useMemo(() => {
    const map = new Map<string, CompletionRequest>();
    state.completionRequests.forEach((request) => {
      map.set(`${request.kidId}-${request.date}-${request.choreId}`, request);
    });
    return map;
  }, [state.completionRequests]);

  const pendingRequests = state.completionRequests.filter(
    (request) => request.status === "pending"
  );

  const handleAddChore = (title: string, valuePence: number) => {
    const newChore: Chore = {
      id: uniqueId("chore"),
      title,
      valuePence,
      active: true
    };
    updateState({
      ...state,
      chores: [...state.chores, newChore]
    });
  };

  const handleUpdateChore = (chore: Chore) => {
    updateState({
      ...state,
      chores: state.chores.map((item) => (item.id === chore.id ? chore : item))
    });
  };

  const handleSchedule = (choreId: string, days: number[]) => {
    const nextSchedules = state.schedules.some((schedule) => schedule.choreId === choreId)
      ? state.schedules.map((schedule) =>
          schedule.choreId === choreId ? { ...schedule, days } : schedule
        )
      : [...state.schedules, { choreId, days }];

    updateState({
      ...state,
      schedules: nextSchedules
    });
  };

  const handleAddToToday = (kidId: KidId, choreId: string) => {
    const exists = state.todayList.some(
      (item) => item.kidId === kidId && item.date === today && item.choreId === choreId
    );
    if (exists) return;
    updateState({
      ...state,
      todayList: [
        ...state.todayList,
        { id: uniqueId("today"), kidId, date: today, choreId }
      ]
    });
  };

  const handleRequestCompletion = (kidId: KidId, choreId: string) => {
    const key = `${kidId}-${today}-${choreId}`;
    const existing = completionByKey.get(key);
    const nextRequests = existing
      ? state.completionRequests.map((request) =>
          request.id === existing.id
            ? { ...request, status: "pending" }
            : request
        )
      : [
          ...state.completionRequests,
          {
            id: uniqueId("request"),
            kidId,
            choreId,
            date: today,
            status: "pending"
          }
        ];

    updateState({
      ...state,
      completionRequests: nextRequests
    });
  };

  const handleApprove = (requestId: string) => {
    const request = state.completionRequests.find((item) => item.id === requestId);
    if (!request || request.status !== "pending") return;
    const chore = choreById.get(request.choreId);
    if (!chore) return;

    const updatedRequests = state.completionRequests.map((item) =>
      item.id === requestId
        ? { ...item, status: "approved", reviewedBy: "Parent", reviewedAt: new Date().toISOString() }
        : item
    );

    const newEntry = {
      id: uniqueId("ledger"),
      kidId: request.kidId,
      type: "earn" as const,
      amountPence: chore.valuePence,
      note: "Chore approved",
      createdAt: new Date().toISOString()
    };

    updateState({
      ...state,
      completionRequests: updatedRequests,
      ledgerEntries: [newEntry, ...state.ledgerEntries]
    });
  };

  const handleDeny = (requestId: string) => {
    updateState({
      ...state,
      completionRequests: state.completionRequests.map((item) =>
        item.id === requestId
          ? { ...item, status: "denied", reviewedBy: "Parent", reviewedAt: new Date().toISOString() }
          : item
      )
    });
  };

  const handlePayday = (kidId: KidId, note: string) => {
    const currentBalance = balanceForKid(state.ledgerEntries, kidId);
    if (currentBalance === 0) return;
    const payoutEntry = {
      id: uniqueId("ledger"),
      kidId,
      type: "payout" as const,
      amountPence: -currentBalance,
      note,
      createdAt: new Date().toISOString()
    };
    updateState({
      ...state,
      ledgerEntries: [payoutEntry, ...state.ledgerEntries]
    });
  };

  const handleExport = () => {
    const blob = new Blob([exportState(state)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bartonchores-${today}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (value: string) => {
    try {
      const imported = importState(value);
      updateState(imported);
      setImportError(null);
    } catch (error) {
      setImportError((error as Error).message);
    }
  };

  const resetData = () => {
    const seed = createSeedState();
    updateState(seed);
  };

  return (
    <>
      <header>
        <div>
          <div style={{ fontWeight: 700 }}>Barton Chores</div>
          <div className="small">LocalStorage ledger + approvals</div>
        </div>
        <div className="toolbar">
          {view !== "home" ? (
            <button className="secondary" onClick={() => setView("home")}
              type="button"
            >
              Switch role
            </button>
          ) : null}
          <button className="secondary" type="button" onClick={resetData}>
            Reset data
          </button>
        </div>
      </header>
      <main>
        {view === "home" ? (
          <div className="grid grid-2">
            <div className="card stack">
              <SectionHeader
                title="Choose a role"
                subtitle="Local-only demo. Data is stored in this browser."
              />
              <button type="button" onClick={() => setView("parent")}>Parent dashboard</button>
              <div className="stack">
                {kids.map((kid) => (
                  <button key={kid.id} type="button" className="secondary" onClick={() => setView(kid.id)}>
                    Kid view: {kid.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="card stack">
              <SectionHeader title="Export / Import" subtitle="Move data between devices." />
              <button type="button" onClick={handleExport}>Export JSON</button>
              <textarea
                rows={6}
                placeholder="Paste JSON to import"
                onChange={(event) => handleImport(event.target.value)}
              />
              {importError ? <div className="badge denied">{importError}</div> : null}
            </div>
          </div>
        ) : view === "parent" ? (
          <div className="stack">
            <div className="grid grid-3">
              {kids.map((kid) => (
                <div key={kid.id} className="card stack">
                  <SectionHeader title={kid.name} />
                  <div style={{ fontSize: 28, fontWeight: 700 }}>
                    {formatPence(balanceForKid(state.ledgerEntries, kid.id))}
                  </div>
                  <div className="muted">
                    Pending approvals: {pendingRequests.filter((req) => req.kidId === kid.id).length}
                  </div>
                  <div className="stack">
                    <input
                      placeholder="Payout note"
                      defaultValue={defaultNote}
                      onBlur={(event) => handlePayday(kid.id, event.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => handlePayday(kid.id, defaultNote)}
                    >
                      Payday (Reset to £0)
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="card">
              <SectionHeader title="Approvals inbox" subtitle="Approve or deny completion requests." />
              <div className="list">
                {pendingRequests.length > 0 ? (
                  pendingRequests.map((request) => {
                    const chore = choreById.get(request.choreId);
                    if (!chore) return null;
                    return (
                      <div key={request.id} className="item">
                        <div>
                          <div style={{ fontWeight: 600 }}>{chore.title}</div>
                          <div className="muted">
                            {kids.find((kid) => kid.id === request.kidId)?.name} · {formatDate(request.date)} · {formatPence(chore.valuePence)}
                          </div>
                        </div>
                        <div className="toolbar">
                          <button type="button" onClick={() => handleApprove(request.id)}>Approve</button>
                          <button type="button" className="secondary" onClick={() => handleDeny(request.id)}>Deny</button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="muted">No pending requests.</div>
                )}
              </div>
            </div>

            <div className="grid grid-2">
              <div className="card stack">
                <SectionHeader title="Chore management" subtitle="Add, edit, or archive chores." />
                <ChoreForm onCreate={handleAddChore} />
                <div className="list">
                  {state.chores.map((chore) => (
                    <ChoreEditor
                      key={chore.id}
                      chore={chore}
                      onUpdate={handleUpdateChore}
                    />
                  ))}
                </div>
              </div>
              <div className="card stack">
                <SectionHeader title="Scheduling" subtitle="Select due days for each chore." />
                <div className="list">
                  {state.chores.map((chore) => (
                    <ScheduleEditor
                      key={chore.id}
                      chore={chore}
                      days={scheduleByChore.get(chore.id)?.days ?? []}
                      onSave={handleSchedule}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <KidView
            kidId={view}
            state={state}
            onAddToToday={handleAddToToday}
            onRequestCompletion={handleRequestCompletion}
            completionByKey={completionByKey}
          />
        )}
      </main>
    </>
  );
}

function ChoreForm({ onCreate }: { onCreate: (title: string, value: number) => void }) {
  const [title, setTitle] = useState("");
  const [value, setValue] = useState(50);

  return (
    <form
      className="stack"
      onSubmit={(event) => {
        event.preventDefault();
        if (!title.trim()) return;
        onCreate(title.trim(), value);
        setTitle("");
        setValue(50);
      }}
    >
      <input value={title} placeholder="Chore title" onChange={(event) => setTitle(event.target.value)} />
      <input
        type="number"
        min={0}
        value={value}
        onChange={(event) => setValue(Number(event.target.value))}
      />
      <button type="submit">Add chore</button>
    </form>
  );
}

function ChoreEditor({ chore, onUpdate }: { chore: Chore; onUpdate: (chore: Chore) => void }) {
  const [local, setLocal] = useState(chore);

  return (
    <form
      className="item"
      onSubmit={(event) => {
        event.preventDefault();
        onUpdate(local);
      }}
    >
      <div style={{ flex: 1 }}>
        <input
          value={local.title}
          onChange={(event) => setLocal({ ...local, title: event.target.value })}
        />
        <div className="small">Value in pence</div>
        <input
          type="number"
          min={0}
          value={local.valuePence}
          onChange={(event) => setLocal({ ...local, valuePence: Number(event.target.value) })}
        />
        <label className="toolbar" style={{ gap: "6px" }}>
          <input
            type="checkbox"
            checked={local.active}
            onChange={(event) => setLocal({ ...local, active: event.target.checked })}
          />
          Active
        </label>
      </div>
      <button type="submit">Save</button>
    </form>
  );
}

function ScheduleEditor({
  chore,
  days,
  onSave
}: {
  chore: Chore;
  days: number[];
  onSave: (choreId: string, days: number[]) => void;
}) {
  const [selected, setSelected] = useState(days);

  const toggleDay = (day: number) => {
    setSelected((prev) =>
      prev.includes(day) ? prev.filter((item) => item !== day) : [...prev, day]
    );
  };

  return (
    <div className="item" style={{ alignItems: "flex-start" }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600 }}>{chore.title}</div>
        <div className="toolbar">
          {weekdayLabels.map((label, idx) => (
            <button
              key={label}
              type="button"
              className={selected.includes(idx) ? "badge approved" : "badge"}
              onClick={() => toggleDay(idx)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <button type="button" className="secondary" onClick={() => onSave(chore.id, selected)}>
        Save
      </button>
    </div>
  );
}

function KidView({
  kidId,
  state,
  completionByKey,
  onAddToToday,
  onRequestCompletion
}: {
  kidId: KidId;
  state: DataState;
  completionByKey: Map<string, CompletionRequest>;
  onAddToToday: (kidId: KidId, choreId: string) => void;
  onRequestCompletion: (kidId: KidId, choreId: string) => void;
}) {
  const today = todayIso();
  const weekday = new Date().getDay();
  const kid = kids.find((entry) => entry.id === kidId);

  const todayList = state.todayList.filter((item) => item.kidId === kidId && item.date === today);
  const dueChores = state.chores.filter((chore) => {
    if (!chore.active) return false;
    const schedule = state.schedules.find((item) => item.choreId === chore.id);
    return schedule?.days.includes(weekday);
  });

  const ledgerEntries = state.ledgerEntries.filter((entry) => entry.kidId === kidId).slice(0, 12);

  return (
    <div className="stack">
      <div className="card">
        <div className="muted">Hello, {kid?.name}</div>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Today&apos;s plan</h1>
        <div className="muted">
          {formatDate(today)} · {weekdayLabels[weekday]}
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card stack">
          <SectionHeader title="Balance" subtitle="Ledger-only total." />
          <div style={{ fontSize: 32, fontWeight: 700 }}>
            {formatPence(balanceForKid(state.ledgerEntries, kidId))}
          </div>
          <div className="muted">
            This week earned: {formatPence(weeklyEarned(state.ledgerEntries, kidId))}
          </div>
        </div>
        <div className="card stack">
          <SectionHeader title="Ledger" subtitle="Recent earnings and payouts." />
          <div className="list">
            {ledgerEntries.length > 0 ? (
              ledgerEntries.map((entry) => (
                <div key={entry.id} className="item">
                  <div>
                    <div style={{ fontWeight: 600 }}>{entry.type}</div>
                    <div className="small">
                      {formatDate(entry.createdAt)}{entry.note ? ` · ${entry.note}` : ""}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, color: entry.amountPence >= 0 ? "#166534" : "#b91c1c" }}>
                    {formatPence(entry.amountPence)}
                  </div>
                </div>
              ))
            ) : (
              <div className="muted">No ledger activity yet.</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card stack">
          <SectionHeader title="Today list" subtitle="Mark chores done and wait for approval." />
          <div className="list">
            {todayList.length > 0 ? (
              todayList.map((item) => {
                const status = completionByKey.get(`${kidId}-${today}-${item.choreId}`)?.status;
                const chore = state.chores.find((entry) => entry.id === item.choreId);
                if (!chore) return null;
                return (
                  <div key={item.id} className="item">
                    <div>
                      <div style={{ fontWeight: 600 }}>{chore.title}</div>
                      <div className="small">
                        {formatPence(chore.valuePence)} · {statusLabel(status)}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={status === "pending" || status === "approved"}
                      className={status === "approved" ? "secondary" : ""}
                      onClick={() => onRequestCompletion(kidId, chore.id)}
                    >
                      {status === "approved" ? "Approved" : status === "pending" ? "Pending" : "Mark done"}
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="muted">Nothing in your today list yet.</div>
            )}
          </div>
        </div>
        <div className="card stack">
          <SectionHeader title="Due today" subtitle="Add chores to today list." />
          <div className="list">
            {dueChores.length > 0 ? (
              dueChores.map((chore) => (
                <div key={chore.id} className="item">
                  <div>
                    <div style={{ fontWeight: 600 }}>{chore.title}</div>
                    <div className="small">{formatPence(chore.valuePence)} · scheduled</div>
                  </div>
                  <button type="button" className="secondary" onClick={() => onAddToToday(kidId, chore.id)}>
                    Add
                  </button>
                </div>
              ))
            ) : (
              <div className="muted">No scheduled chores today.</div>
            )}
            <div className="stack">
              <div className="small">All chores</div>
              {state.chores.filter((chore) => chore.active).map((chore) => (
                <div key={chore.id} className="item">
                  <span>{chore.title}</span>
                  <button type="button" className="secondary" onClick={() => onAddToToday(kidId, chore.id)}>
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
