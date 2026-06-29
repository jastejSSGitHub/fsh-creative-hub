"use client";

import { usePathname } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";

import { isMarketingLightPath } from "@/lib/routes";

const THEME_STORAGE_KEY = "hub.theme";

// Theme init runs via HubThemeBootstrapScript (useServerInsertedHTML). Keep
// next-themes' inline script inert so React 19 does not warn during hydration.
const NEXT_THEMES_SCRIPT_PROPS = { type: "application/json" } as const;

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
      scriptProps={NEXT_THEMES_SCRIPT_PROPS}
    >
      {children}
    </NextThemesProvider>
  );
}
