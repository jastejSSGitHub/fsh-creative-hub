"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { useDocsToast } from "@/components/docs/docs-toast-provider";
import { cn } from "@/lib/utils";

type DocsCopyButtonProps = {
  value: string;
  label?: string;
  kind?: "code" | "text";
  className?: string;
};

export function DocsCopyButton({
  value,
  label = "Copy",
  kind = "code",
  className,
}: DocsCopyButtonProps) {
  const { showToast } = useDocsToast();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      showToast(kind === "code" ? "Code copied" : "Text copied", kind);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Could not copy — try selecting manually", "text");
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-hub-foreground/10 bg-hub-surface px-2.5 py-1.5 font-mono text-[0.65rem] uppercase tracking-wider text-hub-foreground/70 transition-colors hover:bg-hub-surface-muted hover:text-hub-foreground",
        className,
      )}
    >
      {copied ? (
        <Check className="size-3.5 text-hub-approved" aria-hidden />
      ) : (
        <Copy className="size-3.5" aria-hidden />
      )}
      <span className="hidden sm:inline">{copied ? "Copied" : label}</span>
    </button>
  );
}
