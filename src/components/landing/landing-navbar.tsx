"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { PrimaryCta } from "@/components/landing/primary-cta";
import { LANDING_SCROLL_ID, scrollElementTo } from "@/lib/scroll-container";
import { cn } from "@/lib/utils";

const NAV_LINKS: ReadonlyArray<{
  label: string;
  href: string;
  external?: boolean;
}> = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Docs", href: "/docs", external: true },
];

type LandingNavbarProps = {
  isLoggedIn: boolean;
};

export function LandingNavbar({ isLoggedIn }: LandingNavbarProps) {
  const prefersReducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const updateVisibility = useCallback(() => {
    const scrollRoot = document.getElementById(LANDING_SCROLL_ID);
    const currentY = scrollRoot?.scrollTop ?? window.scrollY;
    const delta = currentY - lastScrollY.current;

    if (currentY < 48) {
      setVisible(true);
    } else if (delta > 8) {
      setVisible(false);
      setMenuOpen(false);
    } else if (delta < -8) {
      setVisible(true);
    }

    lastScrollY.current = currentY;
    ticking.current = false;
  }, []);

  useEffect(() => {
    const scrollRoot = document.getElementById(LANDING_SCROLL_ID);

    function onScroll() {
      if (!ticking.current) {
        ticking.current = true;
        window.requestAnimationFrame(updateVisibility);
      }
    }

    scrollRoot?.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      scrollRoot?.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", onScroll);
    };
  }, [updateVisibility]);

  useEffect(() => {
    if (!menuOpen) return;
    const scrollRoot = document.getElementById(LANDING_SCROLL_ID);
    const previousBodyOverflow = document.body.style.overflow;
    const previousScrollOverflow = scrollRoot?.style.overflow ?? "";
    document.body.style.overflow = "hidden";
    if (scrollRoot) scrollRoot.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      if (scrollRoot) scrollRoot.style.overflow = previousScrollOverflow;
    };
  }, [menuOpen]);

  function handleAnchorClick(
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) {
    if (!href.startsWith("#")) return;
    event.preventDefault();
    setMenuOpen(false);
    const target = document.querySelector(href);
    if (target instanceof HTMLElement) {
      scrollElementTo(target, {
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    }
  }

  return (
    <>
      <motion.header
        initial={false}
        animate={{
          y: visible ? 0 : -120,
          opacity: visible ? 1 : 0,
        }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { type: "spring", stiffness: 380, damping: 32 }
        }
        className="fixed inset-x-0 top-0 z-50 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-2xl border border-hub-foreground/8 bg-hub-paper/85 px-4 py-2.5 shadow-[0_8px_32px_rgba(11,11,11,0.06)] backdrop-blur-xl sm:px-5">
          <Link
            href="/"
            className="font-display text-base font-extrabold tracking-tight text-hub-foreground sm:text-lg"
          >
            FSH Creative Hub
          </Link>

          <nav
            aria-label="Landing"
            className="hidden items-center gap-1 lg:flex"
          >
            {NAV_LINKS.map((link) =>
              link.external ? (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg px-3 py-2 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-hub-foreground/65 transition-colors hover:bg-hub-surface-muted hover:text-hub-foreground"
                >
                  {link.label}
                </a>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleAnchorClick(e, link.href)}
                  className="rounded-lg px-3 py-2 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-hub-foreground/65 transition-colors hover:bg-hub-surface-muted hover:text-hub-foreground"
                >
                  {link.label}
                </a>
              ),
            )}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden shrink-0 md:block">
              <PrimaryCta isLoggedIn={isLoggedIn} />
            </div>

            <button
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-xl border border-hub-foreground/10 bg-hub-surface text-hub-foreground lg:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <button
              type="button"
              className="absolute inset-0 bg-hub-espresso/35 backdrop-blur-sm"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
            />
            <motion.nav
              initial={{ y: -12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              className="absolute inset-x-4 top-[calc(4.5rem+env(safe-area-inset-top))] rounded-2xl border border-hub-foreground/10 bg-hub-paper p-4 shadow-2xl"
              aria-label="Mobile landing navigation"
            >
              <ul className="space-y-1">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-xl px-4 py-3 font-mono text-xs uppercase tracking-[0.12em] text-hub-foreground/80 hover:bg-hub-surface-muted"
                        onClick={() => setMenuOpen(false)}
                      >
                        {link.label}
                      </a>
                    ) : (
                      <a
                        href={link.href}
                        onClick={(e) => handleAnchorClick(e, link.href)}
                        className="block rounded-xl px-4 py-3 font-mono text-xs uppercase tracking-[0.12em] text-hub-foreground/80 hover:bg-hub-surface-muted"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
              <div className="mt-4 border-t border-hub-foreground/8 pt-4 md:hidden">
                <PrimaryCta isLoggedIn={isLoggedIn} className="w-full" />
              </div>
            </motion.nav>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="h-[calc(4.25rem+env(safe-area-inset-top))]" aria-hidden />
    </>
  );
}
