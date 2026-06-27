import {
  CANVAS_FONT_FAMILIES,
  LETTER_SPACING_EM,
  LINE_HEIGHT_VALUE,
  TEXT_FONT_SIZE_PX,
  TEXT_MIN_HEIGHT,
  TEXT_MIN_WIDTH,
} from "@/lib/canvas/text-presets";
import type {
  CanvasFontFamily,
  CanvasTextSize,
  TextLetterSpacing,
  TextLineHeight,
} from "@/lib/canvas/types";

type MeasureTextOptions = {
  text: string;
  fontFamily: CanvasFontFamily;
  textSize: CanvasTextSize;
  letterSpacing: TextLetterSpacing;
  lineHeight: TextLineHeight;
  bold: boolean;
  italic: boolean;
  width?: number;
};

let measureCanvas: HTMLCanvasElement | null = null;

function getMeasureContext() {
  if (typeof document === "undefined") return null;
  if (!measureCanvas) measureCanvas = document.createElement("canvas");
  return measureCanvas.getContext("2d");
}

export function measureTextNodeDimensions(options: MeasureTextOptions): {
  width: number;
  height: number;
} {
  const ctx = getMeasureContext();
  const fontSize = TEXT_FONT_SIZE_PX[options.textSize];
  const fontStack = CANVAS_FONT_FAMILIES[options.fontFamily].css;
  const weight = options.bold ? "700" : "400";
  const style = options.italic ? "italic" : "normal";
  const content = options.text.trim() || "Add text";
  const lineHeight = LINE_HEIGHT_VALUE[options.lineHeight];

  if (!ctx) {
    const lines = content.split("\n");
    const width = Math.max(
      TEXT_MIN_WIDTH,
      Math.min(480, content.length * fontSize * 0.55),
    );
    const height = Math.max(TEXT_MIN_HEIGHT, lines.length * fontSize * lineHeight + 8);
    return { width, height };
  }

  ctx.font = `${style} ${weight} ${fontSize}px ${fontStack.split(",")[0]?.trim() ?? "sans-serif"}`;

  const maxWidth = options.width ?? 480;
  const paragraphs = content.split("\n");
  const wrappedLines: string[] = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      wrappedLines.push("");
      continue;
    }

    let line = words[0]!;
    for (let index = 1; index < words.length; index += 1) {
      const next = `${line} ${words[index]!}`;
      if (ctx.measureText(next).width > maxWidth) {
        wrappedLines.push(line);
        line = words[index]!;
      } else {
        line = next;
      }
    }
    wrappedLines.push(line);
  }

  let maxLineWidth = 0;
  for (const line of wrappedLines) {
    maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line || " ").width);
  }

  const letterSpacingPx =
    parseFloat(LETTER_SPACING_EM[options.letterSpacing]) * fontSize;
  const width = Math.max(
    TEXT_MIN_WIDTH,
    Math.ceil(maxLineWidth + letterSpacingPx * Math.max(content.length - 1, 0) + 16),
  );
  const height = Math.max(
    TEXT_MIN_HEIGHT,
    Math.ceil(wrappedLines.length * fontSize * lineHeight + 12),
  );

  return { width, height };
}
