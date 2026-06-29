import { redirect } from "next/navigation";

import { ForYouInbox } from "@/components/inbox/for-you-inbox";
import { filterForYouByLens, forYouLensCounts } from "@/lib/inbox/lenses";
import { getForYouItems } from "@/lib/inbox/queries";
import { getSharedWithMeTree } from "@/lib/inbox/sidebar-queries";
import { isMockCollaborationEnabledServer } from "@/lib/dev-tools/mock-collaboration-cookie";
import {
  getMockForYouItems,
  getMockSharedProjects,
} from "@/lib/dev-tools/mock-collaboration-data";
import { LOGIN_PATH, type ForYouLens } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

type ForYouPageProps = {
  searchParams: Promise<{ lens?: string }>;
};

function parseLens(raw: string | undefined): ForYouLens {
  if (
    raw === "replies" ||
    raw === "assigned" ||
    raw === "waiting-on-others" ||
    raw === "following" ||
    raw === "your-uploads"
  ) {
    return raw;
  }
  return "needs-you";
}

export default async function ForYouPage({ searchParams }: ForYouPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(LOGIN_PATH);

  const params = await searchParams;
  const lens = parseLens(params.lens);
  const mockEnabled = await isMockCollaborationEnabledServer();

  const [items, sharedProjects, profile] = mockEnabled
    ? [getMockForYouItems(), getMockSharedProjects(), null]
    : await Promise.all([
        getForYouItems(supabase, user.id),
        getSharedWithMeTree(supabase, user.id),
        supabase
          .from("hub_profiles")
          .select("display_name, avatar_url")
          .eq("id", user.id)
          .maybeSingle()
          .then(({ data }) => data),
      ]);

  const filteredItems = filterForYouByLens(items, lens, user.id);
  const itemCounts = forYouLensCounts(items);

  return (
    <ForYouInbox
      lens={lens}
      allItems={items}
      items={filteredItems}
      itemCounts={itemCounts}
      sharedProjects={sharedProjects}
      userId={user.id}
      userDisplayName={profile?.display_name ?? user.email?.split("@")[0] ?? "You"}
      userAvatarUrl={profile?.avatar_url ?? null}
    />
  );
}
