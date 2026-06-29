import type { Metadata } from "next";

import {
  PublicAssetViewer,
  PublicPresentationViewer,
} from "@/components/workspace/public-share-viewer";
import { recordShareViewAction } from "@/lib/share/actions";
import { resolveShareToken } from "@/lib/share/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Shared work · FSH Creative Hub",
  robots: { index: false, follow: false },
};

type SharePageProps = {
  params: Promise<{ token: string }>;
};

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;
  const supabase = await createClient();
  const payload = await resolveShareToken(supabase, token);

  if (!payload.ok) {
    return <ShareExpiredState />;
  }

  await recordShareViewAction(token);

  const { scope_type, assets, comments, project_name, initiative_name, shared_by } = payload;

  if (scope_type === "asset" && assets[0]) {
    return (
      <PublicAssetViewer
        asset={assets[0]}
        projectName={project_name}
        sharedBy={shared_by}
        comments={comments}
      />
    );
  }

  return (
    <PublicPresentationViewer
      assets={assets}
      projectName={project_name}
      initiativeName={initiative_name ?? undefined}
      sharedBy={shared_by}
    />
  );
}

function ShareExpiredState() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-hub-paper px-6 text-center">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-hub-foreground/45">
        Client share
      </p>
      <h1 className="mt-2 font-display text-2xl font-bold text-hub-foreground">
        This link has expired
      </h1>
      <p className="mt-2 max-w-sm text-[0.875rem] leading-relaxed text-hub-foreground/60">
        The share link may have been revoked or timed out. Ask your FSH contact for a fresh link.
      </p>
    </div>
  );
}
