import { STAMP_DEFS } from "@/lib/canvas/presets";
import { PAGE_EMOJI_CATEGORIES } from "@/lib/documents/emojis";

/** Shown on the toolbar emoji trigger before the picker is opened. */
export const STICKY_TOOLBAR_EMOJI_TRIGGER = "🔥";

const STAMP_EMOJIS = Object.values(STAMP_DEFS)
  .map((def) => def.emoji)
  .filter((emoji) => emoji !== "+1");

const PAGE_EMOJIS = PAGE_EMOJI_CATEGORIES.flatMap((category) => category.emojis);

/** Curated emoji set reused from stamps + document/page pickers. */
export const STICKY_EMOJI_PICKER_EMOJIS = [
  ...new Set([...STAMP_EMOJIS, ...PAGE_EMOJIS]),
];
