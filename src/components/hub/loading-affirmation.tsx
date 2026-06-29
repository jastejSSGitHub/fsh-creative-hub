"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type LoadingAffirmationProps = {
  messages: readonly string[];
  className?: string;
  /** Delay before showing copy so fast loads never flash messaging. */
  delayMs?: number;
};

export function LoadingAffirmation({
  messages,
  className,
  delayMs = 1_500,
}: LoadingAffirmationProps) {
  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs]);

  useEffect(() => {
    if (!visible || messages.length <= 1) return;

    const interval = window.setInterval(() => {
      setIndex((current) => (current + 1) % messages.length);
    }, 2_400);

    return () => window.clearInterval(interval);
  }, [messages.length, visible]);

  if (!visible || messages.length === 0) return null;

  return (
    <p
      className={cn(
        "text-center text-sm font-medium text-hub-foreground/55 transition-opacity duration-300",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      {messages[index]}
    </p>
  );
}
