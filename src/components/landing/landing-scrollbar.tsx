"use client";

import { useEffect } from "react";

export function LandingScrollbar() {
  useEffect(() => {
    document.documentElement.classList.add("landing-scroll");
    return () => {
      document.documentElement.classList.remove("landing-scroll");
    };
  }, []);

  return null;
}
