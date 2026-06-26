import { redirect } from "next/navigation";

import { ForYouInbox } from "@/components/inbox/for-you-inbox";
import { getForYouItems } from "@/lib/inbox/queries";
import { getSharedWithMeTree } from "@/lib/inbox/sidebar-queries";
import {
  filterForYouItems,
  forYouItemCounts,
  type ForYouView,
} from "@/lib/inbox/views";
import { LOGIN_PATH } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

type ForYouPageProps = {
  searchParams: Promise<{ view?: string }>;
};

function parseView(raw: string | undefined): ForYouView {
  if (raw === "replies" || raw === "assigned") return raw;
  return "inbox";
}

export default async function ForYouPage({ searchParams }: ForYouPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(LOGIN_PATH);

  const params = await searchParams;
  const view = parseView(params.view);

  const [items, sharedProjects] = await Promise.all([
    getForYouItems(supabase, user.id),
    getSharedWithMeTree(supabase, user.id),
  ]);

  const filteredItems = filterForYouItems(items, view);
  const itemCounts = forYouItemCounts(items);

  return (
    <ForYouInbox
      view={view}
      items={filteredItems}
      itemCounts={itemCounts}
      sharedProjects={sharedProjects}
    />
  );
}
