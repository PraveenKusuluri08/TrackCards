/**
 * Get the date (year, month, day) in a given timezone for a given moment.
 */
export function getDateInTimezone(date: Date, timezone: string): { year: number; month: number; day: number } {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone || "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const get = (type: string) => parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10);
  return { year: get("year"), month: get("month"), day: get("day") };
}

/**
 * Add days to a date (year, month, day) and return the new date parts.
 */
export function addDaysToDate(
  year: number,
  month: number,
  day: number,
  days: number
): { year: number; month: number; day: number } {
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + days);
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
  };
}

/**
 * Check if two date parts are equal.
 */
export function datePartsEqual(
  a: { year: number; month: number; day: number },
  b: { year: number; month: number; day: number }
): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}
