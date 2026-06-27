export type CanvasTextSize = "small" | "medium" | "large" | "extra-large";

export type CanvasFontFamily =
  | "geist-sans"
  | "inter"
  | "roboto"
  | "open-sans"
  | "lora"
  | "bricolage"
  | "geist-mono";

export type TextLetterSpacing = "tight" | "normal" | "wide" | "wider";

export type TextLineHeight = "compact" | "normal" | "relaxed" | "loose";

export type TextAlign = "left" | "center" | "right";

export type StickyColorId =
  | "yellow"
  | "blue"
  | "green"
  | "pink"
  | "purple"
  | "orange";

export type StampId = "thumbs-up" | "heart" | "plus-one" | "star" | "fire" | "eyes";

export type CanvasNodeBase = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
};

export type StickyNode = CanvasNodeBase & {
  type: "sticky";
  text: string;
  color: StickyColorId;
  textSize: CanvasTextSize;
  bold: boolean;
  strikethrough: boolean;
  authorName: string;
  sectionId?: string;
};

export type StampNode = CanvasNodeBase & {
  type: "stamp";
  stampId: StampId;
  /** When set, the stamp moves with this sticky until moved or deleted. */
  attachedStickyId?: string;
};

export type SectionNode = CanvasNodeBase & {
  type: "section";
  title: string;
  subtitle: string;
  accentColor: string;
  fillColor: string;
  templateId?: "how-might-we";
};

export type EmbedNode = CanvasNodeBase & {
  type: "embed";
  embedUrl?: string;
  embedHtml?: string;
  label?: string;
};

export type ImageNode = CanvasNodeBase & {
  type: "image";
  imageUrl: string;
  storagePath?: string;
  naturalWidth?: number;
  naturalHeight?: number;
  /** Present only while a dropped file is uploading — never persisted. */
  uploadStatus?: "uploading";
};

export type TextNode = CanvasNodeBase & {
  type: "text";
  text: string;
  color: string;
  fontFamily: CanvasFontFamily;
  textSize: CanvasTextSize;
  letterSpacing: TextLetterSpacing;
  lineHeight: TextLineHeight;
  align: TextAlign;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  uppercase: boolean;
  lowercase: boolean;
  sectionId?: string;
};

export type CanvasNode =
  | StickyNode
  | StampNode
  | SectionNode
  | EmbedNode
  | ImageNode
  | TextNode;

export type CanvasPlacementTool = "select" | "text" | "sticky" | "stamp" | "embed";

export type CanvasConfigV1 = {
  version: 1;
  nodes: CanvasNode[];
  viewport: { x: number; y: number; zoom: number };
  backgroundColor: string;
  templateApplied?: string;
  onboardingCompleted?: boolean;
  zoomTipsSeen?: boolean;
};

export type CanvasTheme = {
  mode: "dark" | "light";
  chromeText: string;
  chromeMuted: string;
  glassBorder: string;
  glassBg: string;
  dotOpacity: number;
  vignette: string;
};
