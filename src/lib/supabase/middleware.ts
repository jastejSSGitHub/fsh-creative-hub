import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import {
  LANDING_PATH,
  LOGIN_PATH,
  PROJECTS_PATH,
  isDocsPath,
  isSharePath,
} from "@/lib/routes";

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const authCode = request.nextUrl.searchParams.get("code");
  if (authCode && !pathname.startsWith("/auth/callback")) {
    const callbackUrl = request.nextUrl.clone();
    callbackUrl.pathname = "/auth/callback";
    callbackUrl.searchParams.set("code", authCode);
    if (!callbackUrl.searchParams.has("next")) {
      callbackUrl.searchParams.set("next", PROJECTS_PATH);
    }
    return NextResponse.redirect(callbackUrl);
  }

  // Docs are fully public — skip Supabase session refresh to avoid hangs.
  if (isDocsPath(pathname)) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublic =
    pathname === LANDING_PATH ||
    pathname === "/landing" ||
    pathname.startsWith(LOGIN_PATH) ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/e2e/") ||
    isSharePath(pathname);

  if (!user && !isPublic) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = LOGIN_PATH;
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && pathname === LOGIN_PATH) {
    const projectsUrl = request.nextUrl.clone();
    projectsUrl.pathname = PROJECTS_PATH;
    projectsUrl.search = "";
    return NextResponse.redirect(projectsUrl);
  }

  return supabaseResponse;
}
