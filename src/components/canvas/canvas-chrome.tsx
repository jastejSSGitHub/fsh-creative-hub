"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  Copy,
  Download,
  Focus,
  Hand,
  Menu,
  Minus,
  MousePointer2,
  Plus,
  RotateCcw,
} from "lucide-react";

import { CanvasBrainstormPanel } from "@/components/canvas/canvas-brainstorm-panel";
import { CanvasGlass } from "@/components/canvas/canvas-glass";
import {
  CANVAS_BG_PRESETS,
  formatZoomPercent,
  type CanvasTool,
} from "@/lib/canvas/viewport";
import { getCanvasTheme, type CanvasTheme } from "@/lib/canvas/presets";
import { PROJECTS_PATH, projectPath } from "@/lib/routes";
import { cn } from "@/lib/utils";

type CanvasChromeProps = {
  canvasName: string;
  projectId: string;
  tool: CanvasTool;
  onToolChange: (tool: CanvasTool) => void;
  zoom: number;
  backgroundColor: string;
  onBackgroundColorChange: (color: string) => void;
  onCenter: () => void;
  onResetView: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  sidebarTab: "design" | "brainstorm";
  onSidebarTabChange: (tab: "design" | "brainstorm") => void;
  brainstormPanelRef?: React.RefObject<HTMLDivElement | null>;
  shareButtonRef?: React.RefObject<HTMLButtonElement | null>;
  onShare: () => void;
};

export function CanvasChrome({
  canvasName,
  projectId,
  tool,
  onToolChange,
  zoom,
  backgroundColor,
  onBackgroundColorChange,
  onCenter,
  onResetView,
  onZoomIn,
  onZoomOut,
  sidebarTab,
  onSidebarTabChange,
  brainstormPanelRef,
  shareButtonRef,
  onShare,
}: CanvasChromeProps) {
  const theme = getCanvasTheme(backgroundColor);

  return (
    <>
      <CanvasTopBar
        canvasName={canvasName}
        projectId={projectId}
        theme={theme}
        shareButtonRef={shareButtonRef}
        onShare={onShare}
      />

      <CanvasToolSwitcher tool={tool} onToolChange={onToolChange} theme={theme} />

      <CanvasRightSidebar
        backgroundColor={backgroundColor}
        onBackgroundColorChange={onBackgroundColorChange}
        onCenter={onCenter}
        onResetView={onResetView}
        theme={theme}
        tab={sidebarTab}
        onTabChange={onSidebarTabChange}
        brainstormPanelRef={brainstormPanelRef}
      />

      <CanvasGlass
        className={cn(
          "pointer-events-auto absolute bottom-4 right-4 flex items-center gap-1 rounded-full p-1 font-mono text-[0.7rem]",
          theme.mode === "light" && "border-black/10 bg-white/90 text-[#1a1a1a]",
          theme.mode === "dark" && "text-white/70",
        )}
      >
        <button
          type="button"
          onClick={onZoomOut}
          aria-label="Zoom out"
          className="inline-flex size-7 items-center justify-center rounded-full transition-colors hover:bg-black/5"
        >
          <Minus className="size-3.5" />
        </button>
        <span className="min-w-[3rem] text-center">{formatZoomPercent(zoom)}</span>
        <button
          type="button"
          onClick={onZoomIn}
          aria-label="Zoom in"
          className="inline-flex size-7 items-center justify-center rounded-full transition-colors hover:bg-black/5"
        >
          <Plus className="size-3.5" />
        </button>
      </CanvasGlass>
    </>
  );
}

function chromeControlClass(isLight: boolean, active = false) {
  return cn(
    "backdrop-blur-2xl transition-colors",
    isLight
      ? cn(
          "border-black/12 bg-white/92 text-[#1a1a1a] shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:bg-white",
          active && "bg-white text-[#1a1a1a]",
        )
      : cn(
          "border-white/10 bg-white/[0.07] text-white/85 shadow-[0_8px_32px_rgba(0,0,0,0.35)] hover:bg-white/[0.12] hover:text-white",
          active && "bg-white/[0.14] text-white",
        ),
  );
}

