import { NextResponse } from "next/server";

import { searchHub } from "@/lib/search/queries";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  if (q.trim().length < 1) {
    return NextResponse.json({ results: [] });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await searchHub(supabase, user.id, q);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
