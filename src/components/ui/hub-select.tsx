"use client";

import { ChevronRight } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type HubSelectOption<T extends string = string> = {
  value: T;
  label: string;
};

type HubSelectProps<T extends string = string> = {
  value: T;
  onChange: (value: T) => void;
  options: HubSelectOption<T>[];
  disabled?: boolean;
  variant?: "field" | "inline";
  menuAlign?: "left" | "right";
  "aria-label"?: string;
  className?: string;
  formatLabel?: (label: string) => string;
  renderSelectedLabel?: (option: HubSelectOption<T> | undefined) => ReactNode;
  renderOptionLabel?: (option: HubSelectOption<T>) => ReactNode;
  getOptionClassName?: (option: HubSelectOption<T>) => string | undefined;
};

type MenuPlacement = "below" | "above";

export function HubSelect<T extends string = string>({
  value,
  onChange,
  options,
  disabled = false,
  variant = "field",
  menuAlign = "left",
  "aria-label": ariaLabel,
  className,
  formatLabel = (label) => label,
  renderSelectedLabel,
  renderOptionLabel,
  getOptionClassName,
}: HubSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<MenuPlacement>("below");
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const selected = options.find((option) => option.value === value);
  const estimatedMenuHeight = options.length * 34 + 8;

  function resolvePlacement() {
    const root = rootRef.current;
    if (!root) return;

    const rect = root.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (spaceBelow < estimatedMenuHeight + 8 && spaceAbove > spaceBelow) {
      setPlacement("above");
      return;
    }

    setPlacement("below");
  }

  function toggleOpen() {
    if (disabled) return;

    if (open) {
      setOpen(false);
      return;
    }

    resolvePlacement();
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function selectOption(nextValue: T) {
    onChange(nextValue);
    setOpen(false);
  }

  return (
    <div
      ref={rootRef}
      className={cn("relative", variant === "field" && "w-full shrink-0")}
    >
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onClick={toggleOpen}
        className={cn(
          "relative inline-flex items-center text-[0.8125rem] outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60",
          variant === "field" &&
            "min-h-8 w-full rounded-[6px] border border-hub-foreground/12 bg-hub-surface py-0 pr-6 pl-2.5 text-hub-foreground focus-visible:border-[#18a0fb]/50 focus-visible:ring-1 focus-visible:ring-[#18a0fb]/40",
          variant === "inline" &&
            "gap-0.5 bg-transparent py-0 pr-3 pl-0 text-hub-foreground/45 hover:text-hub-foreground/70 focus-visible:text-hub-foreground/70",
          open && variant === "field" && "border-[#18a0fb]/50 ring-1 ring-[#18a0fb]/40",
          className,
        )}
      >
        <span className="truncate">
          {renderSelectedLabel
            ? renderSelectedLabel(selected)
            : formatLabel(selected?.label ?? "")}
        </span>
        <ChevronRight
          className={cn(
            "pointer-events-none absolute text-hub-foreground/40 transition-transform duration-150",
            variant === "field"
              ? "top-1/2 right-2 size-3.5 -translate-y-1/2 rotate-90"
              : "top-1/2 right-0 size-3 -translate-y-1/2",
            open && variant === "field" && "rotate-[270deg]",
          )}
        />
      </button>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          className={cn(
            "absolute z-50 min-w-full overflow-hidden rounded-[6px] border border-hub-foreground/12 bg-hub-surface py-1 shadow-xl",
            variant === "inline" ? "right-0" : menuAlign === "right" ? "right-0" : "left-0",
            placement === "below" ? "top-full mt-1" : "bottom-full mb-1",
          )}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            const optionClassName = getOptionClassName?.(option);

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => selectOption(option.value)}
                className={cn(
                  "flex w-full items-center px-2.5 py-1.5 text-left text-[0.8125rem] text-hub-foreground transition-colors",
                  isSelected
                    ? "bg-[#18a0fb]/10 font-medium"
                    : "hover:bg-hub-foreground/[0.04]",
                  optionClassName,
                )}
              >
                {renderOptionLabel
                  ? renderOptionLabel(option)
                  : formatLabel(option.label)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
