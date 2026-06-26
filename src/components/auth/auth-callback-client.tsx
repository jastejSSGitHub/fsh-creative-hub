"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useAuthTransition } from "@/components/auth/auth-transition-provider";
import { ensureHubProfileClient } from "@/lib/auth/ensure-profile-client";
import { LOGIN_PATH, PROJECTS_PATH } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";

export function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { beginAuthTransition, endAuthTransition } = useAuthTransition();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    beginAuthTransition("complete-sign-in");

    const code = searchParams.get("code");
    const next = searchParams.get("next")?.startsWith("/")
      ? searchParams.get("next")!
      : PROJECTS_PATH;

    if (!code) {
      endAuthTransition();
      router.replace(`${LOGIN_PATH}?error=auth`);
      return;
    }

    async function completeSignIn(authCode: string) {
      try {
        const supabase = createClient();
        const { data, error } =
          await supabase.auth.exchangeCodeForSession(authCode);

        if (error || !data.user) {
          endAuthTransition();
          router.replace(
            `${LOGIN_PATH}?error=${encodeURIComponent(error?.message ?? "auth")}`,
          );
          return;
        }

        await ensureHubProfileClient(data.user);
        router.replace(next);
        router.refresh();
      } catch {
        endAuthTransition();
        router.replace(`${LOGIN_PATH}?error=auth`);
      }
    }

    void completeSignIn(code);
  }, [beginAuthTransition, endAuthTransition, router, searchParams]);

  return null;
}
