import type { ReactNode } from "react";

import { isEnvToken } from "@/lib/docs/code-token";
import { cn } from "@/lib/utils";

type DocsInlineCodeProps = {
  children: ReactNode;
  variant?: "default" | "env";
};

export function DocsInlineCode({
  children,
  variant = "default",
}: DocsInlineCodeProps) {
  const text = typeof children === "string" ? children : "";
  const envStyle = variant === "env" || isEnvToken(text);

  return (
    <code
      className={cn(
        "rounded-[4px] px-1.5 py-0.5 font-mono text-[0.88em] font-medium",
        envStyle
          ? "border border-hub-primary/25 bg-hub-primary/10 text-hub-primary"
          : "border border-hub-foreground/10 bg-hub-surface-muted text-hub-foreground/90",
      )}
    >
      {children}
    </code>
  );
}
