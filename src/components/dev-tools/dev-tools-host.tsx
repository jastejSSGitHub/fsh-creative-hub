"use client";

import { useEffect, useRef } from "react";
import { Wrench, X } from "lucide-react";

import { useDevTools } from "@/lib/dev-tools/dev-tools-context";
import { cn } from "@/lib/utils";

export function DevToolsHost() {
  const devTools = useDevTools();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!devTools?.fabOpen) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (menuRef.current?.contains(target)) return;
      devTools?.setFabOpen(false);
    }

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [devTools]);

  if (!devTools?.isHubAdmin) return null;

  const { unlocked, simulateNewUser, fabOpen, registerUnlockClick, hideDevTools, setSimulateNewUser } =
    devTools;

  return (
    <div
      ref={menuRef}
      className="pointer-events-none fixed bottom-2 right-2 z-[9999] flex flex-col items-end gap-2"
    >
      {unlocked && fabOpen ? (
        <div
          className={cn(
            "pointer-events-auto w-[min(92vw,16rem)] overflow-hidden rounded-xl border border-hub-foreground/12",
            "bg-hub-surface/95 shadow-2xl backdrop-blur-md",
          )}
        >
          <div className="flex items-center gap-2 border-b border-hub-foreground/8 px-3 py-2.5">
            <Wrench className="size-3.5 text-hub-primary" aria-hidden />
            <p className="font-mono text-[0.625rem] font-semibold uppercase tracking-wider text-hub-foreground/70">
              Dev tools
            </p>
          </div>

          <div className="space-y-1 p-2">
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 py-2.5 transition-colors hover:bg-hub-foreground/5">
              <div>
                <p className="text-sm font-medium text-hub-foreground">Simulate new user</p>
                <p className="mt-0.5 text-[0.6875rem] leading-snug text-hub-foreground/55">
                  Replay onboarding on project, canvas, and hub tours
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={simulateNewUser}
                aria-label="Simulate new user"
                onClick={() => setSimulateNewUser(!simulateNewUser)}
                className={cn(
                  "relative h-6 w-11 shrink-0 rounded-full border transition-colors",
                  simulateNewUser
                    ? "border-hub-primary bg-hub-primary"
                    : "border-hub-foreground/15 bg-hub-foreground/10",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform",
                    simulateNewUser ? "translate-x-[1.125rem]" : "translate-x-0.5",
                  )}
                />
              </button>
            </label>

            <button
              type="button"
              onClick={hideDevTools}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-hub-foreground/70 transition-colors hover:bg-hub-foreground/5 hover:text-hub-foreground"
            >
              <X className="size-3.5 shrink-0" aria-hidden />
              Hide dev tools
            </button>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={registerUnlockClick}
        aria-label={unlocked ? "Dev tools menu" : "Dev tools unlock"}
        className={cn(
          "group pointer-events-auto relative flex items-center justify-center transition-all duration-200",
          unlocked
            ? "h-9 rounded-full border border-hub-foreground/15 bg-[#1a1a1a]/90 px-3.5 text-white shadow-lg backdrop-blur-sm"
            : "size-12 rounded-full opacity-0 hover:opacity-100 focus-visible:opacity-100",
        )}
      >
        {!unlocked ? (
          <span className="pointer-events-none absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-md border border-hub-foreground/10 bg-[#1a1a1a]/90 px-2 py-1 text-[0.6875rem] font-medium text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            Dev tools
          </span>
        ) : null}

        <span
          className={cn(
            "font-mono text-[0.625rem] font-semibold uppercase tracking-wider",
            unlocked ? "text-white/90" : "sr-only",
          )}
        >
          devtools
        </span>
      </button>
    </div>
  );
}
