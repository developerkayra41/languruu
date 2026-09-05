const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["second", 60],
  ["minute", 60],
  ["hour", 24],
  ["day", 30],
  ["month", 12],
];

export function formatRelativeTime(value: string | Date, locale: string): string {
  const then = value instanceof Date ? value.getTime() : new Date(value).getTime();
  if (Number.isNaN(then)) return "";

  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  let amount = Math.max(0, Math.round((Date.now() - then) / 1000));

  for (const [unit, step] of UNITS) {
    if (amount < step) return formatter.format(-amount, unit);
    amount = Math.round(amount / step);
  }
  return formatter.format(-amount, "year");
}
