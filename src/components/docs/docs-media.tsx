import Image from "next/image";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type DocsScreenshotProps = {
  src: string;
  alt: string;
  caption?: string;
  priority?: boolean;
  className?: string;
};

export function DocsScreenshot({
  src,
  alt,
  caption,
  priority = false,
  className,
}: DocsScreenshotProps) {
  return (
    <figure className={cn("my-8", className)}>
      <div className="overflow-hidden rounded-[10px] border border-hub-foreground/10 bg-hub-surface shadow-[0_16px_48px_rgba(11,11,11,0.08)]">
        <Image
          src={src}
          alt={alt}
          width={1440}
          height={900}
          priority={priority}
          unoptimized
          className="h-auto w-full"
        />
      </div>
      {caption ? (
        <figcaption className="mt-3 text-center font-mono text-[0.65rem] uppercase tracking-[0.12em] text-hub-foreground/45">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

type DocsLoomEmbedProps = {
  loomUrl: string;
  title: string;
  className?: string;
};

export function DocsLoomEmbed({ loomUrl, title, className }: DocsLoomEmbedProps) {
  const id = loomUrl.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/)?.[1];
  if (!id) return null;

  const embedSrc = `https://www.loom.com/embed/${id}?hide_owner=true&hide_share=true&hide_title=true&hideEmbedTopBar=true`;

  return (
    <div
      className={cn(
        "my-8 overflow-hidden rounded-[10px] border border-hub-foreground/10 bg-hub-espresso shadow-[0_16px_48px_rgba(11,11,11,0.12)]",
        className,
      )}
    >
      <div className="relative aspect-video w-full">
        <iframe
          src={embedSrc}
          title={title}
          allow="autoplay; fullscreen; picture-in-picture"
          className="absolute inset-0 size-full"
        />
      </div>
      <p className="border-t border-white/10 px-4 py-2.5 font-mono text-[0.65rem] uppercase tracking-wider text-white/50">
        {title}
      </p>
    </div>
  );
}

type DocsIllustrationFrameProps = {
  gradientClassName: string;
  children: ReactNode;
  caption?: string;
  className?: string;
};

export function DocsIllustrationFrame({
  gradientClassName,
  children,
  caption,
  className,
}: DocsIllustrationFrameProps) {
  return (
    <figure className={cn("my-8", className)}>
      <div
        className={cn(
          "overflow-hidden rounded-[10px] p-5 shadow-[0_24px_64px_rgba(11,11,11,0.12)] sm:p-6 md:p-8",
          gradientClassName,
        )}
      >
        <div className="overflow-hidden rounded-lg border border-white/20 bg-hub-surface shadow-lg">
          {children}
        </div>
      </div>
      {caption ? (
        <figcaption className="mt-3 text-center font-mono text-[0.65rem] uppercase tracking-[0.12em] text-hub-foreground/45">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
