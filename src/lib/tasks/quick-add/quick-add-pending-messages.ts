export const QUICK_ADD_PENDING_MESSAGES = [
  "Teaching your task its name…",
  "Finding a cozy spot on the list…",
  "Negotiating with the calendar…",
  "Bribing the server with good vibes…",
  "Herding pixels into a todo…",
  "Making room on the board…",
  "Polishing the checkbox for later…",
  "Consulting the productivity committee…",
  "One moment — magic in progress…",
  "Building your task, byte by byte…",
  "Tucking it in with the other tasks…",
  "Asking the cloud nicely…",
] as const;

export const QUICK_ADD_PENDING_STAGE_MS = 1_150;

export function pickQuickAddPendingMessage(
  exclude?: string,
): (typeof QUICK_ADD_PENDING_MESSAGES)[number] {
  const pool =
    exclude && QUICK_ADD_PENDING_MESSAGES.length > 1
      ? QUICK_ADD_PENDING_MESSAGES.filter((message) => message !== exclude)
      : QUICK_ADD_PENDING_MESSAGES;

  return pool[Math.floor(Math.random() * pool.length)]!;
}
