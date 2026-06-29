import { forYouLensPath, type ForYouLens } from "@/lib/routes";

const STORAGE_KEY = "fsh-hub-origin-nav";
const TTL_MS = 30 * 60 * 1000;

export type HubOriginSource =
  | {
      type: "for-you";
      lens: ForYouLens;
      scrollY: number;
      itemId?: string;
    }
  | {
      type: "generic";
      path: string;
      scrollY: number;
      label: string;
    };

export type HubOriginNavigation = {
  returnPath: string;
  returnLabel: string;
  source: HubOriginSource;
  capturedAt: number;
};

type OriginEnvelope = HubOriginNavigation;

function readEnvelope(): OriginEnvelope | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as OriginEnvelope;
    if (!parsed?.returnPath || !parsed.source) return null;
    if (Date.now() - parsed.capturedAt > TTL_MS) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function writeEnvelope(origin: HubOriginNavigation) {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(origin));
  } catch {
    // ignore quota / private mode
  }
}

export function readHubOriginNavigation(): HubOriginNavigation | null {
  return readEnvelope();
}

export function clearHubOriginNavigation() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}

export function captureHubOriginNavigation(origin: HubOriginNavigation) {
  writeEnvelope(origin);
}

export function captureForYouOrigin(options: {
  lens: ForYouLens;
  scrollY: number;
  itemId?: string;
}) {
  const returnPath = forYouLensPath(options.lens);
  captureHubOriginNavigation({
    returnPath,
    returnLabel: forYouReturnLabel(options.lens),
    source: {
      type: "for-you",
      lens: options.lens,
      scrollY: options.scrollY,
      itemId: options.itemId,
    },
    capturedAt: Date.now(),
  });
}

function forYouReturnLabel(lens: ForYouLens): string {
  switch (lens) {
    case "needs-you":
      return "For You";
    case "replies":
      return "Replies";
    case "assigned":
      return "Assigned";
    case "waiting-on-others":
      return "Waiting on others";
    case "following":
      return "Following";
    case "your-uploads":
      return "Your uploads";
    default:
      return "For You";
  }
}

export function restoreHubOriginScroll(origin: HubOriginNavigation) {
  if (typeof window === "undefined") return;

  const { source } = origin;
  const scrollY = source.scrollY;

  function applyScroll() {
    const scrollRoot = document.querySelector<HTMLElement>(".fsh-scroll");
    if (scrollRoot) {
      scrollRoot.scrollTop = scrollY;
      return true;
    }

    window.scrollTo({ top: scrollY, behavior: "auto" });
    return false;
  }

  applyScroll();

  if (source.type === "for-you" && source.itemId) {
    const itemId = source.itemId;
    let attempts = 0;

    const tryFocusItem = () => {
      const row = document.querySelector<HTMLElement>(
        `[data-for-you-item-id="${itemId}"]`,
      );
      if (row) {
        row.scrollIntoView({ block: "nearest", behavior: "smooth" });
        return;
      }

      attempts += 1;
      if (attempts < 12) {
        window.requestAnimationFrame(tryFocusItem);
      }
    };

    window.requestAnimationFrame(tryFocusItem);
  } else {
    let attempts = 0;
    const retry = () => {
      if (applyScroll() || attempts >= 8) return;
      attempts += 1;
      window.requestAnimationFrame(retry);
    };
    window.requestAnimationFrame(retry);
  }
}

export function readForYouScrollY(): number {
  if (typeof window === "undefined") return 0;
  const scrollRoot = document.querySelector<HTMLElement>(".fsh-scroll");
  return scrollRoot?.scrollTop ?? window.scrollY;
}
