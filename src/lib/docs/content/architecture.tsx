import { DocLead, DocSection, DocTable } from "@/components/docs/doc-primitives";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsCodeBlock } from "@/components/docs/docs-code-block";
import {
  DocsColorTokenTable,
  DocsStatusColorCard,
} from "@/components/docs/docs-color-value";
import { DocsInlineCode } from "@/components/docs/docs-inline-code";
import { DocsIllustrationFrame, DocsScreenshot } from "@/components/docs/docs-media";
import { ProjectsWorkflowIllustration } from "@/components/landing/projects-workflow-illustration";

export const architectureOverviewToc = [
  { id: "stack", title: "Tech stack" },
  { id: "patterns", title: "Core patterns" },
  { id: "data-flow", title: "Data flow" },
];

export function ArchitectureOverviewContent() {
  return (
    <>
      <DocLead>
        FSH Creative Hub is a full-stack Next.js application backed by Supabase
        Postgres, Auth, Storage, and Realtime — deployed on Vercel.
      </DocLead>

      <DocSection id="stack" title="Tech stack">
        <DocTable
          headers={["Layer", "Technology"]}
          rows={[
            ["Framework", "Next.js 16 (App Router), React 19, TypeScript"],
            ["Styling", "Tailwind CSS v4, hub design tokens"],
            ["UI", "shadcn/ui (base-nova), Framer Motion"],
            ["Auth & DB", "Supabase (@supabase/ssr)"],
            ["Editor", "Monaco (text documents)"],
            ["DnD", "@dnd-kit (boards, task lists)"],
            ["Deploy", "Vercel"],
          ]}
        />
      </DocSection>

      <DocSection id="patterns" title="Core patterns">
        <ul>
          <li><strong>Server Components</strong> fetch data on the server with the Supabase server client.</li>
          <li><strong>Server Actions</strong> handle mutations (create project, post comment, complete task).</li>
          <li><strong>Client Components</strong> power interactivity (overlays, drag-and-drop, realtime subscriptions).</li>
          <li><strong>RLS</strong> on every <DocsInlineCode>hub_*</DocsInlineCode> table enforces access at the database layer.</li>
        </ul>
        <DocsIllustrationFrame
          gradientClassName="bg-gradient-to-br from-[#7B2CBF] via-[#C77DFF] to-[#E0AAFF]"
          caption="Hub modules share one authenticated shell"
        >
          <div className="p-4">
            <ProjectsWorkflowIllustration />
          </div>
        </DocsIllustrationFrame>
      </DocSection>

      <DocSection id="data-flow" title="Data flow">
        <DocsCodeBlock
          language="text"
          code={`Browser → Next.js middleware (session refresh)
       → Server Component / Server Action
       → Supabase client (anon key + user JWT)
       → Postgres (RLS) / Storage / Realtime`}
        />
        <DocsCallout variant="info">
          There is no separate API server. A few REST routes exist under{" "}
          <DocsInlineCode>/api/search</DocsInlineCode> and{" "}
          <DocsInlineCode>/api/share</DocsInlineCode> for specific client needs.
        </DocsCallout>
      </DocSection>
    </>
  );
}

export const routesToc = [
  { id: "public", title: "Public routes" },
  { id: "hub", title: "Hub routes" },
  { id: "helpers", title: "Route helpers" },
];

export function RoutesContent() {
  return (
    <>
      <DocLead>
        Canonical paths are defined in <DocsInlineCode>src/lib/routes.ts</DocsInlineCode>.
        Always use these helpers instead of hardcoding strings.
      </DocLead>

      <DocSection id="public" title="Public routes">
        <DocTable
          headers={["Route", "Description"]}
          rows={[
            ["/", "Landing page"],
            ["/login", "Sign in"],
            ["/auth/callback", "OAuth code exchange"],
            ["/share/[token]", "Public share links"],
            ["/docs/*", "Documentation"],
          ]}
        />
      </DocSection>

      <DocSection id="hub" title="Hub routes">
        <DocTable
          headers={["Route", "Description"]}
          rows={[
            ["/projects", "Project grid"],
            ["/projects/[id]", "Project home (files, initiatives)"],
            ["/projects/[id]/boards/[boardId]", "Review board"],
            ["/projects/[id]/canvas/[canvasId]", "Ideas canvas (full-bleed)"],
            ["/projects/[id]/docs/[docId]", "Text document (Monaco)"],
            ["/projects/[id]/i/[init]/a/[asset]", "Asset deep link"],
            ["/tasks/today", "Tasks — Today view"],
            ["/tasks/upcoming", "Tasks — Upcoming"],
            ["/tasks/inbox", "Tasks — Inbox"],
            ["/tasks/labels/[slug]", "Tasks by label"],
            ["/for-you", "Inbox triage feed"],
          ]}
        />
        <DocsScreenshot
          src="/docs/screenshots/projects.png"
          alt="Projects grid in the hub"
          caption="/projects — authenticated hub home"
        />
      </DocSection>

      <DocSection id="helpers" title="Route helpers">
        <DocsCodeBlock
          language="ts"
          code={`import {
  projectPath,
  reviewBoardPath,
  canvasPath,
  textDocumentPath,
  forYouLensPath,
  taskDeepLinkPath,
} from "@/lib/routes";`}
        />
      </DocSection>
    </>
  );
}

