/**
 * Loom walkthrough URLs for landing-page feature sections.
 * Paste a share link after recording each tutorial.
 */
export const COLLABORATION_FEATURE_LOOMS = {
  forYou: null as string | null,
  quickTasks: null as string | null,
  collaborationLoop: null as string | null,
} as const;

export function featureTutorial(
  loomUrl: string | null,
  modalTitle: string,
) {
  if (!loomUrl) return null;
  return { loomUrl, modalTitle };
}
