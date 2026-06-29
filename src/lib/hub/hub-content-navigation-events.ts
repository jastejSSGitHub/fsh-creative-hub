import type { HubContentNavigationKind } from "@/lib/hub/hub-content-navigation-stages";

export const HUB_CONTENT_NAVIGATION_BEGIN_EVENT = "fsh-hub-content-navigation-begin";
export const HUB_CONTENT_NAVIGATION_END_EVENT = "fsh-hub-content-navigation-end";

export type HubContentNavigationSnapshot = {
  href: string;
  label?: string;
  kind: HubContentNavigationKind;
  stages: readonly [string, string, string];
};

export function dispatchHubContentNavigationBegin(
  snapshot: HubContentNavigationSnapshot,
) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<HubContentNavigationSnapshot>(
      HUB_CONTENT_NAVIGATION_BEGIN_EVENT,
      { detail: snapshot },
    ),
  );
}

export function dispatchHubContentNavigationEnd() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(HUB_CONTENT_NAVIGATION_END_EVENT));
}
