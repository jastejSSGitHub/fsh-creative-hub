import { NextResponse } from "next/server";

import {
  getIntelligenceProjectOptions,
  type IntelligenceProjectOption,
} from "@/lib/intelligence/project-options";
import { createClient } from "@/lib/supabase/server";

export type { IntelligenceProjectOption };

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const projects = await getIntelligenceProjectOptions(supabase, user.id);

    return NextResponse.json(
      { projects },
      {
        headers: {
          "Cache-Control": "private, max-age=60",
        },
      },
    );
  } catch {
    return NextResponse.json({ error: "Could not load projects." }, { status: 500 });
  }
}
