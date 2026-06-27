"use client";

import { Globe } from "lucide-react";

import { truncateUrlDisplay } from "@/lib/documents/url-display";
import { cn } from "@/lib/utils";

type UrlLinkTagProps = {
  url: string;
  className?: string;
  maxLength?: number;
  title?: string;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
};

export function UrlLinkTag({
  url,
  className,
  maxLength = 40,
  title,
  onClick,
}: UrlLinkTagProps) {
  const label = truncateUrlDisplay(url, maxLength);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={title ?? url}
      onClick={onClick}
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-[5px] border border-[#18a0fb]/25 bg-[#18a0fb]/10 px-2 py-0.5",
        "text-[0.8125rem] font-medium leading-snug text-[#1280c7]",
        "transition-colors hover:border-[#18a0fb]/35 hover:bg-[#18a0fb]/14",
        className,
      )}
    >
      <Globe className="size-3.5 shrink-0 text-[#18a0fb]/70" aria-hidden />
      <span className="min-w-0 truncate">{label}</span>
    </a>
  );
}
