"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { useAuthTransition } from "@/components/auth/auth-transition-provider";
import { buttonVariants } from "@/components/ui/button";
import { NavBackLink } from "@/components/ui/nav-back-link";
import { LANDING_PATH } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const DEV_BYPASS_PATH = "/auth/dev-bypass";
const showDevBypass = process.env.NODE_ENV === "development";

function getAuthCallbackUrl() {
  return `${window.location.origin}/auth/callback`;
}

function formatAuthError(urlError: string | null): string | null {
  if (!urlError) return null;
  if (urlError === "config") {
    return "Supabase is not configured. Add env vars in Vercel.";
  }
  if (urlError === "auth") {
    return "Sign-in failed. Please try again.";
  }
  if (urlError === "dev-bypass-setup" || urlError === "dev-bypass-signin") {
    return "Dev bypass failed. Check DEV_AUTH_BYPASS and SUPABASE_SERVICE_ROLE_KEY.";
  }

  return decodeURIComponent(urlError);
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function GoogleColorBar({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-1 w-full", className)} aria-hidden>
      <span className="flex-1 bg-[#4285F4]" />
      <span className="flex-1 bg-[#EA4335]" />
      <span className="flex-1 bg-[#FBBC05]" />
      <span className="flex-1 bg-[#34A853]" />
    </div>
  );
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const { beginAuthTransition, endAuthTransition } = useAuthTransition();
  const urlError = searchParams.get("error");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const configError = formatAuthError(urlError);

  async function handleGoogle() {
    setMessage(null);
    setIsPending(true);
    beginAuthTransition("sign-in", { persist: true });

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: getAuthCallbackUrl(),
          queryParams: { prompt: "select_account" },
        },
      });

      if (error) {
        setMessage(error.message);
        endAuthTransition();
        setIsPending(false);
      }
    } catch {
      setMessage("Google sign-in failed. Please try again.");
      endAuthTransition();
      setIsPending(false);
    }
  }

  function handleDevBypass() {
    setMessage(null);
    setIsPending(true);
    beginAuthTransition("sign-in");
    window.location.assign(DEV_BYPASS_PATH);
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="space-y-2 text-center">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-hub-foreground/45">
          Sign in
        </p>
        <Link href={LANDING_PATH}>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-hub-foreground transition-opacity hover:opacity-80 sm:text-4xl">
            FSH Creative Hub
          </h1>
        </Link>
      </div>

      {(configError || message) && (
        <p className="rounded-sm border border-hub-rejected/30 bg-hub-rejected/10 px-4 py-3 text-sm text-hub-rejected">
          {configError ?? message}
        </p>
      )}

      <div className="space-y-1">
        <button
          type="button"
          onClick={handleGoogle}
          disabled={isPending}
          className={cn(
            "group relative w-full overflow-hidden rounded-xl border border-hub-foreground/12 bg-hub-surface text-left shadow-sm transition-shadow hover:shadow-md disabled:opacity-60",
          )}
        >
          <div className="flex min-h-11 items-center justify-center gap-3 px-4 py-3">
            <GoogleIcon className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium text-hub-foreground">
              {isPending ? "Redirecting…" : "Continue with Google"}
            </span>
          </div>
          <GoogleColorBar className="transition-opacity group-hover:opacity-100" />
        </button>
      </div>

      {showDevBypass && (
        <div className="space-y-2 rounded-sm border border-dashed border-hub-final/40 bg-hub-final/5 px-4 py-4">
          <p className="text-center font-mono text-[0.6rem] uppercase tracking-[0.14em] text-hub-foreground/50">
            Local development
          </p>
          <button
            type="button"
            onClick={handleDevBypass}
            disabled={isPending}
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "min-h-11 w-full rounded-xl border-hub-final/50 bg-hub-surface text-hub-foreground hover:bg-hub-final/10 disabled:opacity-60",
            )}
          >
            Skip login (dev)
          </button>
        </div>
      )}

      <div className="flex justify-center">
        <NavBackLink href={LANDING_PATH} label="Home" />
      </div>
    </div>
  );
}
