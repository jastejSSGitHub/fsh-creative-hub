"use server";

import { toIntelligenceErrorMessage } from "@/lib/intelligence/errors";
import {
  buildProjectBrief,
  resolveProjectIdFromPrompt,
} from "@/lib/intelligence/build-brief";
import {
  isIntelligenceIntent,
  resolveIntelligenceTemplate,
  stripIntelligencePrefix,
} from "@/lib/intelligence/intent-router";
import { buildIntelligenceView } from "@/lib/intelligence/query-brief";
import type {
  IntelligenceAskResult,
  IntelligenceTemplateId,
} from "@/lib/intelligence/types";
import { getProjectMembership } from "@/lib/projects/queries";
import { createClient } from "@/lib/supabase/server";

export type AskProjectIntelligenceInput = {
  prompt: string;
  projectId?: string | null;
  templateId?: IntelligenceTemplateId | null;
};

export async function askProjectIntelligenceAction(
  input: AskProjectIntelligenceInput,
): Promise<IntelligenceAskResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "You must be signed in." };
    }

    const rawPrompt = input.prompt.trim();
    if (!rawPrompt && !input.templateId) {
      return { ok: false, error: "Ask a question or pick a template prompt." };
    }

    const prompt = stripIntelligencePrefix(rawPrompt);
    const projectId = await resolveProjectIdFromPrompt(
      supabase,
      user.id,
      prompt,
      input.projectId,
    );

    if (!projectId) {
      return {
        ok: false,
        error:
          "Pick a project first (open a project page) or include the project name in your question.",
      };
    }

    const role = await getProjectMembership(supabase, projectId, user.id);
    if (!role) {
      return { ok: false, error: "You do not have access to this project." };
    }

    const templateId = resolveIntelligenceTemplate(prompt, input.templateId);
    const { brief, fromCache, progress } = await buildProjectBrief(
      supabase,
      projectId,
    );

    const view = buildIntelligenceView(brief, templateId);

    return {
      ok: true,
      brief,
      view,
      fromCache,
      isProjectAdmin: role === "admin",
      progress,
    };
  } catch (error) {
    return {
      ok: false,
      error: toIntelligenceErrorMessage(error),
    };
  }
}

export async function refreshProjectBriefAction(
  projectId: string,
): Promise<IntelligenceAskResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "You must be signed in." };
    }

    const role = await getProjectMembership(supabase, projectId, user.id);
    if (role !== "admin") {
      return { ok: false, error: "Only project admins can rebuild the brief." };
    }

    const { brief, fromCache, progress } = await buildProjectBrief(
      supabase,
      projectId,
      { force: true },
    );

    return {
      ok: true,
      brief,
      view: buildIntelligenceView(brief, "full"),
      fromCache,
      isProjectAdmin: true,
      progress,
    };
  } catch (error) {
    return {
      ok: false,
      error: toIntelligenceErrorMessage(error),
    };
  }
}

export { isIntelligenceIntent };