export const authFlowToc = [
  { id: "session", title: "Session lifecycle" },
  { id: "oauth", title: "OAuth flow" },
  { id: "roles", title: "Roles & RLS" },
];

export function AuthFlowContent() {
  return (
    <>
      <DocLead>
        Every request passes through middleware that refreshes the Supabase session
        cookie before route handlers run.
      </DocLead>

      <DocSection id="session" title="Session lifecycle">
        <DocsCodeBlock
          language="text"
          code={`1. User visits protected route
2. middleware.ts → updateSession()
3. createServerClient reads/writes auth cookies
4. getUser() — if no user → redirect /login?next=...
5. If user on /login → redirect /projects`}
        />
      </DocSection>

      <DocSection id="oauth" title="OAuth flow">
        <ol>
          <li>User clicks Google sign-in on <DocsInlineCode>/login</DocsInlineCode></li>
          <li>Supabase redirects to Google, then back with <DocsInlineCode>?code=</DocsInlineCode></li>
          <li>Middleware catches code and forwards to <DocsInlineCode>/auth/callback</DocsInlineCode></li>
          <li>Callback exchanges code for session, redirects to <DocsInlineCode>next</DocsInlineCode> param</li>
        </ol>
      </DocSection>

      <DocSection id="roles" title="Roles & RLS">
        <p>Project members have roles: <strong>admin</strong>, <strong>editor</strong>, or <strong>viewer</strong>.</p>
        <DocTable
          headers={["Role", "Typical permissions"]}
          rows={[
            ["admin", "Invite members, delete project, full edit"],
            ["editor", "Upload assets, comment, vote, edit tasks"],
            ["viewer", "View and comment (read-heavy)"],
          ]}
        />
        <p>Hub admins (org-wide) can access org-wide projects and dev tools.</p>
      </DocSection>
    </>
  );
}

export const serverActionsToc = [
  { id: "pattern", title: "Action pattern" },
  { id: "locations", title: "Where actions live" },
  { id: "revalidation", title: "Revalidation" },
];

export function ServerActionsContent() {
  return (
    <>
      <DocLead>
        Mutations use Next.js Server Actions with the Supabase server client.
        Actions validate the session, check membership, then write to Postgres.
      </DocLead>

      <DocSection id="pattern" title="Action pattern">
        <DocsCodeBlock
          language="ts"
          code={`"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createProject(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  // ... insert hub_projects, hub_project_members
  revalidatePath("/projects");
}`}
        />
      </DocSection>

      <DocSection id="locations" title="Where actions live">
        <ul>
          <li><DocsInlineCode>lib/projects/actions.ts</DocsInlineCode></li>
          <li><DocsInlineCode>lib/workspace/actions.ts</DocsInlineCode></li>
          <li><DocsInlineCode>lib/tasks/actions.ts</DocsInlineCode></li>
          <li><DocsInlineCode>lib/project-files/actions.ts</DocsInlineCode></li>
          <li><DocsInlineCode>lib/inbox/actions.ts</DocsInlineCode></li>
        </ul>
      </DocSection>

      <DocSection id="revalidation" title="Revalidation">
        <p>
          After mutations, actions call <DocsInlineCode>revalidatePath()</DocsInlineCode>{" "}
          or <DocsInlineCode>revalidateTag()</DocsInlineCode> so Server Components
          show fresh data on the next navigation.
        </p>
        <DocsCallout variant="tip">
          Realtime subscriptions on the client handle live updates for comments,
          votes, and tasks without a full page refresh.
        </DocsCallout>
      </DocSection>
    </>
  );
}

