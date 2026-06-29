import type { useRouter } from "next/navigation";

import { dispatchHubContentNavigationBegin } from "@/lib/hub/hub-content-navigation-events";
import {
  resolveHubContentNavigationKind,
  resolveHubContentNavigationStages,
} from "@/lib/hub/hub-content-navigation-stages";
import type { BriefItemKind } from "@/lib/intelligence/types";
import type { SearchResultKind } from "@/lib/search/queries";

type HubRouter = Pick<ReturnType<typeof useRouter>, "push" | "prefetch">;

type NavigateHubContentOptions = {
  href: string;
  label?: string;
  kindHint?: BriefItemKind | SearchResultKind | "file";
  newTab?: boolean;
};

export function navigateHubContent(
  router: HubRouter,
  options: NavigateHubContentOptions,
) {
  const { href, label, kindHint, newTab = false } = options;

  if (newTab || href.startsWith("http")) {
    window.open(href, "_blank", "noopener,noreferrer");
    return;
  }

  const kind = resolveHubContentNavigationKind(href, kindHint);
  const stages = resolveHubContentNavigationStages(kind, href);

  dispatchHubContentNavigationBegin({
    href,
    label,
    kind,
    stages,
  });

  router.prefetch(href);
  router.push(href);
}
