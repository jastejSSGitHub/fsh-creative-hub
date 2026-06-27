import { redirect } from "next/navigation";

import { HubDetailToolbarProvider } from "@/components/hub/hub-detail-toolbar";
import { HubHeader } from "@/components/hub/hub-header";
import { HubMain } from "@/components/hub/hub-main";
import { DevToolsHost } from "@/components/dev-tools/dev-tools-host";
import { FeatureOnboardingHost } from "@/components/onboarding/feature-onboarding-host";
import { DevToolsProvider } from "@/lib/dev-tools/dev-tools-context";
import { getForYouCount } from "@/lib/inbox/queries";
import { LOGIN_PATH } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import type { HubProfile } from "@/types/database";

type HubShellProps = {
  children: React.ReactNode;
  /** Full-bleed layout without max-width content wrapper (For You with sidebar). */
  variant?: "default" | "inbox";
};

export async function HubShell({ children, variant = "default" }: HubShellProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(LOGIN_PATH);
  }

  const { data: profile } = await supabase
    .from("hub_profiles")
    .select("id, email, display_name, avatar_url, is_hub_admin, created_at")
    .eq("id", user.id)
    .maybeSingle();

  const displayProfile = profile as HubProfile | null;
  const displayName =
    displayProfile?.display_name ??
    user.user_metadata?.full_name ??
    user.email?.split("@")[0] ??
    "User";
  const email = displayProfile?.email ?? user.email ?? "";

  const forYouCount = await getForYouCount(supabase, user.id);
  const isInbox = variant === "inbox";

  return (
    <HubDetailToolbarProvider>
      <DevToolsProvider isHubAdmin={displayProfile?.is_hub_admin ?? false}>
        <div className="flex min-h-full flex-col overflow-x-clip bg-hub-paper">
          <HubHeader
            forYouCount={forYouCount}
            displayName={displayName}
            email={email}
            avatarUrl={displayProfile?.avatar_url}
          />

          {isInbox ? (
            <main className="flex-1">{children}</main>
          ) : (
            <HubMain>{children}</HubMain>
          )}

          <FeatureOnboardingHost userId={user.id} />
          <DevToolsHost />
        </div>
      </DevToolsProvider>
    </HubDetailToolbarProvider>
  );
}
