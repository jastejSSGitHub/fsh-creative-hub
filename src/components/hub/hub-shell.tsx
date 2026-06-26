import { redirect } from "next/navigation";
import Link from "next/link";

import { FeatureOnboardingHost } from "@/components/onboarding/feature-onboarding-host";
import { LOGIN_PATH, PROJECTS_PATH } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import type { HubProfile } from "@/types/database";
import { cn } from "@/lib/utils";

const HUB_CONTENT_CLASS = "mx-auto w-full max-w-6xl px-3 sm:px-6";

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
      <header className="border-b border-hub-espresso/10 bg-hub-espresso py-3 sm:py-3.5">
        <div
          className={cn(
            HUB_CONTENT_CLASS,
            "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
          )}
        >
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

          <form action="/auth/signout" method="post" className="shrink-0 self-end sm:self-auto">
            <button
              type="submit"
              className="inline-flex min-h-9 items-center rounded-md border border-white/12 px-2.5 font-mono text-[0.58rem] uppercase tracking-[0.1em] text-white/65 transition-colors hover:border-white/25 hover:text-white sm:px-3 sm:text-[0.62rem]"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 py-5 sm:py-10">
        <div className={cn(HUB_CONTENT_CLASS, "min-w-0")}>{children}</div>
      </main>
      <FeatureOnboardingHost userId={user.id} />
    </div>
  );
}