export const designSystemToc = [
  { id: "tokens", title: "Design tokens" },
  { id: "typography", title: "Typography" },
  { id: "status-colors", title: "Status colors" },
];

export function DesignSystemContent() {
  return (
    <>
      <DocLead>
        The hub uses a warm paper palette with espresso text and semantic status
        colors for review states. Tokens live in <DocsInlineCode>globals.css</DocsInlineCode>.
      </DocLead>

      <DocSection id="tokens" title="Design tokens">
        <DocsColorTokenTable
          tokens={[
            { token: "--hub-paper", hex: "#fbf7ee", use: "page background" },
            { token: "--hub-espresso", hex: "#0b0b0b", use: "primary text" },
            { token: "--hub-accent", hex: "#ffc94b", use: "CTAs, highlights" },
            { token: "--hub-primary", hex: "#18a0fb", use: "links, info" },
            { token: "--hub-surface", hex: "#ffffff", use: "cards, panels" },
          ]}
        />
      </DocSection>

      <DocSection id="typography" title="Typography">
        <ul>
          <li><strong>Display:</strong> Bricolage Grotesque — headlines</li>
          <li><strong>Body:</strong> Geist Sans</li>
          <li><strong>Mono:</strong> Geist Mono — labels, metadata</li>
        </ul>
      </DocSection>

      <DocSection id="status-colors" title="Status colors">
        <div className="grid gap-3 sm:grid-cols-2">
          <DocsStatusColorCard
            label="approved"
            hex="#22c55e"
            description="Asset approved by reviewer"
            borderClass="border-hub-approved/30"
            bgClass="bg-hub-approved/10"
            textClass="text-hub-approved"
          />
          <DocsStatusColorCard
            label="rejected"
            hex="#ef4444"
            description="Needs revision"
            borderClass="border-hub-rejected/30"
            bgClass="bg-hub-rejected/10"
            textClass="text-hub-rejected"
          />
          <DocsStatusColorCard
            label="pending"
            hex="#c2410c"
            description="Awaiting review"
            borderClass="border-hub-pending/30"
            bgClass="bg-hub-pending/10"
            textClass="text-hub-pending"
          />
          <DocsStatusColorCard
            label="final"
            hex="#ffc94b"
            description="Locked final pick"
            borderClass="border-hub-accent/40"
            bgClass="bg-hub-accent/15"
            textClass="text-hub-espresso"
          />
        </div>
        <p className="mt-4">
          See <DocsInlineCode>PRD and MD files/Hub_Overlay_UI_Style.md</DocsInlineCode> for overlay and dialog conventions.
        </p>
      </DocSection>
    </>
  );
}

export const realtimeToc = [
  { id: "tables", title: "Realtime tables" },
  { id: "presence", title: "Presence" },
  { id: "client", title: "Client subscriptions" },
];

export function RealtimeContent() {
  return (
    <>
      <DocLead>
        Supabase Realtime keeps comments, votes, and tasks in sync across
        collaborators without polling.
      </DocLead>

      <DocSection id="tables" title="Realtime tables">
        <ul>
          <li><DocsInlineCode>hub_comments</DocsInlineCode> — threaded asset feedback</li>
          <li><DocsInlineCode>hub_votes</DocsInlineCode> — approve / reject / react</li>
          <li><DocsInlineCode>hub_tasks</DocsInlineCode> — task list updates</li>
          <li><DocsInlineCode>hub_task_comments</DocsInlineCode> — task discussion</li>
        </ul>
      </DocSection>

      <DocSection id="presence" title="Presence">
        <p>
          The <DocsInlineCode>components/presence/</DocsInlineCode> module shows who is
          currently viewing a project or task list. Presence uses Supabase Realtime
          channels keyed by resource ID.
        </p>
      </DocSection>

      <DocSection id="client" title="Client subscriptions">
        <p>
          Browser components use <DocsInlineCode>createClient()</DocsInlineCode> from{" "}
          <DocsInlineCode>lib/supabase/client.ts</DocsInlineCode> and subscribe in{" "}
          <DocsInlineCode>useEffect</DocsInlineCode> hooks, cleaning up on unmount.
        </p>
        <DocsCallout variant="info">
          Server Components never subscribe to Realtime — only client components do.
        </DocsCallout>
      </DocSection>
    </>
  );
}
