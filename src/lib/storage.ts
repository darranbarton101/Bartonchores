export type RoleView = "home" | "parent" | "kid";

export type KidId = "mia" | "leo";

export type Chore = {
  id: string;
  title: string;
  valuePence: number;
  active: boolean;
};

export type Schedule = {
  choreId: string;
  days: number[];
};

export type TodayItem = {
  id: string;
  kidId: KidId;
  date: string;
  choreId: string;
};

export type CompletionStatus = "pending" | "approved" | "denied";

export type CompletionRequest = {
  id: string;
  kidId: KidId;
  choreId: string;
  date: string;
  status: CompletionStatus;
  reviewedBy?: string;
  reviewedAt?: string;
};

export type LedgerEntry = {
  id: string;
  kidId: KidId;
  type: "earn" | "payout";
  amountPence: number;
  note?: string;
  createdAt: string;
};

export type DataState = {
  chores: Chore[];
  schedules: Schedule[];
  todayList: TodayItem[];
  completionRequests: CompletionRequest[];
  ledgerEntries: LedgerEntry[];
};

export const kids: { id: KidId; name: string }[] = [
  { id: "mia", name: "Mia" },
  { id: "leo", name: "Leo" }
];

const STORAGE_KEY = "bartonchores-data";

const seedChores: Chore[] = [
  { id: "chore-1", title: "Make bed", valuePence: 50, active: true },
  { id: "chore-2", title: "Feed the cat", valuePence: 75, active: true },
  { id: "chore-3", title: "Clear the table", valuePence: 60, active: true },
  { id: "chore-4", title: "Pack school bag", valuePence: 40, active: true },
  { id: "chore-5", title: "Water plants", valuePence: 55, active: true },
  { id: "chore-6", title: "Tidy toys", valuePence: 80, active: true },
  { id: "chore-7", title: "Vacuum living room", valuePence: 120, active: true },
  { id: "chore-8", title: "Sort recycling", valuePence: 90, active: true },
  { id: "chore-9", title: "Wipe counters", valuePence: 70, active: true },
  { id: "chore-10", title: "Walk the dog", valuePence: 150, active: true }
];

const seedSchedules: Schedule[] = [
  { choreId: "chore-1", days: [0, 1, 2, 3, 4, 5, 6] },
  { choreId: "chore-2", days: [0, 1, 2, 3, 4, 5, 6] },
  { choreId: "chore-3", days: [1, 2, 3, 4, 5] },
  { choreId: "chore-4", days: [0, 1, 2, 3, 4] },
  { choreId: "chore-5", days: [2, 5] },
  { choreId: "chore-6", days: [1, 3, 5] },
  { choreId: "chore-7", days: [6] },
  { choreId: "chore-8", days: [4] },
  { choreId: "chore-9", days: [1, 4] },
  { choreId: "chore-10", days: [2, 6] }
];

export const createSeedState = (): DataState => ({
  chores: seedChores,
  schedules: seedSchedules,
  todayList: [],
  completionRequests: [],
  ledgerEntries: []
});

export const loadState = (): DataState => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const seed = createSeedState();
    saveState(seed);
    return seed;
  }
  try {
    return JSON.parse(stored) as DataState;
  } catch {
    const seed = createSeedState();
    saveState(seed);
    return seed;
  }
};

export const saveState = (state: DataState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const exportState = (state: DataState) => {
  return JSON.stringify(state, null, 2);
};

export const importState = (raw: string): DataState => {
  const parsed = JSON.parse(raw) as DataState;
  if (!parsed.chores || !parsed.schedules || !parsed.todayList) {
    throw new Error("Invalid import payload");
  }
  return parsed;
};
