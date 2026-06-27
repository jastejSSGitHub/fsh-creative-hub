const RLS_PATTERNS = [
  /row-level security policy/i,
  /permission denied/i,
  /violates .* policy/i,
];

const NETWORK_PATTERNS = [/fetch failed/i, /network/i, /timeout/i, /ECONNREFUSED/i];

export function toUserFacingError(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";

  if (!message.trim()) {
    return fallback;
  }

  if (RLS_PATTERNS.some((pattern) => pattern.test(message))) {
    return "We couldn't save that just now. Please try again in a moment.";
  }

  if (NETWORK_PATTERNS.some((pattern) => pattern.test(message))) {
    return "We're having trouble connecting. Check your network and try again.";
  }

  if (/duplicate key|unique constraint/i.test(message)) {
    return "That already exists. Try a different name.";
  }

  if (/required|must be signed in/i.test(message)) {
    return message;
  }

  if (/^[A-Za-z].*[.!?]$/.test(message) && message.length < 120 && !message.includes("violates")) {
    return message;
  }

  return fallback;
}
