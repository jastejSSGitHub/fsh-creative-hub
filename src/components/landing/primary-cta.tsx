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
          "group inline-flex min-h-11 min-w-[11rem] items-center justify-center rounded-full border border-hub-espresso/15 bg-hub-accent px-8 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-hub-espresso shadow-[0_6px_24px_rgba(255,184,0,0.45),0_2px_0_#e5a500] transition-[background-color,box-shadow,transform] hover:bg-[#ffd15f] hover:shadow-[0_8px_28px_rgba(255,184,0,0.55),0_2px_0_#d99a00] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-hub-espresso",
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
