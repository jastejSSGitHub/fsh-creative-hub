import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { ensureHubProfile } from "@/lib/auth/ensure-profile";
import {
  DEV_BYPASS_DISPLAY_NAME,
  DEV_BYPASS_EMAIL,
  getDevBypassPassword,
  isDevAuthBypassEnabled,
} from "@/lib/dev-auth";
import { LOGIN_PATH, PROJECTS_PATH } from "@/lib/routes";
import { createAdminClient } from "@/lib/supabase/admin";

async function ensureDevUser() {
  const admin = createAdminClient();
  const password = getDevBypassPassword();

  const { data: listed, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (listError) {
    throw listError;
  }

  const existing = listed.users.find(
    (user) => user.email?.toLowerCase() === DEV_BYPASS_EMAIL,
  );

  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name: DEV_BYPASS_DISPLAY_NAME },
    });
    if (error) throw error;
    return existing.id;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: DEV_BYPASS_EMAIL,
    password,
    email_confirm: true,
    user_metadata: { full_name: DEV_BYPASS_DISPLAY_NAME },
  });

  if (error || !data.user) {
    throw error ?? new Error("Failed to create dev user");
  }

  return data.user.id;
}

/**
 * Local-only dev sign-in. Creates/updates a dev user and sets a real Supabase session.
 */
export async function GET(request: NextRequest) {
  if (!isDevAuthBypassEnabled()) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  try {
    await ensureDevUser();
  } catch (error) {
    console.error("Dev bypass user setup failed:", error);
    return NextResponse.redirect(
      new URL(`${LOGIN_PATH}?error=dev-bypass-setup`, request.url),
    );
  }

  const { origin } = request.nextUrl;
  let response = NextResponse.redirect(`${origin}${PROJECTS_PATH}`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.redirect(`${origin}${PROJECTS_PATH}`);
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email: DEV_BYPASS_EMAIL,
    password: getDevBypassPassword(),
  });

  if (error || !data.user) {
    console.error("Dev bypass sign-in failed:", error?.message);
    return NextResponse.redirect(
      new URL(`${LOGIN_PATH}?error=dev-bypass-signin`, request.url),
    );
  }

  await ensureHubProfile(data.user);
  return response;
}
