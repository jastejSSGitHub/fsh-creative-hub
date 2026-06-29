import type { ComponentType } from "react";

import {
  ArchitectureOverviewContent,
  architectureOverviewToc,
  AuthFlowContent,
  authFlowToc,
  DesignSystemContent,
  designSystemToc,
  RealtimeContent,
  realtimeToc,
  RoutesContent,
  routesToc,
  ServerActionsContent,
  serverActionsToc,
} from "@/lib/docs/content/architecture";
import {
  CanvasFeatureContent,
  canvasFeatureToc,
  DocumentsFeatureContent,
  documentsFeatureToc,
  ForYouFeatureContent,
  forYouFeatureToc,
  ProjectsFeatureContent,
  projectsFeatureToc,
  ReviewBoardsContent,
  reviewBoardsToc,
  SearchFeatureContent,
  searchFeatureToc,
  ShareLinksContent,
  shareLinksToc,
  TasksFeatureContent,
  tasksFeatureToc,
} from "@/lib/docs/content/features";
import {
  EnvironmentContent,
  environmentToc,
  LocalAuthContent,
  localAuthToc,
  ProjectStructureContent,
  projectStructureToc,
  QuickStartContent,
  quickStartToc,
} from "@/lib/docs/content/getting-started";
import {
  CursorMcpContent,
  cursorMcpToc,
  DeploymentContent,
  deploymentToc,
  ScriptsContent,
  scriptsToc,
  TestingContent,
  testingToc,
  TroubleshootingContent,
  troubleshootingToc,
  WorkflowContent,
  workflowToc,
} from "@/lib/docs/content/operations";
import {
  MigrationsContent,
  migrationsToc,
  StorageContent,
  storageToc,
  SupabaseAuthContent,
  supabaseAuthToc,
  SupabaseSetupContent,
  supabaseSetupToc,
  TablesContent,
  tablesToc,
} from "@/lib/docs/content/supabase";

export type DocTocItem = { id: string; title: string };

export type DocPageEntry = {
  title: string;
  description: string;
  toc: DocTocItem[];
  Content: ComponentType;
};

