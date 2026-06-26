export type CanvasTextSize = "small" | "medium" | "large" | "extra-large";

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
};

export type SectionNode = CanvasNodeBase & {
  type: "section";
  title: string;
  subtitle: string;
  accentColor: string;
  fillColor: string;
  templateId?: "how-might-we";
};

export type CanvasNode = StickyNode | StampNode | SectionNode;

export type CanvasPlacementTool = "select" | "sticky" | "stamp";

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
