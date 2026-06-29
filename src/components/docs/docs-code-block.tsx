"use client";

import { DocsCopyButton } from "@/components/docs/docs-copy-button";
import { cn } from "@/lib/utils";

type DocsCodeBlockProps = {
  code: string;
  language?: string;
  title?: string;
  className?: string;
};

export function DocsCodeBlock({
  code,
  language = "bash",
  title,
  className,
}: DocsCodeBlockProps) {
  return (
    <div
      className={cn(
        "group relative my-6 overflow-hidden rounded-[10px] border border-hub-foreground/10 bg-hub-espresso shadow-[0_12px_40px_rgba(11,11,11,0.12)]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.04] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-[#ff5f57]" aria-hidden />
          <span className="size-2 rounded-full bg-[#febc2e]" aria-hidden />
          <span className="size-2 rounded-full bg-[#28c840]" aria-hidden />
          {title ? (
            <span className="ml-2 font-mono text-[0.65rem] uppercase tracking-wider text-white/50">
              {title}
            </span>
          ) : (
            <span className="ml-2 font-mono text-[0.65rem] uppercase tracking-wider text-white/40">
              {language}
            </span>
          )}
        </div>
        <DocsCopyButton
          value={code}
          kind="code"
          className="border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
        />
      </div>
      <pre className="overflow-x-auto p-4 sm:p-5">
        <code className="font-mono text-[0.8rem] leading-relaxed text-[#e8e4dc] sm:text-sm">
          {code}
        </code>
      </pre>
    </div>
  );
}
