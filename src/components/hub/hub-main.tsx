"use client";

import { usePathname } from "next/navigation";

import { isCanvasPath, isHubDetailPath } from "@/lib/routes";
import { cn } from "@/lib/utils";

type HubMainProps = {
  children: React.ReactNode;
};

export function HubMain({ children }: HubMainProps) {
  const pathname = usePathname();
  const isDetailPage = isHubDetailPath(pathname);

  if (isDetailPage) {
    return (
      <main
        className={cn(
          "flex min-h-0 flex-1 flex-col pb-[calc(3.75rem+env(safe-area-inset-bottom))] lg:pb-0",
          isCanvasPath(pathname) && "overflow-hidden",
        )}
      >
        {children}
      </main>
    );
  }

  return (
    <main className={cn("flex-1 pb-[calc(3.75rem+env(safe-area-inset-bottom))] lg:pb-0", "py-5 sm:py-10")}>
      <div className="mx-auto w-full max-w-6xl min-w-0 px-3 sm:px-6">{children}</div>
    </main>
  );
}