function CanvasTopBar({
  canvasName,
  projectId,
  theme,
  shareButtonRef,
  onShare,
}: {
  canvasName: string;
  projectId: string;
  theme: CanvasTheme;
  shareButtonRef?: React.RefObject<HTMLButtonElement | null>;
  onShare: () => void;
}) {
  const isLight = theme.mode === "light";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-3 sm:p-4">
      <div className="pointer-events-auto flex flex-col gap-2">
        <Link
          href={projectPath(projectId)}
          className={cn(
            "inline-flex w-fit items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[0.8125rem] font-medium",
            chromeControlClass(isLight),
          )}
        >
          <ChevronLeft className="size-3.5" aria-hidden />
          Exit Canvas
        </Link>

        <div className="relative flex items-center gap-2">
          <button
            type="button"
            aria-label="Canvas menu"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-lg border",
              chromeControlClass(isLight, menuOpen),
            )}
          >
            <Menu className="size-4" aria-hidden />
          </button>

          <h1
            className={cn(
              "max-w-[min(60vw,20rem)] truncate font-display text-base font-extrabold tracking-tight sm:max-w-[min(50vw,28rem)] sm:text-lg",
              theme.mode === "light" ? "text-[#1a1a1a]" : "text-white",
            )}
          >
            {canvasName}
          </h1>

          {menuOpen && (
            <div ref={menuRef} className="absolute left-0 top-full z-30 mt-2">
              <CanvasGlass
                className="min-w-[15.5rem] overflow-hidden rounded-xl py-1.5"
                role="menu"
              >
              <CanvasMenuItem
                href={PROJECTS_PATH}
                icon={ChevronLeft}
                label="Go to all projects"
                onSelect={() => setMenuOpen(false)}
              />
              <CanvasMenuItem
                icon={Download}
                label="Download project"
                disabled
                hint="Soon"
              />
              <CanvasMenuItem
                icon={Copy}
                label="Duplicate project"
                disabled
                hint="Soon"
              />
              </CanvasGlass>
            </div>
          )}
        </div>
      </div>

      <div className="pointer-events-auto flex items-start">
        <button
          ref={shareButtonRef}
          type="button"
          onClick={onShare}
          className={cn(
            "inline-flex min-h-9 items-center rounded-lg border px-3.5 text-[0.8125rem] font-medium transition-colors",
            isLight
              ? "border-black/12 bg-white/92 text-[#1a1a1a] shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:bg-white"
              : "border-white/10 bg-white/[0.07] text-white/85 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-2xl hover:bg-white/[0.12] hover:text-white",
          )}
        >
          Share
        </button>
      </div>
    </div>
  );
}

function CanvasMenuItem({
  href,
  icon: Icon,
  label,
  disabled,
  hint,
  onSelect,
}: {
  href?: string;
  icon: typeof Menu;
  label: string;
  disabled?: boolean;
  hint?: string;
  onSelect?: () => void;
}) {
  const className = cn(
    "flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[0.8125rem] text-white/85 transition-colors",
    disabled
      ? "cursor-not-allowed text-white/35"
      : "hover:bg-white/[0.08] hover:text-white",
  );

  const content = (
    <>
      <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
      <span className="flex-1">{label}</span>
      {hint && (
        <span className="font-mono text-[0.6rem] uppercase tracking-wider text-white/30">
          {hint}
        </span>
      )}
    </>
  );

  if (href && !disabled) {
    return (
      <Link href={href} role="menuitem" className={className} onClick={onSelect}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" role="menuitem" className={className} disabled={disabled}>
      {content}
    </button>
  );
}

function CanvasToolSwitcher({
  tool,
  onToolChange,
  theme,
}: {
  tool: CanvasTool;
  onToolChange: (tool: CanvasTool) => void;
  theme: CanvasTheme;
}) {
  const isLight = theme.mode === "light";

  return (
    <CanvasGlass
      className={cn(
        "pointer-events-auto absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-0.5 rounded-full p-1 sm:right-4",
        isLight && "border-black/12 bg-white/92 shadow-[0_4px_20px_rgba(0,0,0,0.08)]",
      )}
    >
      <ToolButton
        active={tool === "select"}
        label="Select"
        shortcut="V"
        isLight={isLight}
        onClick={() => onToolChange("select")}
      >
        <MousePointer2 className="size-4" />
      </ToolButton>
      <ToolButton
        active={tool === "hand"}
        label="Hand"
        shortcut="H"
        isLight={isLight}
        onClick={() => onToolChange("hand")}
      >
        <Hand className="size-4" />
      </ToolButton>
    </CanvasGlass>
  );
}

function ToolButton({
  active,
  label,
  shortcut,
  isLight,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  shortcut: string;
  isLight: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={`${label} (${shortcut})`}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full transition-colors",
        active
          ? isLight
            ? "bg-[#1a1a1a] text-white shadow-sm"
            : "bg-white text-[#1a1a1a] shadow-sm"
          : isLight
            ? "text-[#1a1a1a]/75 hover:bg-black/[0.06] hover:text-[#1a1a1a]"
            : "text-white/70 hover:bg-white/10 hover:text-white",
      )}
    >
      {children}
    </button>
  );
}

