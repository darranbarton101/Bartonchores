export const formatPence = (amount: number) => {
  const pounds = amount / 100;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP"
  }).format(pounds);
};

export const weekdayIndex = (date: Date) => {
  return date.getDay();
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-GB", {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
};
