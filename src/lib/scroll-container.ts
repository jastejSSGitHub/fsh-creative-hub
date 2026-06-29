export const FSH_SCROLL_ATTR = "data-fsh-scroll";
export const LANDING_SCROLL_ID = "landing-scroll";

export function getFshScrollContainer(from?: Element | null): HTMLElement | null {
  if (from) {
    const closest = from.closest(`[${FSH_SCROLL_ATTR}]`);
    if (closest instanceof HTMLElement) return closest;
  }

  const root = document.querySelector(`[${FSH_SCROLL_ATTR}]`);
  return root instanceof HTMLElement ? root : null;
}

export function scrollElementTo(
  element: HTMLElement,
  options?: { offset?: number; behavior?: ScrollBehavior },
) {
  const offset = options?.offset ?? 96;
  const behavior = options?.behavior ?? "smooth";
  const container = getFshScrollContainer(element);

  if (container) {
    const elementTop =
      element.getBoundingClientRect().top -
      container.getBoundingClientRect().top +
      container.scrollTop;
    container.scrollTo({ top: elementTop - offset, behavior });
    return;
  }

  const top = element.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior });
}
