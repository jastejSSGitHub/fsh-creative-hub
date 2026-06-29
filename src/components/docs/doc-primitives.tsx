import type { ReactNode } from "react";

import { DocsCopyableValue } from "@/components/docs/docs-copyable-value";
import { DocsInlineCode } from "@/components/docs/docs-inline-code";
import { DocsInlineText } from "@/components/docs/docs-inline-text";
import { looksLikeCopyableCommand, looksLikeCopyableUrl } from "@/lib/docs/copy-value";
import { looksLikeDocsCodeToken } from "@/lib/docs/code-token";
import { hasInlineDocsCode } from "@/lib/docs/inline-code";
import { cn } from "@/lib/utils";

type DocSectionProps = {
  id: string;
  title: string;
  children: ReactNode;
  className?: string;
};

export function DocSection({ id, title, children, className }: DocSectionProps) {
  return (
    <section id={id} className={cn("scroll-mt-28 not-first:mt-10", className)}>
      <h2 className="mb-4 font-display text-2xl font-bold tracking-tight text-hub-foreground sm:text-3xl">
        {title}
      </h2>
      <div className="space-y-4 text-[0.95rem] leading-relaxed text-hub-foreground/80 [&_h3]:mb-2 [&_h3]:mt-8 [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-hub-foreground [&_li]:ml-5 [&_li]:list-disc [&_ol>li]:list-decimal [&_p]:m-0 [&_ul]:space-y-1.5">
        {children}
      </div>
    </section>
  );
}

type DocLeadProps = {
  children: ReactNode;
};

export function DocLead({ children }: DocLeadProps) {
  return (
    <p className="mb-8 max-w-2xl text-[0.95rem] leading-relaxed text-hub-foreground/75">
      {children}
    </p>
  );
}

type DocTableProps = {
  headers: string[];
  rows: string[][];
};

function renderTableCell(cell: string): ReactNode {
  if (!cell) return cell;

  if (looksLikeCopyableUrl(cell)) {
    return <DocsCopyableValue value={cell} variant="url" />;
  }

  if (looksLikeCopyableCommand(cell)) {
    return <DocsCopyableValue value={cell} variant="command" />;
  }

  if (looksLikeDocsCodeToken(cell)) {
    return <DocsInlineCode>{cell}</DocsInlineCode>;
  }

  if (hasInlineDocsCode(cell)) {
    return <DocsInlineText>{cell}</DocsInlineText>;
  }

  return cell;
}

export function DocTable({ headers, rows }: DocTableProps) {
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
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-hub-foreground/5 last:border-0 even:bg-hub-surface-subtle/50"
            >
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-hub-foreground/85">
                  {renderTableCell(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
