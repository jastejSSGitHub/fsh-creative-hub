import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type CalloutVariant = "info" | "success" | "warning" | "danger" | "tip";

const VARIANT_STYLES: Record<
  CalloutVariant,
  { border: string; bg: string; icon: string; label: string }
> = {
  info: {
    border: "border-hub-primary/30",
    bg: "bg-hub-primary/8",
    icon: "text-hub-primary",
    label: "Info",
  },
  success: {
    border: "border-hub-approved/35",
    bg: "bg-hub-approved/10",
    icon: "text-hub-approved",
    label: "Success",
  },
  warning: {
    border: "border-hub-pending/35",
    bg: "bg-hub-pending/10",
    icon: "text-hub-pending",
    label: "Warning",
  },
  danger: {
    border: "border-hub-rejected/35",
    bg: "bg-hub-rejected/10",
    icon: "text-hub-rejected",
    label: "Caution",
  },
  tip: {
    border: "border-hub-accent/50",
    bg: "bg-hub-accent/15",
    icon: "text-hub-espresso",
    label: "Tip",
  },
};

type DocsCalloutProps = {
  variant?: CalloutVariant;
  title?: string;
  children: ReactNode;
  className?: string;
};

export function DocsCallout({
  variant = "info",
  title,
  children,
  className,
}: DocsCalloutProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <aside
      className={cn(
        "my-6 rounded-[10px] border-l-4 px-4 py-4 sm:px-5",
        styles.border,
        styles.bg,
        className,
      )}
    >
      <p
        className={cn(
          "mb-1 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.14em]",
          styles.icon,
        )}
      >
        {title ?? styles.label}
      </p>
      <div className="text-sm leading-relaxed text-hub-foreground/85 [&>p]:m-0 [&>p+p]:mt-2">
        {children}
      </div>
    </aside>
  );
}
