const E2E_USER_EMAIL_PATTERN = /^e2e-user-[a-z0-9-]+@fshdesign\.local$/i;
const E2E_USER_NAME_PATTERN = /^E2E User(\s|$)/i;

type E2eUserProfile = {
  display_name?: string | null;
  email?: string | null;
};

/** Automation accounts used by Playwright — hidden from member/presence UI. */
export function isE2eTestUser(profile: E2eUserProfile): boolean {
  const email = profile.email?.trim().toLowerCase();
  if (email && E2E_USER_EMAIL_PATTERN.test(email)) return true;

  const name = profile.display_name?.trim();
  if (name && E2E_USER_NAME_PATTERN.test(name)) return true;

  return false;
}

export function filterE2eTestUsers<T extends E2eUserProfile>(users: T[]): T[] {
  return users.filter((user) => !isE2eTestUser(user));
}

export function isE2ePresenceUser(user: { displayName: string }): boolean {
  return isE2eTestUser({ display_name: user.displayName });
}
