export type ProfileRole = "adult" | "kid";

export type Profile = {
  id: string;
  role: ProfileRole;
  display_name: string;
};

export type Chore = {
  id: string;
  title: string;
  value_pence: number;
  active: boolean;
};

export type ChoreSchedule = {
  id: string;
  chore_id: string;
  days_of_week: number[];
};

export type TodayListItem = {
  id: string;
  date: string;
  chore_id: string;
  chore: Chore;
};

export type CompletionRequest = {
  id: string;
  date: string;
  status: "pending" | "approved" | "denied";
  chore: Chore;
  kid: Profile;
};

export type LedgerEntry = {
  id: string;
  created_at: string;
  type: "earn" | "payout";
  amount_pence: number;
  note: string | null;
};
