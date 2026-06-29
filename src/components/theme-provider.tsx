"use client";

import { usePathname } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";

import { isMarketingLightPath } from "@/lib/routes";

const THEME_STORAGE_KEY = "hub.theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const forceLight = isMarketingLightPath(pathname);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      forcedTheme={forceLight ? "light" : undefined}
      storageKey={THEME_STORAGE_KEY}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
