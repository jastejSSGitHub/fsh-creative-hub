"use client";

import { useState } from "react";

import { useDocsToast } from "@/components/docs/docs-toast-provider";
import { copyToastMessage } from "@/lib/docs/copy-value";
import { cn } from "@/lib/utils";

type DocsColorValueProps = {
  hex: string;
  description?: string;
  className?: string;
};

export function DocsColorValue({
  hex,
  description,
  className,
}: DocsColorValueProps) {
  const { showToast } = useDocsToast();
  const [copied, setCopied] = useState(false);
  const normalized = hex.toLowerCase();

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(normalized);
      setCopied(true);
      showToast(copyToastMessage("hex"), "text");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Could not copy hex", "text");
    }
  }

  return (
    <span className={cn("inline-flex flex-wrap items-center gap-x-2 gap-y-1", className)}>
      <button
        type="button"
        onClick={handleCopy}
        title={`Copy ${normalized}`}
        className={cn(
          "group inline-flex items-center gap-2 rounded-[6px] border border-transparent px-1.5 py-1 transition-colors",
          "hover:border-hub-foreground/10 hover:bg-hub-surface-muted",
          copied && "border-hub-primary/25 bg-hub-primary/8",
        )}
      >
        <span
          className="size-4 shrink-0 rounded-[4px] border border-hub-foreground/15 shadow-sm"
          style={{ backgroundColor: hex }}
          aria-hidden
        />
        <span
          className={cn(
            "font-mono text-[0.8rem] font-medium transition-colors",
            copied ? "text-hub-approved" : "text-hub-primary group-hover:underline",
          )}
        >
          {normalized}
        </span>
      </button>
      {description ? (
        <span className="text-hub-foreground/70">— {description}</span>
      ) : null}
    </span>
  );
}

export type DocsColorToken = {
  token: string;
  hex: string;
  use: string;
};

export function DocsColorTokenTable({ tokens }: { tokens: DocsColorToken[] }) {
  return (
    <div className="my-6 overflow-x-auto rounded-[10px] border border-hub-foreground/10">
      <table className="w-full min-w-[32rem] text-left text-sm">
        <thead>
          <tr className="border-b border-hub-foreground/10 bg-hub-surface-muted">
            <th className="px-4 py-3 font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-hub-foreground/60">
              Token
            </th>
            <th className="px-4 py-3 font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-hub-foreground/60">
              Value / use
            </th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((row) => (
            <tr
              key={row.token}
              className="border-b border-hub-foreground/5 last:border-0 even:bg-hub-surface-subtle/50"
            >
              <td className="px-4 py-3 text-hub-foreground/85">
                <code className="rounded-[4px] border border-hub-foreground/10 bg-hub-surface-muted px-1.5 py-0.5 font-mono text-[0.88em] text-hub-foreground/90">
                  {row.token}
                </code>
              </td>
              <td className="px-4 py-3 text-hub-foreground/85">
                <DocsColorValue hex={row.hex} description={row.use} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type DocsStatusColorCardProps = {
  label: string;
  hex: string;
  description: string;
  borderClass: string;
  bgClass: string;
  textClass: string;
};

export function DocsStatusColorCard({
  label,
  hex,
  description,
  borderClass,
  bgClass,
  textClass,
}: DocsStatusColorCardProps) {
  return (
    <div
      className={cn(
        "rounded-[6px] border px-4 py-3 text-sm",
        borderClass,
        bgClass,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("font-mono text-xs font-medium", textClass)}>
          {label}
        </span>
        <DocsColorValue hex={hex} className="text-xs" />
      </div>
      <p className="mt-2 text-hub-foreground/80">{description}</p>
    </div>
  );
}