export const DOC_REGISTRY: Record<string, DocPageEntry> = {
  "getting-started/quick-start": {
    title: "Quick Start",
    description: "Clone, configure, and run FSH Creative Hub locally in minutes.",
    toc: quickStartToc,
    Content: QuickStartContent,
  },
  "getting-started/environment": {
    title: "Environment Variables",
    description: "Every env var explained — public keys, secrets, and Vercel production values.",
    toc: environmentToc,
    Content: EnvironmentContent,
  },
  "getting-started/local-auth": {
    title: "Local Auth",
    description: "Dev bypass, Google OAuth, and middleware route guards.",
    toc: localAuthToc,
    Content: LocalAuthContent,
  },
  "getting-started/project-structure": {
    title: "Project Structure",
    description: "How the Next.js app is organized — routes, lib modules, and components.",
    toc: projectStructureToc,
    Content: ProjectStructureContent,
  },
  "architecture/overview": {
    title: "Architecture Overview",
    description: "Tech stack, patterns, and data flow for the full-stack hub.",
    toc: architectureOverviewToc,
    Content: ArchitectureOverviewContent,
  },
  "architecture/routes": {
    title: "Route Map",
    description: "Every public and authenticated route with path helpers.",
    toc: routesToc,
    Content: RoutesContent,
  },
  "architecture/auth-flow": {
    title: "Auth Flow",
    description: "Session lifecycle, OAuth, and project roles.",
    toc: authFlowToc,
    Content: AuthFlowContent,
  },
  "architecture/server-actions": {
    title: "Server Actions",
    description: "How mutations work — pattern, locations, and revalidation.",
    toc: serverActionsToc,
    Content: ServerActionsContent,
  },
  "architecture/design-system": {
    title: "Design System",
    description: "Hub design tokens, typography, and status colors.",
    toc: designSystemToc,
    Content: DesignSystemContent,
  },
  "architecture/realtime": {
    title: "Realtime & Presence",
    description: "Supabase Realtime tables and presence channels.",
    toc: realtimeToc,
    Content: RealtimeContent,
  },
  "supabase/setup": {
    title: "Supabase Setup",
    description: "Project connection, client layers, and environment.",
    toc: supabaseSetupToc,
    Content: SupabaseSetupContent,
  },
  "supabase/migrations": {
    title: "Migrations",
    description: "Apply and manage database migrations safely.",
    toc: migrationsToc,
    Content: MigrationsContent,
  },
  "supabase/tables": {
    title: "Table Glossary",
    description: "Every hub_* table and its purpose.",
    toc: tablesToc,
    Content: TablesContent,
  },
  "supabase/storage": {
    title: "Storage",
    description: "hub-media bucket, upload paths, and access rules.",
    toc: storageToc,
    Content: StorageContent,
  },
  "supabase/auth": {
    title: "Auth Configuration",
    description: "Supabase Auth providers, URLs, and profile bootstrap.",
    toc: supabaseAuthToc,
    Content: SupabaseAuthContent,
  },
  "features/projects": {
    title: "Projects",
    description: "Project grid, members, initiatives, and project home.",
    toc: projectsFeatureToc,
    Content: ProjectsFeatureContent,
  },
  "features/review-boards": {
    title: "Review Boards",
    description: "Asset review, votes, comments, and consensus.",
    toc: reviewBoardsToc,
    Content: ReviewBoardsContent,
  },
  "features/canvas": {
    title: "Canvas",
    description: "Ideas whiteboard for team brainstorming.",
    toc: canvasFeatureToc,
    Content: CanvasFeatureContent,
  },
  "features/documents": {
    title: "Text Documents",
    description: "Monaco-powered docs with revision history.",
    toc: documentsFeatureToc,
    Content: DocumentsFeatureContent,
  },
  "features/for-you": {
    title: "For You",
    description: "Unified inbox and triage lenses.",
    toc: forYouFeatureToc,
    Content: ForYouFeatureContent,
  },
  "features/tasks": {
    title: "Tasks",
    description: "Todoist-style tasks, quick add, and collaboration loop.",
    toc: tasksFeatureToc,
    Content: TasksFeatureContent,
  },
  "features/share-links": {
    title: "Share Links",
    description: "Public view-only URLs for assets and presentations.",
    toc: shareLinksToc,
    Content: ShareLinksContent,
  },
  "features/search": {
    title: "Global Search",
    description: "Search projects, files, docs, assets, and tasks.",
    toc: searchFeatureToc,
    Content: SearchFeatureContent,
  },
  "operations/deployment": {
    title: "Deployment",
    description: "Deploy to Vercel with correct env vars and auth URLs.",
    toc: deploymentToc,
    Content: DeploymentContent,
  },
  "operations/scripts": {
    title: "Scripts & Seeding",
    description: "npm scripts, seed data, and legacy migrations.",
    toc: scriptsToc,
    Content: ScriptsContent,
  },
  "operations/testing": {
    title: "Testing",
    description: "Playwright e2e and CI recommendations.",
    toc: testingToc,
    Content: TestingContent,
  },
  "operations/troubleshooting": {
    title: "Troubleshooting",
    description: "Common auth, RLS, realtime, and build issues.",
    toc: troubleshootingToc,
    Content: TroubleshootingContent,
  },
  "contributing/workflow": {
    title: "Contributing Workflow",
    description: "Branching, PRs, and product spec references.",
    toc: workflowToc,
    Content: WorkflowContent,
  },
  "contributing/cursor-mcp": {
    title: "Cursor MCP",
    description: "Optional Supabase MCP for Cursor — not required for the team.",
    toc: cursorMcpToc,
    Content: CursorMcpContent,
  },
};

export const DOC_SLUGS = Object.keys(DOC_REGISTRY);

export function getDocPage(slug: string): DocPageEntry | undefined {
  return DOC_REGISTRY[slug];
}
