/** Compute the next due date from a recurring rule after completion. */

const DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

function nextWeekday(from: Date, weekday: number): Date {
  const current = from.getDay();
  let delta = (weekday - current + 7) % 7;
  if (delta === 0) delta = 7;
  return addDays(from, delta);
}

export function computeNextDueDate(
  rule: string,
  completedAt: Date = new Date(),
): Date | null {
  const normalized = rule.trim().toLowerCase();
  if (!normalized.startsWith("every")) return null;

  const rest = normalized.replace(/^every\s*/i, "").trim();

  if (rest === "day") {
    return addDays(completedAt, 1);
  }

  const everyNDays = rest.match(/^(\d+)\s+days?$/);
  if (everyNDays) {
    return addDays(completedAt, Number(everyNDays[1]));
  }

  const everyNWeeks = rest.match(/^(\d+)\s+weeks?$/);
  if (everyNWeeks) {
    return addWeeks(completedAt, Number(everyNWeeks[1]));
  }

  const everyOther = rest.match(/^other\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/);
  if (everyOther) {
    const dayIndex = DAY_NAMES.indexOf(everyOther[1] as (typeof DAY_NAMES)[number]);
    return addWeeks(nextWeekday(completedAt, dayIndex), 1);
  }

  const everyDay = rest.match(/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/);
  if (everyDay) {
    const dayIndex = DAY_NAMES.indexOf(everyDay[1] as (typeof DAY_NAMES)[number]);
    return nextWeekday(completedAt, dayIndex);
  }

  const firstWeekday = rest.match(
    /^first\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/,
  );
  if (firstWeekday) {
    const dayIndex = DAY_NAMES.indexOf(
      firstWeekday[1] as (typeof DAY_NAMES)[number],
    );
    const next = new Date(completedAt);
    next.setMonth(next.getMonth() + 1, 1);
    while (next.getDay() !== dayIndex) {
      next.setDate(next.getDate() + 1);
    }
    return next;
  }

  return addDays(completedAt, 7);
}
