"use client";

import { useServerInsertedHTML } from "next/navigation";

const THEME_STORAGE_KEY = "hub.theme";

const HUB_THEME_BOOTSTRAP_SCRIPT = `(function(){try{var p=location.pathname;var marketing=p==="/"||p==="/landing"||p==="/docs"||p.indexOf("/docs/")===0;var r=document.documentElement;var themes=["light","dark"];if(marketing){r.classList.remove.apply(r.classList,themes);r.classList.add("light");r.style.colorScheme="light";return;}var theme=localStorage.getItem("${THEME_STORAGE_KEY}")||"light";r.classList.remove.apply(r.classList,themes);r.classList.add(theme);if(themes.indexOf(theme)>=0){r.style.colorScheme=theme;}}catch(e){}})();`;

export function HubThemeBootstrapScript() {
  useServerInsertedHTML(() => (
    <script
      id="hub-theme-bootstrap"
      dangerouslySetInnerHTML={{ __html: HUB_THEME_BOOTSTRAP_SCRIPT }}
    />
  ));

  return null;
}
