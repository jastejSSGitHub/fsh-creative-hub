const INVITE_EMAIL_DOMAIN = "fshdesign.org";

const EMAIL_PATTERN =
  /^[a-z0-9](?:[a-z0-9._%+-]{0,62}[a-z0-9])?@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

const DISPOSABLE_LOCAL_PARTS = new Set([
  "test",
  "asdf",
  "fake",
  "none",
  "no",
  "null",
  "undefined",
  "admin",
  "user",
  "email",
]);

export function normalizeInviteEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateInviteEmail(
  email: string,
): { ok: true; email: string } | { ok: false; error: string } {
  const normalized = normalizeInviteEmail(email);

  if (!normalized) {
    return { ok: false, error: "Enter a work email to invite." };
  }

  if (normalized.length > 254) {
    return { ok: false, error: "That email address is too long." };
  }

  if (!EMAIL_PATTERN.test(normalized)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const [localPart, domain] = normalized.split("@");

  if (!localPart || !domain) {
    return { ok: false, error: "Enter a valid email address." };
  }

  if (localPart.includes("..") || domain.includes("..")) {
    return { ok: false, error: "Enter a valid email address." };
  }

  if (DISPOSABLE_LOCAL_PARTS.has(localPart)) {
    return { ok: false, error: "Use a real work email, not a placeholder address." };
  }

  if (domain !== INVITE_EMAIL_DOMAIN) {
    return {
      ok: false,
      error: `Invites must use an @${INVITE_EMAIL_DOMAIN} work email.`,
    };
  }

  return { ok: true, email: normalized };
}

export function inviteEmailDomain(): string {
  return INVITE_EMAIL_DOMAIN;
}
