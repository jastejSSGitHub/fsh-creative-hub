export function scrollToAssetCard(assetId: string, options?: { offset?: number }) {
  const offset = options?.offset ?? 96;
  const element = document.getElementById(`asset-card-${assetId}`);
  if (!element) return false;

  const top = element.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: "smooth" });
  return true;
}

export function scrollToAssetCardWhenReady(
  assetId: string,
  options?: { offset?: number; attempts?: number; intervalMs?: number },
) {
  const attempts = options?.attempts ?? 12;
  const intervalMs = options?.intervalMs ?? 80;
  let tries = 0;

  const tick = () => {
    if (scrollToAssetCard(assetId, options)) return;
    tries += 1;
    if (tries < attempts) {
      window.setTimeout(tick, intervalMs);
    }
  };

  window.requestAnimationFrame(tick);
}
