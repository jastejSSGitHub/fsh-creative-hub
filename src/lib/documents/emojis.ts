export const PAGE_EMOJI_CATEGORIES = [
  {
    id: "recent",
    label: "Recent",
    emojis: ["📄", "📝", "💡", "🎯", "✨", "📌", "🗂️", "📋"],
  },
  {
    id: "work",
    label: "Work",
    emojis: ["💼", "📊", "📈", "🗓️", "✅", "🔥", "⚡", "🚀", "🎨", "🛠️"],
  },
  {
    id: "creative",
    label: "Creative",
    emojis: ["🎬", "📸", "🎵", "🖼️", "✏️", "🧠", "💭", "🌟", "🎭", "📐"],
  },
  {
    id: "objects",
    label: "Objects",
    emojis: ["📁", "📎", "🔗", "🔖", "🏷️", "📦", "🗃️", "📑", "🧩", "🔑"],
  },
  {
    id: "nature",
    label: "Nature",
    emojis: ["🌿", "🌸", "🍊", "🌊", "☀️", "🌙", "⭐", "🌈", "🍀", "🦋"],
  },
  {
    id: "faces",
    label: "Smileys",
    emojis: ["😀", "😊", "🤔", "😎", "🥳", "💪", "👀", "🙌", "👍", "❤️"],
  },
] as const;

export const ALL_PAGE_EMOJIS = PAGE_EMOJI_CATEGORIES.flatMap((c) => c.emojis);
