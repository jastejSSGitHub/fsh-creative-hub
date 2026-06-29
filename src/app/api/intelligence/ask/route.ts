import { NextResponse } from "next/server";

import {
  askProjectIntelligenceAction,
  refreshProjectBriefAction,
} from "@/lib/intelligence/actions";
import type { IntelligenceTemplateId } from "@/lib/intelligence/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      prompt?: string;
      projectId?: string | null;
      templateId?: IntelligenceTemplateId | null;
    };

    const result = await askProjectIntelligenceAction({
      prompt: body.prompt ?? "",
      projectId: body.projectId ?? null,
      templateId: body.templateId ?? null,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Intelligence request failed." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { projectId?: string };
    if (!body.projectId) {
      return NextResponse.json({ error: "projectId is required." }, { status: 400 });
    }

    const result = await refreshProjectBriefAction(body.projectId);
    if (!result.ok) {
      const status = result.error.includes("admin") ? 403 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Rebuild failed." }, { status: 500 });
  }
}
