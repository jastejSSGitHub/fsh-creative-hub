"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { useAuthTransition } from "@/components/auth/auth-transition-provider";
import { buttonVariants } from "@/components/ui/button";
import { NavBackLink } from "@/components/ui/nav-back-link";
import { LANDING_PATH, PROJECTS_PATH } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const DEV_BYPASS_PATH = "/auth/dev-bypass";
const showDevBypass = process.env.NODE_ENV === "development";

const inputClassName =
  "min-h-11 w-full rounded-sm border border-hub-espresso/15 bg-white px-4 text-hub-espresso outline-none ring-hub-accent/40 placeholder:text-hub-espresso/35 focus:ring-2 disabled:opacity-60";

function getAuthCallbackUrl() {
  return `${window.location.origin}/auth/callback`;
}

function formatAuthError(urlError: string | null): string | null {
  if (!urlError) return null;
  if (urlError === "config") {
    return "Supabase is not configured. Add env vars in Vercel.";
  }
  if (urlError === "auth") {
    return "Sign-in failed. Try again or use a different method.";
  }
  if (urlError === "dev-bypass-setup" || urlError === "dev-bypass-signin") {
    return "Dev bypass failed. Check DEV_AUTH_BYPASS and SUPABASE_SERVICE_ROLE_KEY.";
  }

  const decoded = decodeURIComponent(urlError);
  if (decoded.toLowerCase().includes("pkce")) {
    return "Open the magic link in the same browser where you requested it.";
  }

  return decoded;
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { beginAuthTransition, endAuthTransition } = useAuthTransition();
  const urlError = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const [emailAuthTab, setEmailAuthTab] = useState<"signin" | "register">(
    "signin",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [signInMode, setSignInMode] = useState<
    "google" | "password" | "register" | "magic" | null
  >(null);

  const configError = formatAuthError(urlError);

  async function handlePasswordSignIn(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    setIsSuccess(false);
    setIsPending(true);
    setSignInMode("password");
    beginAuthTransition("sign-in");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        setMessage(
          error.message.includes("Invalid login credentials")
            ? "Wrong email or password. Try Google, create an account, or use a magic link."
            : error.message,
        );
        endAuthTransition();
        return;
      }

      router.push(PROJECTS_PATH);
      router.refresh();
    } catch {
      setMessage("Sign-in failed. Please try again.");
      endAuthTransition();
    } finally {
      setIsPending(false);
      setSignInMode(null);
    }
  }

  async function handleRegister(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    setIsSuccess(false);
    setIsPending(true);
    setSignInMode("register");
    beginAuthTransition("create-account");

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: getAuthCallbackUrl(),
        },
      });

      if (error) {
        setMessage(error.message);
        endAuthTransition();
        return;
      }

      if (data.session) {
        router.push(PROJECTS_PATH);
        router.refresh();
        return;
      }

      endAuthTransition();
      setIsSuccess(true);
      setMessage(
        `Account created. Check ${email.trim().toLowerCase()} to confirm, or sign in if confirmation is off.`,
      );
    } catch {
      setMessage("Could not create account. Please try again.");
      endAuthTransition();
    } finally {
      setIsPending(false);
      setSignInMode(null);
    }
  }

  async function handleMagicLink(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    setIsSuccess(false);
    setIsPending(true);
    setSignInMode("magic");
    beginAuthTransition("send-magic-link");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: getAuthCallbackUrl(),
          shouldCreateUser: true,
        },
      });

      if (error) {
        setMessage(error.message);
        endAuthTransition();
        return;
      }

      endAuthTransition();
      setIsSuccess(true);
      setMessage(
        `Link sent to ${email.trim().toLowerCase()}. Open it in this browser.`,
      );
    } catch {
      setMessage("Could not send link. Try Google or email + password instead.");
      endAuthTransition();
    } finally {
      setIsPending(false);
      setSignInMode(null);
    }
  }

  async function handleGoogle() {
    setMessage(null);
    setIsSuccess(false);
    setIsPending(true);
    setSignInMode("google");
    beginAuthTransition("sign-in");

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
        setSignInMode(null);
      }
    } catch {
      setMessage("Google sign-in failed. Please try again.");
      endAuthTransition();
      setIsPending(false);
      setSignInMode(null);
    }
  }

  function handleDevBypass() {
    setMessage(null);
    setIsSuccess(false);
    setIsPending(true);
    beginAuthTransition("sign-in");
    window.location.assign(DEV_BYPASS_PATH);
  }

  return (
    <div className="w-full max-w-md space-y-8">
        <div className="space-y-2 text-center">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-hub-espresso/45">
            Sign in
          </p>
          <Link href={LANDING_PATH}>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-hub-espresso transition-opacity hover:opacity-80 sm:text-4xl">
              FSH Creative Hub
            </h1>
          </Link>
        </div>

        {(configError || (message && !isSuccess)) && (
          <p className="rounded-sm border border-hub-rejected/30 bg-hub-rejected/10 px-4 py-3 text-sm text-hub-rejected">
            {configError ?? message}
          </p>
        )}

        {isSuccess && message && (
          <p className="rounded-sm border border-hub-approved/30 bg-hub-approved/10 px-4 py-3 text-sm text-hub-espresso">
            {message}
          </p>
        )}

        <div className="space-y-1">
          <button
            type="button"
            onClick={handleGoogle}
            disabled={isPending}
            className={cn(
              "group relative w-full overflow-hidden rounded-xl border border-hub-espresso/12 bg-white text-left shadow-sm transition-shadow hover:shadow-md disabled:opacity-60",
            )}
          >
            <div className="flex min-h-11 items-center justify-center gap-3 px-4 py-3">
              <GoogleIcon className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium text-hub-espresso">
                Continue with Google
              </span>
            </div>
            <GoogleColorBar className="transition-opacity group-hover:opacity-100" />
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-hub-espresso/10" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-hub-paper px-3 font-mono text-[0.6rem] uppercase tracking-wider text-hub-espresso/40">
              or email
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-hub-espresso/50"
            >
              Work email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@fshdesign.org"
              disabled={isPending}
              className={inputClassName}
            />
          </div>

          {!showPasswordLogin ? (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <button
                type="submit"
                disabled={isPending || !email.trim()}
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "min-h-11 w-full rounded-xl border-hub-espresso/15 bg-white disabled:opacity-60",
                )}
              >
                {isPending && signInMode === "magic"
                  ? "Sending link…"
                  : "Email me a sign-in link"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowPasswordLogin(true);
                  setMessage(null);
                  setIsSuccess(false);
                }}
                className="w-full text-center text-sm text-hub-espresso/55 underline-offset-4 transition-colors hover:text-hub-espresso/75 hover:underline"
              >
                Prefer email and password instead?
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex rounded-sm border border-hub-espresso/12 bg-hub-espresso/[0.03] p-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setEmailAuthTab("signin");
                    setMessage(null);
                    setIsSuccess(false);
                  }}
                  className={cn(
                    "flex-1 rounded-sm py-2 font-mono text-[0.65rem] uppercase tracking-[0.12em] transition-colors",
                    emailAuthTab === "signin"
                      ? "bg-white text-hub-espresso shadow-sm"
                      : "text-hub-espresso/45 hover:text-hub-espresso/65",
                  )}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmailAuthTab("register");
                    setMessage(null);
                    setIsSuccess(false);
                  }}
                  className={cn(
                    "flex-1 rounded-sm py-2 font-mono text-[0.65rem] uppercase tracking-[0.12em] transition-colors",
                    emailAuthTab === "register"
                      ? "bg-white text-hub-espresso shadow-sm"
                      : "text-hub-espresso/45 hover:text-hub-espresso/65",
                  )}
                >
                  Create account
                </button>
              </div>

              <form
                onSubmit={
                  emailAuthTab === "signin"
                    ? handlePasswordSignIn
                    : handleRegister
                }
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-hub-espresso/50"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    autoComplete={
                      emailAuthTab === "register"
                        ? "new-password"
                        : "current-password"
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={
                      emailAuthTab === "register"
                        ? "Choose a password"
                        : "Your password"
                    }
                    disabled={isPending}
                    minLength={emailAuthTab === "register" ? 8 : undefined}
                    className={inputClassName}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "min-h-11 w-full rounded-xl border-hub-espresso/15 bg-white disabled:opacity-60",
                  )}
                >
                  {isPending
                    ? emailAuthTab === "register"
                      ? "Creating account…"
                      : "Signing in…"
                    : emailAuthTab === "register"
                      ? "Create account"
                      : "Sign in"}
                </button>
              </form>

              <button
                type="button"
                onClick={() => {
                  setShowPasswordLogin(false);
                  setPassword("");
                  setMessage(null);
                  setIsSuccess(false);
                }}
                className="w-full text-center text-sm text-hub-espresso/55 underline-offset-4 transition-colors hover:text-hub-espresso/75 hover:underline"
              >
                Use a magic link instead
              </button>
            </div>
          )}
        </div>

        {showDevBypass && (
          <div className="space-y-2 rounded-sm border border-dashed border-hub-final/40 bg-hub-final/5 px-4 py-4">
            <p className="text-center font-mono text-[0.6rem] uppercase tracking-[0.14em] text-hub-espresso/50">
              Local development
            </p>
            <button
              type="button"
              onClick={handleDevBypass}
              disabled={isPending}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "min-h-11 w-full rounded-xl border-hub-final/50 bg-white text-hub-espresso hover:bg-hub-final/10 disabled:opacity-60",
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
