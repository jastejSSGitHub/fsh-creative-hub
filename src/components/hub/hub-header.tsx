"use client";

import { usePathname } from "next/navigation";

import { HubBrandLink } from "@/components/hub/hub-brand-link";
import { HubNav } from "@/components/hub/hub-nav";
import { HubProfileMenu } from "@/components/hub/hub-profile-menu";
import { HubSearch } from "@/components/hub/hub-search";
import { isHubDetailPath } from "@/lib/routes";

type HubHeaderProps = {
  forYouCount: number;
  displayName: string;
  email: string;
  avatarUrl?: string | null;
};

export function HubHeader({
  forYouCount,
  displayName,
  email,
  avatarUrl,
}: HubHeaderProps) {
  const pathname = usePathname();

  if (isHubDetailPath(pathname)) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-white/6 bg-hub-espresso">
      <div className="flex h-11 items-center gap-3 px-3 sm:gap-4 sm:px-4">
        <HubBrandLink displayName={displayName} />

        <div className="hidden min-w-0 flex-1 justify-center sm:flex">
          <HubSearch />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <HubNav forYouCount={forYouCount} />
          <HubProfileMenu
            displayName={displayName}
            email={email}
            avatarUrl={avatarUrl}
          />
        </div>
      </div>

      <div className="border-t border-white/6 px-3 py-2 sm:hidden">
        <HubSearch />
      </div>
    </header>
  );
}
