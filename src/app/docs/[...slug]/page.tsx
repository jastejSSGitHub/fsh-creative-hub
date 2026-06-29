import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DocsArticle } from "@/components/docs/docs-article";
import { getDocNavItem } from "@/lib/docs/navigation";
import { DOC_SLUGS, getDocPage } from "@/lib/docs/registry";

type DocSlugPageProps = {
  params: Promise<{ slug: string[] }>;
};

export async function generateMetadata({
  params,
}: DocSlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  const slugPath = slug.join("/");
  const page = getDocPage(slugPath);
  if (!page) return { title: "Not Found · FSH Docs" };

  return {
    title: `${page.title} · FSH Creative Hub Docs`,
    description: page.description,
  };
}

export function generateStaticParams() {
  return DOC_SLUGS.map((slug) => ({
    slug: slug.split("/"),
  }));
}

export default async function DocSlugPage({ params }: DocSlugPageProps) {
  const { slug } = await params;
  const slugPath = slug.join("/");
  const page = getDocPage(slugPath);

  if (!page) notFound();

  const navItem = getDocNavItem(slugPath);
  const Content = page.Content;

  return (
    <DocsArticle
      title={navItem?.title ?? page.title}
      description={page.description}
      slug={slugPath}
      toc={page.toc}
    >
      <Content />
    </DocsArticle>
  );
}
