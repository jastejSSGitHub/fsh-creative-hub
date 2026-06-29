import { DocLead, DocSection, DocTable } from "@/components/docs/doc-primitives";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsCodeBlock } from "@/components/docs/docs-code-block";
import { DocsCopyableKeyValueTable, DocsCopyableSettingsTable } from "@/components/docs/docs-copyable-value";
import { DocsInlineCode } from "@/components/docs/docs-inline-code";

export const supabaseSetupToc = [
  { id: "project", title: "Project" },
  { id: "clients", title: "Client layers" },
  { id: "env", title: "Connection" },
];

export function SupabaseSetupContent() {
  return (
    <>
      <DocLead>
        Creative Hub uses a dedicated Supabase project. All data lives in{" "}
        <DocsInlineCode>hub_*</DocsInlineCode> tables with Row Level Security enabled.
      </DocLead>

      <DocSection id="project" title="Project">
        <DocsCopyableKeyValueTable
          rows={[
            {
              label: "Project ref",
              value: "rnyeonvbnrwephpviyzu",
            },
            {
              label: "Dashboard",
              value: "supabase.com/dashboard/project/rnyeonvbnrwephpviyzu",
              copyValue:
                "https://supabase.com/dashboard/project/rnyeonvbnrwephpviyzu",
              variant: "url",
            },
            {
              label: "Storage bucket",
              value: "hub-media (public read)",
              copyValue: "hub-media",
            },
          ]}
        />
      </DocSection>

      <DocSection id="clients" title="Client layers">
        <DocTable
          headers={["File", "Used by"]}
          rows={[
            ["lib/supabase/client.ts", "Browser — auth UI, realtime, client mutations"],
            ["lib/supabase/server.ts", "Server Components & Server Actions"],
            ["lib/supabase/middleware.ts", "Session refresh on every request"],
            ["lib/supabase/admin.ts", "Service role — dev bypass, admin invites"],
          ]}
        />
      </DocSection>

      <DocSection id="env" title="Connection">
        <DocsCodeBlock
          language="env"
          code={`NEXT_PUBLIC_SUPABASE_URL=https://rnyeonvbnrwephpviyzu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key`}
        />
        <DocsCallout variant="tip">
          Find keys under Project Settings → API in the Supabase dashboard.
        </DocsCallout>
      </DocSection>
    </>
  );
}

export const migrationsToc = [
  { id: "apply", title: "Applying migrations" },
  { id: "list", title: "Migration list" },
  { id: "auth-after", title: "Post-migration auth" },
];

export function MigrationsContent() {
  return (
    <>
      <DocLead>
        Schema changes are versioned in <DocsInlineCode>supabase/migrations/</DocsInlineCode>{" "}
        (001–022). Always apply in order on a fresh database.
      </DocLead>

      <DocSection id="apply" title="Applying migrations">
        <h3>Option A — SQL Editor</h3>
        <p>Paste each migration file into the Supabase SQL Editor and run in order.</p>

        <h3>Option B — Supabase CLI</h3>
        <DocsCodeBlock
          code={`supabase link --project-ref rnyeonvbnrwephpviyzu
supabase db push`}
        />

        <DocsCallout variant="warning">
          Never edit applied migrations in place. Add a new numbered migration instead.
        </DocsCallout>
      </DocSection>

      <DocSection id="list" title="Migration list">
        <DocTable
          headers={["Migration", "Adds"]}
          rows={[
            ["001_hub_schema.sql", "Core tables: profiles, projects, assets, comments, votes"],
            ["004_hub_project_files.sql", "Project files (boards, docs)"],
            ["016_hub_tasks.sql", "Tasks, labels, filters, sections"],
            ["019_hub_comments_linked_task.sql", "Comment → task linking"],
            ["022_hub_share_links.sql", "Public share tokens"],
          ]}
        />
        <p>See <DocsInlineCode>supabase/migrations/README.md</DocsInlineCode> for full details.</p>
      </DocSection>

      <DocSection id="auth-after" title="Post-migration auth">
        <p>After first migration, configure Authentication → URL configuration:</p>
        <DocsCopyableSettingsTable
          headers={["Setting", "Local", "Production"]}
          rows={[
            {
              setting: "Site URL",
              local: "http://localhost:3010",
              production: "https://fsh-creative-hub.vercel.app",
            },
            {
              setting: "Redirect URLs",
              local: "…/auth/callback (both environments)",
            },
          ]}
        />
      </DocSection>
    </>
  );
}

export const tablesToc = [
  { id: "core", title: "Core entities" },
  { id: "collaboration", title: "Collaboration" },
  { id: "tasks", title: "Tasks" },
  { id: "types", title: "TypeScript types" },
];

