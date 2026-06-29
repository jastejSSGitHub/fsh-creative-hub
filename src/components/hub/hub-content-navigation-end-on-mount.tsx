"use client";

import { useEffect } from "react";

import { dispatchHubContentNavigationEnd } from "@/lib/hub/hub-content-navigation-events";

/** Call when a hub content destination has mounted and is ready to show. */
export function HubContentNavigationEndOnMount() {
  useEffect(() => {
    dispatchHubContentNavigationEnd();
  }, []);

  return null;
}
