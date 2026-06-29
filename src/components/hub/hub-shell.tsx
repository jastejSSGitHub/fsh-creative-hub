import { HubContentFrame } from "@/components/hub/hub-content-frame";
import { HubScrollRegion } from "@/components/hub/hub-scroll-region";
import { HubDetailToolbarProvider } from "@/components/hub/hub-detail-toolbar";
import { HubHeader } from "@/components/hub/hub-header";
import { HubMobileBottomNav } from "@/components/hub/hub-mobile-bottom-nav";
import { HubOriginReturnHost } from "@/components/hub/hub-origin-return-host";
import { HubTabNavigationProvider } from "@/components/hub/hub-tab-navigation-provider";
import { HubTabPrefetcher } from "@/components/hub/hub-tab-prefetcher";
import { DevToolsHost } from "@/components/dev-tools/dev-tools-host";
import { MockCollaborationBanner } from "@/components/dev-tools/mock-collaboration-banner";
import { FeatureOnboardingHost } from "@/components/onboarding/feature-onboarding-host";
import { CollaborationOnboardingHost } from "@/components/collaboration-onboarding/collaboration-onboarding-host";
import { GlobalQuickAddHost } from "@/components/tasks/quick-add/global-quick-add-host";
import { DevToolsProvider } from "@/lib/dev-tools/dev-tools-context";
import { ProjectNavigationProvider } from "@/components/projects/project-navigation-provider";
import { getForYouCount } from "@/lib/inbox/queries";
import { isMockCollaborationEnabledServer } from "@/lib/dev-tools/mock-collaboration-cookie";
import { getMockForYouCount } from "@/lib/dev-tools/mock-collaboration-data";
import { getHubSupabase, requireHubSession } from "@/lib/hub/session";

type HubShellProps = {
  children: React.ReactNode;
};

export async function HubShell({ children }: HubShellProps) {
  const session = await requireHubSession();

  const mockEnabled = await isMockCollaborationEnabledServer();
  const supabase = await getHubSupabase();
  const forYouCount = mockEnabled
    ? getMockForYouCount()
    : await getForYouCount(supabase, session.userId);

  return (
    <HubDetailToolbarProvider>
      <DevToolsProvider
        isHubAdmin={session.isHubAdmin}
        userId={session.userId}
      >
        <ProjectNavigationProvider>
          <HubTabNavigationProvider>
            <div className="flex h-dvh flex-col overflow-hidden bg-hub-paper">
              <MockCollaborationBanner />
              <HubHeader
                forYouCount={forYouCount}
                displayName={session.displayName}
                email={session.email}
                avatarUrl={session.avatarUrl}
              />

              <HubScrollRegion>
                <HubContentFrame>{children}</HubContentFrame>
              </HubScrollRegion>

              <FeatureOnboardingHost userId={session.userId} />
              <CollaborationOnboardingHost userId={session.userId} />
              <GlobalQuickAddHost userId={session.userId} />
              <HubMobileBottomNav forYouCount={forYouCount} />
              <HubOriginReturnHost />
              <HubTabPrefetcher />
              <DevToolsHost />
            </div>
          </HubTabNavigationProvider>
        </ProjectNavigationProvider>
      </DevToolsProvider>
    </HubDetailToolbarProvider>
  );
}
