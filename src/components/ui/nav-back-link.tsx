import { ChevronLeft } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

const navBackClassName =
  "group/nav-back -ml-1 inline-flex min-h-9 max-w-[min(100%,12rem)] items-center gap-0.5 rounded-[6px] py-1 pl-0.5 pr-2 text-[0.8125rem] font-medium leading-tight sm:max-w-[min(100%,16rem)]";

type NavBackLinkProps = {
  href: string;
  label: string;
  className?: string;
  prefetch?: boolean;
};

function NavBackContent({ label }: { label: string }) {
  return (
    <>
      <ChevronLeft
        className="size-3.5 shrink-0 stroke-[2] transition-transform group-hover/nav-back:-translate-x-px"
        aria-hidden
      />
      <span className="truncate">{label}</span>
    </>
  );
}

export function NavBackLink({
  href,
  label,
  className,
  prefetch = true,
}: NavBackLinkProps) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={cn(
        navBackClassName,
        "text-hub-primary transition-colors hover:bg-hub-primary/10 hover:text-[#1590e8] active:bg-hub-primary/[0.14]",
        className,
      )}
    >
      <NavBackContent label={label} />
    </Link>
  );
}

export function NavBackLabel({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(navBackClassName, "text-hub-primary/65", className)}
      aria-hidden
    >
      <NavBackContent label={label} />
    </span>
  );
}

export function NavBackLinkSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "-ml-1 inline-flex min-h-9 items-center gap-1 py-1 pl-0.5 pr-2",
        className,
      )}
      aria-hidden
    >
      <span className="size-3.5 animate-pulse rounded-sm bg-hub-primary/12" />
      <span className="h-3.5 w-20 animate-pulse rounded-md bg-hub-espresso/[0.08]" />
    </div>
  );
}
