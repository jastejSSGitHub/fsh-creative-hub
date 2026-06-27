"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { PROJECTS_PATH } from "@/lib/routes";

/** Catches OAuth codes that land on `/` instead of `/auth/callback` (Supabase Site URL fallback). */
export function OAuthCodeRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;

    const code = searchParams.get("code");
    if (!code) return;

    startedRef.current = true;

    const next = searchParams.get("next")?.startsWith("/")
      ? searchParams.get("next")!
      : PROJECTS_PATH;

    const params = new URLSearchParams({ code, next });
    router.replace(`/auth/callback?${params.toString()}`);
  }, [router, searchParams]);

  return null;
}
