"use client";

import { usePathname } from "next/navigation";

import { HubMain } from "@/components/hub/hub-main";
import { FOR_YOU_PATH } from "@/lib/routes";
import { cn } from "@/lib/utils";

type HubContentFrameProps = {
  children: React.ReactNode;
};

function isInboxLayoutPath(pathname: string) {
  return pathname.startsWith(FOR_YOU_PATH);
}

function isTasksLayoutPath(pathname: string) {
  return pathname.startsWith("/tasks");
}

export function HubContentFrame({ children }: HubContentFrameProps) {
  const pathname = usePathname() ?? "";

  if (isInboxLayoutPath(pathname)) {
    return (
      <main
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-hidden pb-[calc(3.75rem+env(safe-area-inset-bottom))] lg:pb-0",
        )}
      >
        {children}
      </main>
    );
  }

  if (isTasksLayoutPath(pathname)) {
    return (
      <main
        className={cn(
          "flex min-h-0 flex-1 flex-col pb-[calc(3.75rem+env(safe-area-inset-bottom))] lg:pb-0",
        )}
      >
        {children}
      </main>
    );
  }

  return <HubMain>{children}</HubMain>;
}
