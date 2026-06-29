import { NextResponse } from "next/server";

import { createShareLinkAction, revokeShareLinkAction } from "@/lib/share/actions";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const result = await createShareLinkAction({
    projectId: body.projectId,
    scopeType: body.scopeType,
    scopeId: body.scopeId,
    config: body.config,
    expiresAt: body.expiresAt ?? null,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ token: result.token, id: result.id });
}
