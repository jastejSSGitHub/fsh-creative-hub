import { redirect } from "next/navigation";

import { FeatureOnboardingHost } from "@/components/onboarding/feature-onboarding-host";
import { LOGIN_PATH, PROJECTS_PATH } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import type { HubProfile } from "@/types/database";
import Link from "next/link";

type HubShellProps = {
  children: React.ReactNode;
};

export async function HubShell({ children }: HubShellProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(LOGIN_PATH);
  }

  const { data: profile } = await supabase
    .from("hub_profiles")
    .select("id, email, display_name, avatar_url, created_at")
    .eq("id", user.id)
    .maybeSingle();

  const displayProfile = profile as HubProfile | null;
  const displayName =
    displayProfile?.display_name ??
    user.user_metadata?.full_name ??
    user.email?.split("@")[0] ??
    "User";

  return (
    <div className="flex min-h-full flex-col overflow-x-clip bg-hub-paper">
      <header className="border-b border-hub-espresso/10 bg-hub-espresso px-3 py-3 sm:px-6 sm:py-3.5">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
          <div className="min-w-0">
            <Link
              href={PROJECTS_PATH}
              className="block font-display text-base font-extrabold tracking-tight text-hub-final sm:text-lg lg:text-xl"
            >
              FSH Creative Hub
            </Link>
            <p className="truncate font-mono text-[0.58rem] uppercase tracking-[0.14em] text-white/40">
              Signed in as {displayName}
            </p>
          </div>

          <div className="flex w-full items-center justify-end border-t border-white/10 pt-3 md:w-auto md:border-0 md:pt-0">
            <form action="/auth/signout" method="post" className="flex items-center">
              <button
                type="submit"
                className="inline-flex min-h-9 items-center rounded-md border border-white/12 px-2.5 font-mono text-[0.58rem] uppercase tracking-[0.1em] text-white/65 transition-colors hover:border-white/25 hover:text-white sm:px-3 sm:text-[0.62rem]"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-3 py-5 sm:px-6 sm:py-10">
        {children}
      </main>
      <FeatureOnboardingHost userId={user.id} />
    </div>
  );
}
