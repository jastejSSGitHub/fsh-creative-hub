"use client";

import type { SharePublicAsset, SharePublicComment } from "@/lib/share/types";
import { PresentationMode } from "@/components/workspace/presentation-mode";
import { EMPTY_CONSENSUS } from "@/lib/assets/consensus";

type PublicPresentationViewerProps = {
  assets: SharePublicAsset[];
  projectName?: string;
  initiativeName?: string;
  sharedBy?: string | null;
};

import type { AssetWithVotes } from "@/lib/workspace/queries";

function toPresentationAssets(assets: SharePublicAsset[]): AssetWithVotes[] {
  return assets.map((asset) => ({
    id: asset.id,
    initiative_id: "",
    name: asset.name,
    type: asset.type,
    storage_path: "",
    public_url: asset.public_url,
    tag: asset.tag,
    status: asset.status,
    sort_order: asset.sort_order,
    uploaded_by: "",
    variant_of: null,
    is_fix_candidate: false,
    legacy_approved_by: null,
    created_at: "",
    votes: [],
    consensus: EMPTY_CONSENSUS,
  }));
}

export function PublicPresentationViewer({
  assets,
  projectName,
  initiativeName,
  sharedBy,
}: PublicPresentationViewerProps) {
  if (!assets.length) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-hub-paper px-6 text-center">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-hub-foreground/45">
          Client share
        </p>
        <h1 className="mt-2 font-display text-xl font-bold text-hub-foreground">
          Nothing to show yet
        </h1>
        <p className="mt-2 max-w-sm text-[0.875rem] text-hub-foreground/60">
          This link is valid, but the shared work may have been removed.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <PresentationMode
        assets={toPresentationAssets(assets)}
        projectName={projectName}
        initiativeName={initiativeName}
        onClose={() => {}}
        publicView
      />
      {sharedBy && (
        <div className="pointer-events-none fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-0 right-0 z-[70] flex justify-center px-4">
          <p className="rounded-full border border-white/15 bg-black/50 px-3 py-1 font-mono text-[0.58rem] uppercase tracking-[0.12em] text-white/55 backdrop-blur-sm">
            Shared by {sharedBy}
          </p>
        </div>
      )}
    </div>
  );
}

type PublicAssetViewerProps = {
  asset: SharePublicAsset;
  projectName?: string;
  sharedBy?: string | null;
  comments?: SharePublicComment[];
};

export function PublicAssetViewer({
  asset,
  projectName,
  sharedBy,
  comments = [],
}: PublicAssetViewerProps) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-hub-espresso">
      <header className="shrink-0 border-b border-white/10 bg-black/40 px-4 py-3 backdrop-blur-md">
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-white/45">
          {projectName ? `${projectName} · ` : ""}Client share
        </p>
        <h1 className="truncate font-display text-lg font-bold text-white">{asset.name}</h1>
        {sharedBy && (
          <p className="mt-0.5 text-[0.75rem] text-white/50">Shared by {sharedBy}</p>
        )}
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="flex flex-1 items-center justify-center p-4">
          {asset.type === "video" ? (
            <video
              src={asset.public_url}
              controls
              playsInline
              className="max-h-[calc(100dvh-8rem)] max-w-full rounded-md"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={asset.public_url}
              alt={asset.name}
              className="max-h-[calc(100dvh-8rem)] max-w-full rounded-md object-contain"
            />
          )}
        </div>

        {comments.length > 0 && (
          <aside className="max-h-[40vh] overflow-y-auto border-t border-white/10 bg-hub-paper lg:max-h-none lg:w-80 lg:border-l lg:border-t-0">
            <div className="px-4 py-3">
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-hub-foreground/45">
                Feedback
              </p>
              <ul className="mt-3 space-y-3">
                {comments.map((comment) => (
                  <li key={comment.id} className="rounded-[6px] border border-hub-foreground/8 p-2.5">
                    <p className="text-[0.6875rem] font-medium text-hub-foreground/55">
                      {comment.author_name}
                    </p>
                    <p className="mt-1 text-[0.8125rem] leading-relaxed text-hub-foreground">
                      {comment.body}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
