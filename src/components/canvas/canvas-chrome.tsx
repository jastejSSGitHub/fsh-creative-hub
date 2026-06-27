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
import { CanvasInlineTitle } from "@/components/canvas/canvas-inline-title";
import { CanvasGlass } from "@/components/canvas/canvas-glass";
import {
  canvasGlassControlClass,
  canvasGlassDividerClass,
  canvasGlassMenuItemClass,
  canvasGlassTextClass,
} from "@/lib/canvas/glass-styles";
import {
  CANVAS_BG_PRESETS,
  formatZoomPercent,
  type CanvasTool,
} from "@/lib/canvas/viewport";
import { getCanvasTheme, type CanvasTheme } from "@/lib/canvas/presets";
import { PROJECTS_PATH, projectPath } from "@/lib/routes";
import { cn } from "@/lib/utils";

type CanvasChromeProps = {
  canvasId: string;
  canvasName: string;
  projectId: string;
  canRename: boolean;
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
  canvasId,
  canvasName,
  projectId,
  canRename,
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
  const isLight = theme.mode === "light";

  return (
    <>
      <CanvasTopBar
        canvasId={canvasId}
        canvasName={canvasName}
        projectId={projectId}
        canRename={canRename}
        theme={theme}
        onShare={onShare}
      />

      <CanvasToolSwitcher tool={tool} onToolChange={onToolChange} theme={theme} />

      <CanvasRightSidebar
        backgroundColor={backgroundColor}
        onBackgroundColorChange={onBackgroundColorChange}
        theme={theme}
        tab={sidebarTab}
        onTabChange={onSidebarTabChange}
        brainstormPanelRef={brainstormPanelRef}
        shareButtonRef={shareButtonRef}
        onShare={onShare}
      />

      <div className="pointer-events-auto absolute bottom-4 right-3 z-20 flex items-center gap-2 sm:right-4">
        <CanvasGlass
          themeMode={theme.mode}
          variant="control"
          className="flex items-center gap-0.5 rounded-full p-1"
        >
          <button
            type="button"
            onClick={onCenter}
            className={cn(
              "inline-flex h-7 items-center gap-1 rounded-[6px] px-2.5 text-[0.75rem] font-medium transition-colors",
              isLight
                ? "text-[#1a1a1a]/80 hover:bg-black/[0.06] hover:text-[#1a1a1a]"
                : "text-white/75 hover:bg-white/10 hover:text-white",
            )}
          >
            <Focus className="size-3.5 shrink-0 opacity-80" aria-hidden />
            Center
          </button>
          <button
            type="button"
            onClick={onResetView}
            aria-label="Reset zoom"
            title="Reset zoom"
            className={cn(
              "inline-flex size-7 items-center justify-center rounded-full transition-colors",
              isLight
                ? "text-[#1a1a1a]/75 hover:bg-black/[0.06] hover:text-[#1a1a1a]"
                : "text-white/70 hover:bg-white/10 hover:text-white",
            )}
          >
            <RotateCcw className="size-3.5" aria-hidden />
          </button>
        </CanvasGlass>

        <CanvasGlass
          themeMode={theme.mode}
          variant="control"
          className={cn(
            "flex items-center gap-1 rounded-full p-1 font-mono text-[0.7rem]",
            isLight ? "text-[#1a1a1a]" : "text-white/70",
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
      </div>
    </>
  );
}

function shareCtaClass() {
  return "inline-flex min-h-7 shrink-0 items-center rounded-[6px] bg-hub-primary px-2.5 text-[0.75rem] font-medium text-white shadow-sm transition-colors hover:bg-[#1590e8]";
}

function CanvasTopBar({
  canvasId,
  canvasName,
  projectId,
  canRename,
  theme,
  onShare,
}: {
  canvasId: string;
  canvasName: string;
  projectId: string;
  canRename: boolean;
  theme: CanvasTheme;
  onShare: () => void;
}) {
  const isLight = theme.mode === "light";
  const themeMode = theme.mode;
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
            "inline-flex w-fit items-center gap-1 rounded-full border px-2.5 py-1.5 text-[0.8125rem] font-medium",
            canvasGlassControlClass(themeMode),
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
              "inline-flex size-9 items-center justify-center rounded-full border",
              canvasGlassControlClass(themeMode, menuOpen),
            )}
          >
            <Menu className="size-4" aria-hidden />
          </button>

          <CanvasInlineTitle
            projectId={projectId}
            canvasId={canvasId}
            name={canvasName}
            canRename={canRename}
            theme={theme}
          />

          {menuOpen && (
            <div ref={menuRef} className="absolute left-0 top-full z-30 mt-2">
              <CanvasGlass
                themeMode={themeMode}
                className="min-w-[15.5rem] overflow-hidden rounded-xl py-1.5"
                role="menu"
              >
                <CanvasMenuItem
                  themeMode={themeMode}
                  href={PROJECTS_PATH}
                  icon={ChevronLeft}
                  label="Go to all projects"
                  onSelect={() => setMenuOpen(false)}
                />
                <CanvasMenuItem
                  themeMode={themeMode}
                  icon={Download}
                  label="Download project"
                  disabled
                  hint="Soon"
                />
                <CanvasMenuItem
                  themeMode={themeMode}
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

      <div className="pointer-events-auto flex items-start sm:hidden">
        <button type="button" onClick={onShare} className={shareCtaClass()}>
          Share
        </button>
      </div>
    </div>
  );
}

function CanvasMenuItem({
  themeMode,
  href,
  icon: Icon,
  label,
  disabled,
  hint,
  onSelect,
}: {
  themeMode: "light" | "dark";
  href?: string;
  icon: typeof Menu;
  label: string;
  disabled?: boolean;
  hint?: string;
  onSelect?: () => void;
}) {
  const className = canvasGlassMenuItemClass(themeMode, disabled);

  const content = (
    <>
      <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
      <span className="flex-1">{label}</span>
      {hint && (
        <span
          className={cn(
            "font-mono text-[0.6rem] uppercase tracking-wider",
            canvasGlassTextClass(themeMode, true),
          )}
        >
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
  const themeMode = theme.mode;

  return (
    <CanvasGlass
      themeMode={themeMode}
      variant="control"
      className="pointer-events-auto absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-0.5 rounded-full p-1 sm:right-4"
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
  theme,
  tab,
  onTabChange,
  brainstormPanelRef,
  shareButtonRef,
  onShare,
}: {
  backgroundColor: string;
  onBackgroundColorChange: (color: string) => void;
  theme: CanvasTheme;
  tab: "design" | "brainstorm";
  onTabChange: (tab: "design" | "brainstorm") => void;
  brainstormPanelRef?: React.RefObject<HTMLDivElement | null>;
  shareButtonRef?: React.RefObject<HTMLButtonElement | null>;
  onShare: () => void;
}) {
  const [pageOpen, setPageOpen] = useState(false);
  const isLight = theme.mode === "light";
  const themeMode = theme.mode;

  return (
    <div
      ref={brainstormPanelRef}
      className="pointer-events-auto absolute right-3 top-3 z-20 hidden sm:right-4 sm:block"
    >
      <CanvasGlass
        as="aside"
        themeMode={themeMode}
        className="flex w-64 flex-col rounded-xl"
      >
        <div
          className={cn(
            "flex items-center justify-between gap-2 border-b px-3 pb-0 pt-2.5",
            canvasGlassDividerClass(themeMode),
          )}
        >
          <div className="flex min-w-0">
            {(["design", "brainstorm"] as const).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => onTabChange(id)}
                className={cn(
                  "shrink-0 border-b-2 px-2 pb-2 text-[0.75rem] font-medium capitalize transition-colors",
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

          <button ref={shareButtonRef} type="button" onClick={onShare} className={shareCtaClass()}>
            Share
          </button>
        </div>

        {tab === "design" ? (
          <div className="space-y-3 p-3">
            <button
              type="button"
              onClick={() => setPageOpen((o) => !o)}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-1.5 py-1.5 text-left text-[0.75rem] font-medium",
                isLight
                  ? "text-[#1a1a1a]/80 hover:bg-black/[0.04]"
                  : "text-white/80 hover:bg-white/[0.06]",
              )}
            >
              Page background
              <span className="text-[0.65rem] opacity-50">{pageOpen ? "−" : "+"}</span>
            </button>

            {pageOpen && (
              <div className="space-y-2 px-1">
                <p
                  className={cn(
                    "font-mono text-[0.58rem] uppercase tracking-[0.12em]",
                    isLight ? "text-black/40" : "text-white/40",
                  )}
                >
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
          </div>
        ) : (
          <CanvasBrainstormPanel themeMode={theme.mode} />
        )}
      </CanvasGlass>
    </div>
  );
}