function CanvasRightSidebar({
  backgroundColor,
  onBackgroundColorChange,
  onCenter,
  onResetView,
  theme,
  tab,
  onTabChange,
  brainstormPanelRef,
}: {
  backgroundColor: string;
  onBackgroundColorChange: (color: string) => void;
  onCenter: () => void;
  onResetView: () => void;
  theme: CanvasTheme;
  tab: "design" | "brainstorm";
  onTabChange: (tab: "design" | "brainstorm") => void;
  brainstormPanelRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const [pageOpen, setPageOpen] = useState(false);
  const isLight = theme.mode === "light";

  return (
    <div
      ref={brainstormPanelRef}
      className="pointer-events-auto absolute right-3 top-3 z-20 hidden sm:block sm:right-16"
    >
      <CanvasGlass
        as="aside"
        className={cn(
          "flex w-52 flex-col rounded-xl",
          isLight && "border-black/10 bg-white/90",
        )}
      >
      <div className={cn("flex border-b px-3 pt-2.5", isLight ? "border-black/8" : "border-white/8")}>
        {(["design", "brainstorm"] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
            className={cn(
              "border-b-2 px-2 pb-2 text-[0.75rem] font-medium capitalize transition-colors",
              tab === id
                ? isLight
                  ? "border-[#1a1a1a] text-[#1a1a1a]"
                  : "border-white text-white"
                : isLight
                  ? "border-transparent text-[#1a1a1a]/45"
                  : "border-transparent text-white/45",
            )}
          >
            {id === "brainstorm" ? "Brainstorming" : "Design"}
          </button>
        ))}
      </div>

      {tab === "design" ? (
        <div className="space-y-3 p-3">
          <button
            type="button"
            onClick={() => setPageOpen((o) => !o)}
            className={cn(
              "flex w-full items-center justify-between rounded-md px-1.5 py-1.5 text-left text-[0.75rem] font-medium",
              isLight ? "text-[#1a1a1a]/80 hover:bg-black/[0.04]" : "text-white/80 hover:bg-white/[0.06]",
            )}
          >
            Page background
            <span className="text-[0.65rem] opacity-50">{pageOpen ? "−" : "+"}</span>
          </button>

          {pageOpen && (
            <div className="space-y-2 px-1">
              <p className={cn("font-mono text-[0.58rem] uppercase tracking-[0.12em]", isLight ? "text-black/40" : "text-white/40")}>
                Curated colors
              </p>
              <div className="flex flex-wrap gap-1.5">
                {CANVAS_BG_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    title={preset.label}
                    aria-label={`${preset.label} background`}
                    onClick={() => onBackgroundColorChange(preset.value)}
                    className={cn(
                      "size-6 rounded-md border transition-transform hover:scale-105",
                      backgroundColor === preset.value
                        ? isLight
                          ? "border-[#1a1a1a] ring-1 ring-[#1a1a1a]/30"
                          : "border-white ring-1 ring-white/40"
                        : isLight
                          ? "border-black/15"
                          : "border-white/15",
                    )}
                    style={{ backgroundColor: preset.value }}
                  />
                ))}
              </div>
            </div>
          )}

          <div className={cn("space-y-1.5 border-t pt-3", isLight ? "border-black/8" : "border-white/8")}>
            <SidebarAction icon={Focus} label="Center canvas" onClick={onCenter} isLight={isLight} />
            <SidebarAction icon={RotateCcw} label="Reset zoom" onClick={onResetView} isLight={isLight} />
          </div>
        </div>
      ) : (
        <CanvasBrainstormPanel themeMode={theme.mode} />
      )}
      </CanvasGlass>
    </div>
  );
}

function SidebarAction({
  icon: Icon,
  label,
  onClick,
  isLight,
}: {
  icon: typeof Focus;
  label: string;
  onClick: () => void;
  isLight: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-left text-[0.75rem] transition-colors",
        isLight
          ? "text-[#1a1a1a]/75 hover:bg-black/[0.04] hover:text-[#1a1a1a]"
          : "text-white/75 hover:bg-white/[0.06] hover:text-white",
      )}
    >
      <Icon className="size-3.5 shrink-0 opacity-80" aria-hidden />
      {label}
    </button>
  );
}
