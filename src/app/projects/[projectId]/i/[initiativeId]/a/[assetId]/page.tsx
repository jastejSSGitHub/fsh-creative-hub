import { notFound, redirect } from "next/navigation";

import { projectPath, reviewBoardPath } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

type AssetDeepLinkPageProps = {
  params: Promise<{
    projectId: string;
    initiativeId: string;
    assetId: string;
  }>;
};

/** Deep link: redirects to review board or project workspace with asset overlay open. */
export default async function AssetDeepLinkPage({
  params,
}: AssetDeepLinkPageProps) {
  const { projectId, initiativeId, assetId } = await params;

  const supabase = await createClient();
  const { data: initiative } = await supabase
    .from("hub_initiatives")
    .select("review_board_id")
    .eq("id", initiativeId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (!initiative) notFound();

  const base = initiative.review_board_id
    ? reviewBoardPath(projectId, initiative.review_board_id)
    : projectPath(projectId);

  redirect(`${base}?initiative=${initiativeId}&asset=${assetId}`);
}
