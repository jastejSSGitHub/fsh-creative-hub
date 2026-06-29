export const MOCK_COLLABORATION_COOKIE = "fsh-mock-collaboration";

export async function isMockCollaborationEnabledServer(): Promise<boolean> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  return cookieStore.get(MOCK_COLLABORATION_COOKIE)?.value === "1";
}
