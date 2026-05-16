export function formatDateLong(value) {
  if (!value) return "................";
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

export function formatCurrency(value) {
  const number = Number(value || 0);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  })
    .format(number)
    .replace(/\u00a0/g, " ");
}

export function splitDate(value) {
  if (!value) {
    return { date: "....", month: "............", year: "........" };
  }
  const parsed = new Date(`${value}T00:00:00`);
  return {
    date: new Intl.DateTimeFormat("id-ID", { day: "numeric" }).format(parsed),
    month: new Intl.DateTimeFormat("id-ID", { month: "long" }).format(parsed),
    year: new Intl.DateTimeFormat("id-ID", { year: "numeric" }).format(parsed)
  };
}

export function formatWeekday(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(new Date(`${value}T00:00:00`));
}
