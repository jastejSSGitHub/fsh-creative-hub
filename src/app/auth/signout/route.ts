import { NextResponse } from "next/server";

import { LANDING_PATH } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}${LANDING_PATH}`, { status: 302 });
}
