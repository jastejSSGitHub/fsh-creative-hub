import { Suspense } from "react";

import { ForYouPageContent } from "@/components/inbox/for-you-page-content";
import { ForYouPageFallback } from "@/components/inbox/for-you-page-fallback";
import type { ForYouLens } from "@/lib/routes";

type ForYouPageProps = {
  searchParams: Promise<{ lens?: string }>;
};

function parseLens(raw: string | undefined): ForYouLens {
  if (
    raw === "replies" ||
    raw === "assigned" ||
    raw === "waiting-on-others" ||
    raw === "following" ||
    raw === "your-uploads"
  ) {
    return raw;
  }
  return "needs-you";
}

export default async function ForYouPage({ searchParams }: ForYouPageProps) {
  const params = await searchParams;
  const lens = parseLens(params.lens);

  return (
    <Suspense fallback={<ForYouPageFallback lens={lens} />}>
      <ForYouPageContent lens={lens} />
    </Suspense>
  );
}
