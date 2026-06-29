"use client";

import Link from "next/link";

import { HubTooltip } from "@/components/ui/hub-tooltip";
import { PROJECTS_PATH } from "@/lib/routes";

type HubBrandLinkProps = {
  displayName: string;
};

export function HubBrandLink({ displayName }: HubBrandLinkProps) {
  return (
    <HubTooltip label={displayName} side="bottom" className="shrink-0">
          <Link
            href={PROJECTS_PATH}
            prefetch={false}
            className="block max-w-[11rem] truncate font-display text-sm font-extrabold tracking-tight text-white transition-opacity hover:opacity-90 sm:max-w-none sm:text-[0.9375rem]"
          >
        FSH Creative Hub
      </Link>
    </HubTooltip>
  );
}
