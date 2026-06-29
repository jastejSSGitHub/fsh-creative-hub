import { redirect } from "next/navigation";

import { HubDetailToolbarProvider } from "@/components/hub/hub-detail-toolbar";
import { HubHeader } from "@/components/hub/hub-header";
import { HubMain } from "@/components/hub/hub-main";
import { DevToolsHost } from "@/components/dev-tools/dev-tools-host";
import { MockCollaborationBanner } from "@/components/dev-tools/mock-collaboration-banner";
import { FeatureOnboardingHost } from "@/components/onboarding/feature-onboarding-host";
import { CollaborationOnboardingHost } from "@/components/collaboration-onboarding/collaboration-onboarding-host";
import { GlobalQuickAddHost } from "@/components/tasks/quick-add/global-quick-add-host";
import { HubMobileBottomNav } from "@/components/hub/hub-mobile-bottom-nav";
import { DevToolsProvider } from "@/lib/dev-tools/dev-tools-context";
import { ProjectNavigationProvider } from "@/components/projects/project-navigation-provider";
import { getForYouCount } from "@/lib/inbox/queries";
import { isMockCollaborationEnabledServer } from "@/lib/dev-tools/mock-collaboration-cookie";
import { getMockForYouCount } from "@/lib/dev-tools/mock-collaboration-data";
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

  const mockEnabled = await isMockCollaborationEnabledServer();
  const forYouCount = mockEnabled
    ? getMockForYouCount()
    : await getForYouCount(supabase, user.id);
  const isInbox = variant === "inbox";

  return (
    <HubDetailToolbarProvider>
      <DevToolsProvider
        isHubAdmin={displayProfile?.is_hub_admin ?? false}
        userId={user.id}
      >
        <ProjectNavigationProvider>
          <div className="flex min-h-full flex-col overflow-x-clip bg-hub-paper">
          <MockCollaborationBanner />
          <HubHeader
            forYouCount={forYouCount}
            displayName={displayName}
            email={email}
            avatarUrl={displayProfile?.avatar_url}
          />

          {isInbox ? (
            <main className="flex min-h-0 flex-1 pb-[calc(3.75rem+env(safe-area-inset-bottom))] lg:pb-0">
              {children}
            </main>
          ) : (
            <HubMain>{children}</HubMain>
          )}

          <FeatureOnboardingHost userId={user.id} />
          <CollaborationOnboardingHost userId={user.id} />
          <GlobalQuickAddHost userId={user.id} />
          <HubMobileBottomNav forYouCount={forYouCount} />
          <DevToolsHost />
          </div>
        </ProjectNavigationProvider>
      </DevToolsProvider>
    </HubDetailToolbarProvider>
  );
}
