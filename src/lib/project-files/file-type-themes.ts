import type { HubProjectFileType } from "@/types/database";

/** Labels on file thumbnails — always dark because gradients stay light in every theme. */
export const FILE_THUMB_LABEL_PRIMARY = "text-hub-thumb-ink/88";

export type FileTypeTheme = {
  gradient: string;
  accent: string;
  labelPrimary: string;
  labelSecondary: string;
  illustrationTint: string;
};

const REVIEW_BOARD_PALETTES: FileTypeTheme[] = [
  {
    gradient: "from-[#e0e7ff] via-[#c7d2fe] to-[#a5b4fc]",
    accent: "#4f46e5",
    labelPrimary: FILE_THUMB_LABEL_PRIMARY,
    labelSecondary: "text-indigo-700/75",
    illustrationTint: "rgba(79,70,229,0.14)",
  },
  {
    gradient: "from-[#dcfce7] via-[#bbf7d0] to-[#86efac]",
    accent: "#16a34a",
    labelPrimary: FILE_THUMB_LABEL_PRIMARY,
    labelSecondary: "text-emerald-700/75",
    illustrationTint: "rgba(22,163,74,0.14)",
  },
  {
    gradient: "from-[#ffe4e6] via-[#fecdd3] to-[#fda4af]",
    accent: "#e11d48",
    labelPrimary: FILE_THUMB_LABEL_PRIMARY,
    labelSecondary: "text-rose-700/75",
    illustrationTint: "rgba(225,29,72,0.12)",
  },
  {
    gradient: "from-[#fff4d6] via-[#ffe8a3] to-[#ffd76a]",
    accent: "#d97706",
    labelPrimary: FILE_THUMB_LABEL_PRIMARY,
    labelSecondary: "text-amber-800/75",
    illustrationTint: "rgba(217,119,6,0.12)",
  },
  {
    gradient: "from-[#e0f2fe] via-[#bae6fd] to-[#7dd3fc]",
    accent: "#0284c7",
    labelPrimary: FILE_THUMB_LABEL_PRIMARY,
    labelSecondary: "text-sky-700/75",
    illustrationTint: "rgba(2,132,199,0.12)",
  },
  {
    gradient: "from-[#f3e8ff] via-[#e9d5ff] to-[#d8b4fe]",
    accent: "#9333ea",
    labelPrimary: FILE_THUMB_LABEL_PRIMARY,
    labelSecondary: "text-purple-700/75",
    illustrationTint: "rgba(147,51,234,0.12)",
  },
];

const TEXT_DOCUMENT_PALETTES: FileTypeTheme[] = [
  {
    gradient: "from-[#e0f2fe] via-[#ddd6fe] to-[#fbcfe8]",
    accent: "#6366f1",
    labelPrimary: FILE_THUMB_LABEL_PRIMARY,
    labelSecondary: "text-indigo-700/75",
    illustrationTint: "rgba(99,102,241,0.14)",
  },
  {
    gradient: "from-[#fef3c7] via-[#fde68a] to-[#fcd34d]",
    accent: "#d97706",
    labelPrimary: FILE_THUMB_LABEL_PRIMARY,
    labelSecondary: "text-amber-800/75",
    illustrationTint: "rgba(217,119,6,0.12)",
  },
  {
    gradient: "from-[#ecfdf5] via-[#d1fae5] to-[#a7f3d0]",
    accent: "#059669",
    labelPrimary: FILE_THUMB_LABEL_PRIMARY,
    labelSecondary: "text-emerald-700/75",
    illustrationTint: "rgba(5,150,105,0.12)",
  },
  {
    gradient: "from-[#fce7f3] via-[#f5d0fe] to-[#e9d5ff]",
    accent: "#a855f7",
    labelPrimary: FILE_THUMB_LABEL_PRIMARY,
    labelSecondary: "text-purple-700/75",
    illustrationTint: "rgba(168,85,247,0.12)",
  },
];

const CANVAS_PALETTES: FileTypeTheme[] = [
  {
    gradient: "from-[#f3e8ff] via-[#e9d5ff] to-[#d8b4fe]",
    accent: "#9333ea",
    labelPrimary: FILE_THUMB_LABEL_PRIMARY,
    labelSecondary: "text-purple-700/75",
    illustrationTint: "rgba(147,51,234,0.14)",
  },
  {
    gradient: "from-[#fce7f3] via-[#fbcfe8] to-[#f9a8d4]",
    accent: "#db2777",
    labelPrimary: FILE_THUMB_LABEL_PRIMARY,
    labelSecondary: "text-pink-700/75",
    illustrationTint: "rgba(219,39,119,0.12)",
  },
  {
    gradient: "from-[#cffafe] via-[#a5f3fc] to-[#67e8f9]",
    accent: "#0891b2",
    labelPrimary: FILE_THUMB_LABEL_PRIMARY,
    labelSecondary: "text-cyan-700/75",
    illustrationTint: "rgba(8,145,178,0.12)",
  },
  {
    gradient: "from-[#fef3c7] via-[#fde68a] to-[#fcd34d]",
    accent: "#ca8a04",
    labelPrimary: FILE_THUMB_LABEL_PRIMARY,
    labelSecondary: "text-yellow-800/75",
    illustrationTint: "rgba(202,138,4,0.12)",
  },
];

const TASKS_PALETTES: FileTypeTheme[] = [
  {
    gradient: "from-[#ecfdf5] via-[#d1fae5] to-[#a7f3d0]",
    accent: "#059669",
    labelPrimary: FILE_THUMB_LABEL_PRIMARY,
    labelSecondary: "text-emerald-700/75",
    illustrationTint: "rgba(5,150,105,0.12)",
  },
  {
    gradient: "from-[#e0f2fe] via-[#bae6fd] to-[#7dd3fc]",
    accent: "#0284c7",
    labelPrimary: FILE_THUMB_LABEL_PRIMARY,
    labelSecondary: "text-sky-700/75",
    illustrationTint: "rgba(2,132,199,0.12)",
  },
  {
    gradient: "from-[#f3e8ff] via-[#e9d5ff] to-[#d8b4fe]",
    accent: "#9333ea",
    labelPrimary: FILE_THUMB_LABEL_PRIMARY,
    labelSecondary: "text-purple-700/75",
    illustrationTint: "rgba(147,51,234,0.12)",
  },
];

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function getFileTypeTheme(
  type: HubProjectFileType,
  fileId: string,
): FileTypeTheme {
  const palettes =
    type === "review_board"
      ? REVIEW_BOARD_PALETTES
      : type === "text_document"
        ? TEXT_DOCUMENT_PALETTES
        : CANVAS_PALETTES;
  return palettes[hashString(fileId) % palettes.length]!;
}

export function getTasksTheme(projectId: string): FileTypeTheme {
  return TASKS_PALETTES[hashString(projectId) % TASKS_PALETTES.length]!;
}

export function fileTypeDisplayLines(type: HubProjectFileType): [string, string] {
  switch (type) {
    case "review_board":
      return ["Review", "Board"];
    case "canvas":
      return ["Canvas", ""];
    case "text_document":
      return ["Text", "Doc"];
    default:
      return [type, ""];
  }
}

export function tasksDisplayLines(): [string, string] {
  return ["Task", "List"];
}
