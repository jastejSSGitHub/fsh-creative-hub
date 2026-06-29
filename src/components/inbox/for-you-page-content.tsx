import { ForYouInbox } from "@/components/inbox/for-you-inbox";
import { filterForYouByLens, forYouLensCounts } from "@/lib/inbox/lenses";
import { getForYouItems } from "@/lib/inbox/queries";
import { getSharedWithMeTree } from "@/lib/inbox/sidebar-queries";
import { isMockCollaborationEnabledServer } from "@/lib/dev-tools/mock-collaboration-cookie";
import {
  getMockForYouItems,
  getMockSharedProjects,
} from "@/lib/dev-tools/mock-collaboration-data";
import { getHubSupabase, requireHubSession } from "@/lib/hub/session";
import type { ForYouLens } from "@/lib/routes";

type ForYouPageContentProps = {
  lens: ForYouLens;
};

export async function ForYouPageContent({ lens }: ForYouPageContentProps) {
  const session = await requireHubSession();
  const mockEnabled = await isMockCollaborationEnabledServer();

  const [items, sharedProjects, profile] = mockEnabled
    ? [getMockForYouItems(), getMockSharedProjects(), null]
    : await (async () => {
        const supabase = await getHubSupabase();
        return Promise.all([
          getForYouItems(supabase, session.userId),
          getSharedWithMeTree(supabase, session.userId),
          supabase
            .from("hub_profiles")
            .select("display_name, avatar_url")
            .eq("id", session.userId)
            .maybeSingle()
            .then(({ data }) => data),
        ]);
      })();

  const filteredItems = filterForYouByLens(items, lens, session.userId);
  const itemCounts = forYouLensCounts(items);

  return (
    <ForYouInbox
      lens={lens}
      allItems={items}
      items={filteredItems}
      itemCounts={itemCounts}
      sharedProjects={sharedProjects}
      userId={session.userId}
      userDisplayName={
        profile?.display_name ?? session.displayName
      }
      userAvatarUrl={profile?.avatar_url ?? session.avatarUrl}
    />
  );
}
