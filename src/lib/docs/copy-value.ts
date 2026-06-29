export type DocsCopyVariant = "text" | "url" | "hex" | "command";

const URL_PATTERN = /^https?:\/\//i;
const HEX_PATTERN = /^#[0-9a-fA-F]{3,8}$/;
const COMMAND_PATTERN = /^(npm|npx|node|pnpm|yarn)\s+\S+/;

export function looksLikeCopyableCommand(value: string): boolean {
  return COMMAND_PATTERN.test(value.trim());
}

export function looksLikeCopyableUrl(value: string): boolean {
  const trimmed = value.trim();
  return URL_PATTERN.test(trimmed);
}

export function looksLikeHexColor(value: string): boolean {
  return HEX_PATTERN.test(value.trim());
}

export function detectCopyVariant(
  value: string,
  copyValue?: string,
): DocsCopyVariant {
  const toCopy = (copyValue ?? value).trim();
  const display = value.trim();

  if (looksLikeHexColor(toCopy) || looksLikeHexColor(display)) {
    return "hex";
  }
  if (looksLikeCopyableUrl(toCopy) || looksLikeCopyableUrl(display)) {
    return "url";
  }
  if (looksLikeCopyableCommand(toCopy) || looksLikeCopyableCommand(display)) {
    return "command";
  }
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(display)) {
    return "url";
  }
  return "text";
}

export function copyToastMessage(variant: DocsCopyVariant): string {
  switch (variant) {
    case "hex":
      return "Hex copied";
    case "url":
      return "URL link copied";
    case "command":
      return "Command copied";
    default:
      return "Copied";
  }
}
