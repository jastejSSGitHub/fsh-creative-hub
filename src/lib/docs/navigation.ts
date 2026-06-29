export type DocNavItem = {
  title: string;
  slug: string;
  children?: DocNavItem[];
};

export const DOCS_NAV: DocNavItem[] = [
  {
    title: "Getting Started",
    slug: "getting-started",
    children: [
      { title: "Quick Start", slug: "getting-started/quick-start" },
      { title: "Environment Variables", slug: "getting-started/environment" },
      { title: "Local Auth", slug: "getting-started/local-auth" },
      { title: "Project Structure", slug: "getting-started/project-structure" },
    ],
  },
  {
    title: "Architecture",
    slug: "architecture",
    children: [
      { title: "Overview", slug: "architecture/overview" },
      { title: "Route Map", slug: "architecture/routes" },
      { title: "Auth Flow", slug: "architecture/auth-flow" },
      { title: "Server Actions", slug: "architecture/server-actions" },
      { title: "Design System", slug: "architecture/design-system" },
      { title: "Realtime & Presence", slug: "architecture/realtime" },
    ],
  },
  {
    title: "Supabase",
    slug: "supabase",
    children: [
      { title: "Setup & Connection", slug: "supabase/setup" },
      { title: "Migrations", slug: "supabase/migrations" },
      { title: "Table Glossary", slug: "supabase/tables" },
      { title: "Storage", slug: "supabase/storage" },
      { title: "Auth Configuration", slug: "supabase/auth" },
    ],
  },
  {
    title: "Features",
    slug: "features",
    children: [
      { title: "Projects", slug: "features/projects" },
      { title: "Review Boards", slug: "features/review-boards" },
      { title: "Canvas", slug: "features/canvas" },
      { title: "Text Documents", slug: "features/documents" },
      { title: "For You", slug: "features/for-you" },
      { title: "Tasks", slug: "features/tasks" },
      { title: "Share Links", slug: "features/share-links" },
      { title: "Global Search", slug: "features/search" },
    ],
  },
  {
    title: "Operations",
    slug: "operations",
    children: [
      { title: "Deployment", slug: "operations/deployment" },
      { title: "Scripts & Seeding", slug: "operations/scripts" },
      { title: "Testing", slug: "operations/testing" },
      { title: "Troubleshooting", slug: "operations/troubleshooting" },
    ],
  },
  {
    title: "Contributing",
    slug: "contributing",
    children: [
      { title: "Workflow", slug: "contributing/workflow" },
      { title: "Cursor MCP (Optional)", slug: "contributing/cursor-mcp" },
    ],
  },
];

export function flattenDocNav(items: DocNavItem[] = DOCS_NAV): DocNavItem[] {
  const flat: DocNavItem[] = [];
  for (const item of items) {
    if (item.children?.length) {
      flat.push(...item.children);
    } else {
      flat.push(item);
    }
  }
  return flat;
}

export function getDocNavItem(slug: string): DocNavItem | undefined {
  return flattenDocNav().find((item) => item.slug === slug);
}

export function getAdjacentDocs(slug: string): {
  prev?: DocNavItem;
  next?: DocNavItem;
} {
  const flat = flattenDocNav();
  const index = flat.findIndex((item) => item.slug === slug);
  if (index === -1) return {};
  return {
    prev: index > 0 ? flat[index - 1] : undefined,
    next: index < flat.length - 1 ? flat[index + 1] : undefined,
  };
}

export type DocBreadcrumb = {
  title: string;
  href?: string;
};

export function getDocBreadcrumbs(slug: string): DocBreadcrumb[] {
  const current = getDocNavItem(slug);
  if (!current) return [];

  const crumbs: DocBreadcrumb[] = [{ title: "Docs", href: "/docs" }];

  for (const section of DOCS_NAV) {
    const child = section.children?.find((item) => item.slug === slug);
    if (!child) continue;

    const sectionHref = section.children?.[0]?.slug
      ? `/docs/${section.children[0].slug}`
      : undefined;

    crumbs.push({ title: section.title, href: sectionHref });
    crumbs.push({ title: current.title });
    return crumbs;
  }

  crumbs.push({ title: current.title });
  return crumbs;
}
