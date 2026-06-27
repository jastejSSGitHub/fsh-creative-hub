import {
  captureProjectNavigationSnapshot,
  type ProjectNavigationSnapshot,
} from "@/lib/projects/project-navigation-snapshot";

export const PROJECT_NAVIGATION_BEGIN_EVENT = "fsh-project-navigation-begin";
export const PROJECT_NAVIGATION_END_EVENT = "fsh-project-navigation-end";

export function dispatchProjectNavigationBegin(snapshot: ProjectNavigationSnapshot) {
  if (typeof window === "undefined") return;

  captureProjectNavigationSnapshot(snapshot);
  window.dispatchEvent(
    new CustomEvent(PROJECT_NAVIGATION_BEGIN_EVENT, { detail: snapshot }),
  );
}

export function dispatchProjectNavigationEnd() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PROJECT_NAVIGATION_END_EVENT));
}
