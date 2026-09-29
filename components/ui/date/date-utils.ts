/** Tiny, dependency-free local-date helpers. All dates are normalized to local midnight. */

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const addMonths = (d: Date, n: number) => {
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(d.getDate(), last));
};
export const isSameDay = (a?: Date | null, b?: Date | null) =>
  !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
export const isSameMonth = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
export const compareDay = (a: Date, b: Date) => startOfDay(a).getTime() - startOfDay(b).getTime();

/** 0 = Sunday … 6 = Saturday. Uses Intl.Locale weekInfo when the runtime has it. */
export function getWeekStart(locale?: string): number {
  try {
    const info = (new Intl.Locale(locale ?? "en-US") as unknown as { weekInfo?: { firstDay: number }; getWeekInfo?: () => { firstDay: number } });
    const first = (info.getWeekInfo?.() ?? info.weekInfo)?.firstDay;
    if (first) return first % 7;
  } catch { /* fall through */ }
  return 0;
}

/** Weeks (arrays of 7 dates) covering the month, including leading / trailing days. */
export function getMonthGrid(month: Date, weekStartsOn: number): Date[][] {
  const first = startOfMonth(month);
  const offset = (first.getDay() - weekStartsOn + 7) % 7;
  const start = addDays(first, -offset);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const weeks = Math.ceil((offset + daysInMonth) / 7);
  return Array.from({ length: weeks }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)));
}

export function getWeekdayNames(locale: string | undefined, weekStartsOn: number, width: "narrow" | "short" | "long" = "short") {
  const fmt = new Intl.DateTimeFormat(locale, { weekday: width });
  // 2024-01-07 was a Sunday.
  return Array.from({ length: 7 }, (_, i) => {
    const day = (weekStartsOn + i) % 7;
    return { day, label: fmt.format(new Date(2024, 0, 7 + day)), long: new Intl.DateTimeFormat(locale, { weekday: "long" }).format(new Date(2024, 0, 7 + day)) };
  });
}

export const formatMonthYear = (d: Date, locale?: string) => new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(d);
export const formatFullDate = (d: Date, locale?: string) => new Intl.DateTimeFormat(locale, { dateStyle: "full" }).format(d);

/** yyyy-mm-dd, in local time. Matches <input type="date"> and form submission. */
export const toISODate = (d: Date) =>
  `${String(d.getFullYear()).padStart(4, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function fromISODate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}
