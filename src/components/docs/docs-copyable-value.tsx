"use client";

import { Check, Copy, Link2, Terminal } from "lucide-react";
import { useState } from "react";

import { useDocsToast } from "@/components/docs/docs-toast-provider";
import {
  copyToastMessage,
  detectCopyVariant,
  looksLikeCopyableUrl,
  type DocsCopyVariant,
} from "@/lib/docs/copy-value";
import { cn } from "@/lib/utils";

type DocsCopyableValueProps = {
  value: string;
  copyValue?: string;
  variant?: DocsCopyVariant | "auto";
  className?: string;
};

export function DocsCopyableValue({
  value,
  copyValue = value,
  variant = "auto",
  className,
}: DocsCopyableValueProps) {
  const { showToast } = useDocsToast();
  const [copied, setCopied] = useState(false);
  const resolvedVariant =
    variant === "auto" ? detectCopyVariant(value, copyValue) : variant;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(copyValue);
      setCopied(true);
      showToast(copyToastMessage(resolvedVariant), "text");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Could not copy", "text");
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={`Copy ${copyValue}`}
      className={cn(
        "group inline-flex max-w-full items-center gap-2 rounded-[6px] border text-left transition-colors",
        resolvedVariant === "url"
          ? "border-hub-primary/25 bg-hub-primary/10 px-2.5 py-1 hover:border-hub-primary/40 hover:bg-hub-primary/15"
          : resolvedVariant === "command"
            ? "border-emerald-600/25 bg-emerald-600/10 px-2.5 py-1 hover:border-emerald-600/40 hover:bg-emerald-600/15"
            : "border-transparent px-2 py-1 hover:border-hub-foreground/10 hover:bg-hub-surface-muted",
        copied && "border-hub-approved/35 bg-hub-approved/10",
        className,
      )}
    >
      {resolvedVariant === "url" ? (
        <Link2
          className={cn(
            "size-3.5 shrink-0",
            copied ? "text-hub-approved" : "text-hub-primary/70",
          )}
          aria-hidden
        />
      ) : null}
      {resolvedVariant === "command" ? (
        <Terminal
          className={cn(
            "size-3.5 shrink-0",
            copied ? "text-hub-approved" : "text-emerald-700/75",
          )}
          aria-hidden
        />
      ) : null}
      <span
        className={cn(
          "min-w-0 truncate font-mono text-[0.8rem] font-medium transition-colors",
          copied
            ? "text-hub-approved"
            : resolvedVariant === "command"
              ? "text-emerald-800 group-hover:underline"
              : "text-hub-primary group-hover:underline",
        )}
      >
        {value}
      </span>
      {copied ? (
        <Check className="size-3.5 shrink-0 text-hub-approved" aria-hidden />
      ) : (
        <Copy
          className={cn(
            "size-3.5 shrink-0 transition-colors",
            copied
              ? "text-hub-approved"
              : resolvedVariant === "url"
                ? "text-hub-primary/50 group-hover:text-hub-primary/80"
                : resolvedVariant === "command"
                  ? "text-emerald-700/45 group-hover:text-emerald-700/75"
                  : "text-hub-foreground/35 group-hover:text-hub-foreground/60",
          )}
          aria-hidden
        />
      )}
    </button>
  );
}

export type DocsCopyableKeyValueRow = {
  label: string;
  value: string;
  copyValue?: string;
  variant?: DocsCopyVariant | "auto";
};

export function DocsCopyableKeyValueTable({
  rows,
}: {
  rows: DocsCopyableKeyValueRow[];
}) {
  return (
    <div className="my-6 overflow-x-auto rounded-[10px] border border-hub-foreground/10">
      <table className="w-full min-w-[32rem] text-left text-sm">
        <thead>
          <tr className="border-b border-hub-foreground/10 bg-hub-surface-muted">
            <th className="px-4 py-3 font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-hub-foreground/60">
              Item
            </th>
            <th className="px-4 py-3 font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-hub-foreground/60">
              Detail
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.label}
              className="border-b border-hub-foreground/5 last:border-0 even:bg-hub-surface-subtle/50"
            >
              <td className="px-4 py-3 text-hub-foreground/85">{row.label}</td>
              <td className="px-4 py-3 text-hub-foreground/85">
                <DocsCopyableValue
                  value={row.value}
                  copyValue={row.copyValue ?? row.value}
                  variant={row.variant}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export type DocsCopyableSettingsRow = {
  setting: string;
  local?: string;
  production?: string;
};

function renderSettingsCell(cell: string | undefined) {
  if (!cell) return null;
  if (looksLikeCopyableUrl(cell) || detectCopyVariant(cell) === "url") {
    return <DocsCopyableValue value={cell} variant="url" />;
  }
  return cell;
}

export function DocsCopyableSettingsTable({
  headers,
  rows,
}: {
  headers: [string, string, string];
  rows: DocsCopyableSettingsRow[];
}) {
  return (
    <div className="my-6 overflow-x-auto rounded-[10px] border border-hub-foreground/10">
      <table className="w-full min-w-[32rem] text-left text-sm">
        <thead>
          <tr className="border-b border-hub-foreground/10 bg-hub-surface-muted">
            {headers.map((header, index) => (
              <th
                key={`${index}-${header}`}
                className="px-4 py-3 font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-hub-foreground/60"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.setting}
              className="border-b border-hub-foreground/5 last:border-0 even:bg-hub-surface-subtle/50"
            >
              <td className="px-4 py-3 text-hub-foreground/85">{row.setting}</td>
              <td className="px-4 py-3 text-hub-foreground/85">
                {renderSettingsCell(row.local)}
              </td>
              <td className="px-4 py-3 text-hub-foreground/85">
                {renderSettingsCell(row.production)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
