import type { LedgerEntry } from "./storage";

export const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const formatPence = (amount: number) => {
  const pounds = amount / 100;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP"
  }).format(pounds);
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-GB", {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
};

export const todayIso = () => new Date().toISOString().slice(0, 10);

export const balanceForKid = (entries: LedgerEntry[], kidId: string) => {
  return entries
    .filter((entry) => entry.kidId === kidId)
    .reduce((sum, entry) => sum + entry.amountPence, 0);
};

export const weeklyEarned = (entries: LedgerEntry[], kidId: string) => {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  return entries
    .filter((entry) => entry.kidId === kidId)
    .filter((entry) => entry.type === "earn")
    .filter((entry) => new Date(entry.createdAt) >= weekStart)
    .reduce((sum, entry) => sum + entry.amountPence, 0);
};

export const uniqueId = (prefix: string) => {
  return `${prefix}-${crypto.randomUUID()}`;
};
