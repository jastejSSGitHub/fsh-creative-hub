"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuthTransition } from "@/components/auth/auth-transition-provider";
import { cn } from "@/lib/utils";
import { LOGIN_PATH, PROJECTS_PATH } from "@/lib/routes";

type PrimaryCtaProps = {
  isLoggedIn: boolean;
  className?: string;
  size?: "default" | "large";
};

export function PrimaryCta({
  isLoggedIn,
  className,
  size = "default",
}: PrimaryCtaProps) {
  const router = useRouter();
  const { beginAuthTransition } = useAuthTransition();
  const prefersReducedMotion = useReducedMotion();
  const href = isLoggedIn ? PROJECTS_PATH : LOGIN_PATH;
  const label = isLoggedIn ? "Open Hub" : "Enter the Hub →";

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    beginAuthTransition(isLoggedIn ? "Opening hub…" : "Loading…");
    router.push(href);
  }

  return (
    <motion.div
      whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Link
        href={href}
        onClick={handleClick}
        className={cn(
          "group inline-flex min-h-11 min-w-[11rem] items-center justify-center rounded-full bg-hub-accent px-8 font-mono text-xs font-medium uppercase tracking-[0.12em] text-hub-espresso shadow-[0_0_0_1px_rgba(255,201,75,0.3)] transition-shadow hover:shadow-[0_8px_32px_rgba(255,201,75,0.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-hub-accent",
          size === "large" && "min-h-[3.25rem] px-10 text-sm",
          className,
        )}
      >
        <span className="transition-transform group-hover:translate-x-0.5">
          {label}
        </span>
      </Link>
    </motion.div>
  );
}
