import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getPublicSupabaseEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { PROJECTS_PATH } from "@/lib/routes";

function isE2EEnabled() {
  if (process.env.VERCEL_ENV === "production") {
    return false;
  }

  return Boolean(process.env.E2E_TEST_SECRET && process.env.E2E_TEST_SECRET.length > 0);
}

/**
 * Dev-only Playwright sign-in. Sets a real Supabase session cookie for the given user.
 */
export async function POST(request: Request) {
  if (!isE2EEnabled()) {
    return NextResponse.json({ error: "E2E sign-in disabled" }, { status: 403 });
  }

  if (request.headers.get("x-e2e-secret") !== process.env.E2E_TEST_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? process.env.E2E_TEST_PASSWORD ?? "e2e-test-password-local";

  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const user = listed?.users.find((u) => u.email?.toLowerCase() === email);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await admin.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
    });

    const cookieStore = await cookies();
    const { url, anonKey } = getPublicSupabaseEnv();
    let response = NextResponse.json({ ok: true, redirect: PROJECTS_PATH, userId: user.id });

    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          response = NextResponse.json({ ok: true, redirect: PROJECTS_PATH, userId: user.id });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sign-in failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
