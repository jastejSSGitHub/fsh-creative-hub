import { type NextRequest, NextResponse } from "next/server";

/**
 * Phase 0: pass-through. Phase 1 will protect routes and refresh auth sessions.
 */
export async function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
