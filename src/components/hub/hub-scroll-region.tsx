"use client";

import { usePathname } from "next/navigation";

import { FOR_YOU_PATH } from "@/lib/routes";
import { isCanvasPath, isHubDetailPath } from "@/lib/routes";
import { cn } from "@/lib/utils";

type HubScrollRegionProps = {
  children: React.ReactNode;
};

function usesFillLayout(pathname: string) {
  return (
    isHubDetailPath(pathname) ||
    isCanvasPath(pathname) ||
    pathname.startsWith(FOR_YOU_PATH)
  );
}

export function HubScrollRegion({ children }: HubScrollRegionProps) {
  const pathname = usePathname() ?? "";
  const fillLayout = usesFillLayout(pathname);
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
