"use client";

import { usePathname } from "next/navigation";

import { isCanvasPath, usesHubFillScrollLayout } from "@/lib/routes";
import { cn } from "@/lib/utils";

type HubScrollRegionProps = {
  children: React.ReactNode;
};

export function HubScrollRegion({ children }: HubScrollRegionProps) {
  const pathname = usePathname() ?? "";
  const fillLayout = usesHubFillScrollLayout(pathname);
  const hideBottomNav = isCanvasPath(pathname);

  return (
    <div
      data-fsh-scroll={fillLayout ? undefined : ""}
      className={cn(
        "flex min-h-0 flex-1 flex-col",
        fillLayout ? "overflow-hidden" : "fsh-scroll overflow-y-auto",
        !hideBottomNav &&
          "max-lg:mb-[calc(3.75rem+env(safe-area-inset-bottom))]",
      )}
    >
      {children}
    </div>
  );
}
