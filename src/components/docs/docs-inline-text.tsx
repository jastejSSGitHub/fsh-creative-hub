import { DocsInlineCode } from "@/components/docs/docs-inline-code";
import { splitInlineDocsCode } from "@/lib/docs/inline-code";

type DocsInlineTextProps = {
  children: string;
};

export function DocsInlineText({ children }: DocsInlineTextProps) {
  const segments = splitInlineDocsCode(children);

  if (segments.length === 1 && segments[0]?.kind === "text") {
    return <>{children}</>;
  }

  return (
    <>
      {segments.map((segment, index) =>
        segment.kind === "code" ? (
          <DocsInlineCode key={`${index}-${segment.value}`}>{segment.value}</DocsInlineCode>
        ) : (
          <span key={`${index}-text`}>{segment.value}</span>
        ),
      )}
    </>
  );
}
