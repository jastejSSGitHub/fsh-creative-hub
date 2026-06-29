export function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatTaskDueDate(iso: string, options?: { includeTime?: boolean }): string {
  const date = new Date(iso);
  const includeTime = options?.includeTime ?? true;

  const datePart = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  if (!includeTime) return datePart;

  const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0;
  if (!hasTime) return datePart;

  const timePart = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${datePart}, ${timePart}`;
}
