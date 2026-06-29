"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import {
  Bell,
  BellOff,
  BookOpen,
  Check,
  ChevronDown,
  LogOut,
  Moon,
  Palette,
  Settings,
  Sun,
} from "lucide-react";

import { profileInitials } from "@/lib/hub/profile-initials";
import { cn } from "@/lib/utils";

const MUTE_STORAGE_KEY = "hub.notifications.muted";

type HubProfileMenuProps = {
  displayName: string;
  email: string;
  avatarUrl?: string | null;
};

export function HubProfileMenu({
  displayName,
  email,
  avatarUrl,
}: HubProfileMenuProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [muted, setMuted] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(MUTE_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [showNameTooltip, setShowNameTooltip] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const initials = profileInitials(displayName);
  const activeTheme = theme === "system" ? resolvedTheme : theme;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setThemeOpen(false);
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function toggleMuted() {
    const next = !muted;
    setMuted(next);
    try {
      localStorage.setItem(MUTE_STORAGE_KEY, String(next));
    } catch {
      // ignore
    }
  }

  function selectTheme(next: "light" | "dark") {
    setTheme(next);
    setThemeOpen(false);
  }

  return (
    <div ref={menuRef} className={cn("relative shrink-0", open && "z-[60]")}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        onMouseEnter={() => setShowNameTooltip(true)}
        onMouseLeave={() => setShowNameTooltip(false)}
        onFocus={() => setShowNameTooltip(true)}
        onBlur={() => setShowNameTooltip(false)}
        className="relative flex items-center gap-1 rounded-full py-0.5 pr-0.5 pl-0.5 transition-colors hover:bg-hub-surface/8"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Account menu for ${displayName}`}
      >
        {showNameTooltip && !open && (
          <span
            role="tooltip"
            className="absolute top-1/2 right-[calc(100%+8px)] -translate-y-1/2 whitespace-nowrap rounded-md border border-white/10 bg-[#1a1a1a] px-2.5 py-1 text-xs font-medium text-white shadow-lg"
          >
            <span
              aria-hidden
              className="absolute top-1/2 -right-1 size-2 -translate-y-1/2 rotate-45 border border-white/10 border-t-0 border-l-0 bg-[#1a1a1a]"
            />
            {displayName}
          </span>
        )}

        <span className="inline-flex size-7 items-center justify-center overflow-hidden rounded-full bg-hub-surface/15 text-[0.65rem] font-semibold text-white">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="size-full object-cover" />
          ) : (
            initials
          )}
        </span>
        <ChevronDown
          className={cn(
            "size-3.5 text-white/45 transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-[calc(100%+8px)] right-0 z-[70] w-64 overflow-hidden rounded-xl border border-hub-foreground/10 bg-hub-surface shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
        >
          <div className="border-b border-hub-foreground/8 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-hub-primary/12 text-xs font-semibold text-hub-primary">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="size-full object-cover" />
                ) : (
                  initials
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-hub-foreground">
                  {displayName}
                </p>
                <p className="truncate text-xs text-hub-foreground/45">{email}</p>
              </div>
            </div>
          </div>

          <div className="py-1">
            <MenuButton
              icon={muted ? BellOff : Bell}
              label={muted ? "Unmute notifications" : "Mute notifications"}
              onClick={toggleMuted}
            />

            <div>
              <MenuButton
                icon={Palette}
                label="Theme"
                onClick={() => setThemeOpen((value) => !value)}
                trailing={
                  <ChevronDown
                    className={cn(
                      "size-3.5 text-hub-foreground/40 transition-transform",
                      themeOpen && "rotate-180",
                    )}
                    aria-hidden
                  />
                }
                aria-expanded={themeOpen}
              />
              {themeOpen && mounted && (
                <div className="px-2 pb-1">
                  <ThemeOption
                    icon={Sun}
                    label="Light mode"
                    selected={activeTheme === "light"}
                    onClick={() => selectTheme("light")}
                  />
                  <ThemeOption
                    icon={Moon}
                    label="Dark mode"
                    selected={activeTheme === "dark"}
                    onClick={() => selectTheme("dark")}
                  />
                </div>
              )}
            </div>

            <a
              href="/docs"
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-hub-foreground transition-colors hover:bg-hub-foreground/[0.04]"
              onClick={() => setOpen(false)}
            >
              <BookOpen className="size-4 text-hub-foreground/55" />
              Documentation
            </a>

            <MenuButton
              icon={Settings}
              label="Settings"
              onClick={() => setOpen(false)}
              disabled
              hint="Soon"
            />
            <MenuButton
              icon={Bell}
              label="Notifications"
              onClick={() => setOpen(false)}
              disabled
              hint="Soon"
            />
          </div>

          <div className="border-t border-hub-foreground/8 py-1">
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-hub-foreground transition-colors hover:bg-hub-foreground/[0.04]"
              >
                <LogOut className="size-4 text-hub-foreground/55" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  hint,
  trailing,
  "aria-expanded": ariaExpanded,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  hint?: string;
  trailing?: React.ReactNode;
  "aria-expanded"?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      aria-expanded={ariaExpanded}
      className={cn(
        "flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-hub-foreground transition-colors",
        disabled
          ? "cursor-default opacity-50"
          : "hover:bg-hub-foreground/[0.04]",
      )}
    >
      <Icon className="size-4 text-hub-foreground/55" />
      <span className="flex-1">{label}</span>
      {hint && (
        <span className="font-mono text-[0.58rem] uppercase tracking-wider text-hub-foreground/30">
          {hint}
        </span>
      )}
      {trailing}
    </button>
  );
}

function ThemeOption({
  icon: Icon,
  label,
  selected,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-left text-sm transition-colors",
        selected
          ? "bg-hub-foreground/8 text-hub-foreground"
          : "text-hub-foreground/75 hover:bg-hub-foreground/[0.04] hover:text-hub-foreground",
      )}
    >
      <Icon className="size-3.5 text-hub-foreground/55" />
      <span className="flex-1">{label}</span>
      {selected && <Check className="size-3.5 text-hub-primary" aria-hidden />}
    </button>
  );
}