export function TablesContent() {
  return (
    <>
      <DocLead>
        All application tables are prefixed with <DocsInlineCode>hub_</DocsInlineCode>.
        RLS policies enforce project membership on every query.
      </DocLead>

      <DocSection id="core" title="Core entities">
        <DocTable
          headers={["Table", "Purpose"]}
          rows={[
            ["hub_profiles", "User profile (extends auth.users)"],
            ["hub_projects", "Project container"],
            ["hub_project_members", "Membership & roles"],
            ["hub_initiatives", "Campaign / initiative within a project"],
            ["hub_assets", "Uploaded creative files"],
            ["hub_project_files", "Boards, canvas, text docs metadata"],
            ["hub_activity", "Activity feed events"],
          ]}
        />
      </DocSection>

      <DocSection id="collaboration" title="Collaboration">
        <DocTable
          headers={["Table", "Purpose"]}
          rows={[
            ["hub_comments", "Threaded asset comments"],
            ["hub_votes", "Approve, reject, emoji reactions"],
            ["hub_ideas", "Canvas idea nodes"],
            ["hub_share_links", "Public view-only tokens"],
          ]}
        />
      </DocSection>

      <DocSection id="tasks" title="Tasks">
        <DocTable
          headers={["Table", "Purpose"]}
          rows={[
            ["hub_tasks", "Task items"],
            ["hub_labels", "Team labels (design, marketing, tech)"],
            ["hub_task_labels", "Task ↔ label join"],
            ["hub_filters", "Saved filters (overdue, awaiting client)"],
            ["hub_sections", "Task list sections"],
            ["hub_task_comments", "Task discussion threads"],
          ]}
        />
      </DocSection>

      <DocSection id="types" title="TypeScript types">
        <p>
          Types are maintained in <DocsInlineCode>src/types/database.ts</DocsInlineCode>.
          Regenerate after schema changes:
        </p>
        <DocsCodeBlock
          code={`npx supabase gen types typescript --project-id rnyeonvbnrwephpviyzu > src/types/database.ts`}
        />
      </DocSection>
    </>
  );
}

export const storageToc = [
  { id: "bucket", title: "hub-media bucket" },
  { id: "paths", title: "Upload paths" },
  { id: "access", title: "Access rules" },
];

export function StorageContent() {
  return (
    <>
      <DocLead>
        Creative assets (images, videos) are stored in Supabase Storage and
        referenced by URL in <DocsInlineCode>hub_assets</DocsInlineCode>.
      </DocLead>

      <DocSection id="bucket" title="hub-media bucket">
        <p>
          Public read access allows share links and presentation mode to load
          media without authentication. Writes require an authenticated session
          with editor role on the project.
        </p>
      </DocSection>

      <DocSection id="paths" title="Upload paths">
        <p>Upload logic lives in <DocsInlineCode>lib/workspace/</DocsInlineCode> and follows a predictable path pattern:</p>
        <DocsCodeBlock
          code={`hub-media/{projectId}/{initiativeId}/{assetId}/{filename}`}
        />
      </DocSection>

      <DocSection id="access" title="Access rules">
        <DocsCallout variant="info">
          Storage policies mirror project membership — viewers can read, editors
          can upload and delete their own uploads (see migrations 007, 008).
        </DocsCallout>
      </DocSection>
    </>
  );
}

export const supabaseAuthToc = [
  { id: "providers", title: "Providers" },
  { id: "urls", title: "URL configuration" },
  { id: "profiles", title: "Profiles bootstrap" },
];

export function SupabaseAuthContent() {
  return (
    <>
      <DocLead>
        Supabase Auth handles identity. Application profiles in{" "}
        <DocsInlineCode>hub_profiles</DocsInlineCode> are created on first sign-in.
      </DocLead>

      <DocSection id="providers" title="Providers">
        <ul>
          <li><strong>Google</strong> — recommended for the FSH team</li>
          <li><strong>Email</strong> — magic link (rate-limited on built-in SMTP)</li>
          <li><strong>Dev bypass</strong> — local only, not a Supabase provider</li>
        </ul>
        <DocsCallout variant="tip">
          Prefer Google sign-in in production to avoid magic-link rate limits.
        </DocsCallout>
      </DocSection>

      <DocSection id="urls" title="URL configuration">
        <DocsCodeBlock
          code={`# Redirect URLs (add both to Supabase dashboard)
http://localhost:3010/auth/callback
https://fsh-creative-hub.vercel.app/auth/callback`}
        />
      </DocSection>

      <DocSection id="profiles" title="Profiles bootstrap">
        <p>
          On first login, a row is inserted into <DocsInlineCode>hub_profiles</DocsInlineCode>{" "}
          with display name and avatar from the OAuth provider. Hub admin flag is
          set via migration 015 for org-wide access.
        </p>
      </DocSection>
    </>
  );
}
