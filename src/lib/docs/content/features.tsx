import { DocLead, DocSection, DocTable } from "@/components/docs/doc-primitives";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsCodeBlock } from "@/components/docs/docs-code-block";
import { DocsInlineCode } from "@/components/docs/docs-inline-code";
import {
  DocsIllustrationFrame,
  DocsLoomEmbed,
  DocsScreenshot,
} from "@/components/docs/docs-media";
import { DOCS_LOOM_URLS } from "@/lib/docs/loom-urls";
import { CommentsWorkflowIllustration } from "@/components/landing/comments-workflow-illustration";
import { ForYouWorkflowIllustration } from "@/components/landing/for-you-workflow-illustration";
import { IdeasWorkflowIllustration } from "@/components/landing/ideas-workflow-illustration";
import { ProjectsWorkflowIllustration } from "@/components/landing/projects-workflow-illustration";
import { QuickTasksWorkflowIllustration } from "@/components/landing/quick-tasks-workflow-illustration";
import { CollaborationLoopWorkflowIllustration } from "@/components/landing/collaboration-loop-workflow-illustration";

export const projectsFeatureToc = [
  { id: "overview", title: "Overview" },
  { id: "code", title: "Key files" },
  { id: "tutorial", title: "Walkthrough" },
];

export function ProjectsFeatureContent() {
  return (
    <>
      <DocLead>
        Projects are the top-level container for creative work — like Figma files
        for campaigns. Each project has members, initiatives, files, and an activity feed.
      </DocLead>

      <DocSection id="overview" title="Overview">
        <ul>
          <li>Create, favorite, and trash projects from <DocsInlineCode>/projects</DocsInlineCode></li>
          <li>Invite members with admin / editor / viewer roles</li>
          <li>Project home shows boards, canvas, docs, and initiatives</li>
        </ul>
        <DocsIllustrationFrame
          gradientClassName="bg-gradient-to-br from-[#7B2CBF] via-[#C77DFF] to-[#E0AAFF]"
          caption="Project grid and workspace"
        >
          <div className="p-4">
            <ProjectsWorkflowIllustration />
          </div>
        </DocsIllustrationFrame>
        <DocsScreenshot
          src="/docs/screenshots/projects.png"
          alt="Projects page"
          caption="Authenticated projects grid"
        />
      </DocSection>

      <DocSection id="code" title="Key files">
        <DocTable
          headers={["Path", "Role"]}
          rows={[
            ["components/projects/", "Project grid UI, create dialog, invites"],
            ["components/project-files/", "Project home, file list"],
            ["lib/projects/", "Queries & server actions"],
          ]}
        />
      </DocSection>

      <DocSection id="tutorial" title="Walkthrough">
        <DocsLoomEmbed
          loomUrl={DOCS_LOOM_URLS.projects}
          title="Every initiative, one home"
        />
      </DocSection>
    </>
  );
}

export const reviewBoardsToc = [
  { id: "overview", title: "Review loop" },
  { id: "votes", title: "Votes & consensus" },
  { id: "tutorial", title: "Walkthrough" },
];

export function ReviewBoardsContent() {
  return (
    <>
      <DocLead>
        Review boards organize assets for team approval. Open any asset full-screen
        to vote, comment, and reach consensus.
      </DocLead>

      <DocSection id="overview" title="Review loop">
        <p>Route: <DocsInlineCode>/projects/[id]/boards/[boardId]</DocsInlineCode></p>
        <ul>
          <li>Upload assets to an initiative workspace</li>
          <li>Open asset overlay for full-screen review</li>
          <li>Thread comments with @mentions and resolve checkmarks</li>
        </ul>
        <DocsScreenshot
          src="/docs/screenshots/project-home.png"
          alt="Project workspace"
          caption="Project home — entry point to boards and assets"
        />
      </DocSection>

      <DocSection id="votes" title="Votes & consensus">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-hub-approved/15 px-3 py-1 text-sm text-hub-approved">🔥 Approved</span>
          <span className="rounded-full bg-hub-rejected/15 px-3 py-1 text-sm text-hub-rejected">❌ Rejected</span>
          <span className="rounded-full bg-hub-surface-muted px-3 py-1 text-sm">👍 🤔 reactions</span>
        </div>
        <p className="mt-4">
          Votes write to <DocsInlineCode>hub_votes</DocsInlineCode> and sync via Realtime.
          Mark assets as <strong>final</strong> when the team locks a pick.
        </p>
        <DocsIllustrationFrame
          gradientClassName="bg-gradient-to-br from-[#3A86FF] via-[#8338EC] to-[#C77DFF]"
          caption="Threaded feedback on assets"
        >
          <div className="p-4">
            <CommentsWorkflowIllustration />
          </div>
        </DocsIllustrationFrame>
      </DocSection>

      <DocSection id="tutorial" title="Walkthrough">
        <DocsLoomEmbed
          loomUrl={DOCS_LOOM_URLS.review}
          title="Approve, reject, react"
        />
        <DocsLoomEmbed
          loomUrl={DOCS_LOOM_URLS.comments}
          title="Feedback that sticks"
        />
      </DocSection>
    </>
  );
}

export const canvasFeatureToc = [
  { id: "overview", title: "Ideas canvas" },
  { id: "code", title: "Implementation" },
  { id: "tutorial", title: "Walkthrough" },
];

export function CanvasFeatureContent() {
  return (
    <>
      <DocLead>
        The ideas canvas is a shared whiteboard for brainstorming. Ideas can be
        upvoted and linked to initiatives.
      </DocLead>

      <DocSection id="overview" title="Ideas canvas">
        <p>Route: <DocsInlineCode>/projects/[id]/canvas/[canvasId]</DocsInlineCode> — full-bleed, no hub chrome.</p>
        <DocsIllustrationFrame
          gradientClassName="bg-gradient-to-br from-[#FFC94B] via-[#F4A261] to-[#FF6B6B]"
          caption="Brainstorm board with upvotes"
        >
          <div className="p-4">
            <IdeasWorkflowIllustration />
          </div>
        </DocsIllustrationFrame>
      </DocSection>

      <DocSection id="code" title="Implementation">
        <ul>
          <li><DocsInlineCode>components/canvas/</DocsInlineCode> — node UI</li>
          <li><DocsInlineCode>lib/canvas/</DocsInlineCode> — queries & actions</li>
          <li><DocsInlineCode>hub_ideas</DocsInlineCode>, <DocsInlineCode>hub_idea_votes</DocsInlineCode> tables</li>
        </ul>
      </DocSection>

      <DocSection id="tutorial" title="Walkthrough">
        <DocsLoomEmbed loomUrl={DOCS_LOOM_URLS.canvas} title="Brainstorm out loud" />
      </DocSection>
    </>
  );
}

export const documentsFeatureToc = [
  { id: "overview", title: "In your project" },
  { id: "editor", title: "Monaco editor" },
  { id: "revisions", title: "Revisions" },
];

export function DocumentsFeatureContent() {
  return (
    <>
      <DocLead>
        Text documents are Markdown-friendly briefs and notes stored per project,
        edited with the Monaco code editor.
      </DocLead>

      <DocSection id="overview" title="In your project">
        <p>Route: <DocsInlineCode>/projects/[id]/docs/[docId]</DocsInlineCode></p>
        <p>Created from project home alongside boards and canvas files.</p>
      </DocSection>

      <DocSection id="editor" title="Monaco editor">
        <p>
          Uses <DocsInlineCode>@monaco-editor/react</DocsInlineCode> with hub-themed
          chrome. Document body is searchable via global search.
        </p>
        <DocsCodeBlock
          language="text"
          code={`lib/documents/     — load, save, revision snapshots
components/documents/ — editor shell`}
        />
      </DocSection>

      <DocSection id="revisions" title="Revisions">
        <p>
          Migration 020 adds version history for assets; text docs support revision
          snapshots for rollback (see <DocsInlineCode>lib/documents/</DocsInlineCode>).
        </p>
      </DocSection>
    </>
  );
}

export const forYouFeatureToc = [
  { id: "overview", title: "Inbox feed" },
  { id: "lenses", title: "Lenses" },
  { id: "code", title: "Key files" },
];

export function ForYouFeatureContent() {
  return (
    <>
      <DocLead>
        For You is a unified triage feed — mentions, assigned tasks, overdue work,
        and assets waiting on your vote.
      </DocLead>

      <DocSection id="overview" title="Inbox feed">
        <p>Route: <DocsInlineCode>/for-you</DocsInlineCode></p>
        <DocsIllustrationFrame
          gradientClassName="bg-gradient-to-br from-[#06b6d4] via-[#3b82f6] to-[#6366f1]"
          caption="Triage lenses and urgency sorting"
        >
          <div className="p-4">
            <ForYouWorkflowIllustration />
          </div>
        </DocsIllustrationFrame>
        <DocsScreenshot
          src="/docs/screenshots/for-you.png"
          alt="For You inbox"
          caption="For You — default needs-you lens"
        />
      </DocSection>

      <DocSection id="lenses" title="Lenses">
        <DocTable
          headers={["Lens", "Shows"]}
          rows={[
            ["needs-you", "Default — everything requiring action"],
            ["replies", "Threads awaiting your reply"],
            ["assigned", "Tasks assigned to you"],
            ["waiting-on-others", "Items blocked on teammates"],
            ["following", "Projects and threads you follow"],
            ["your-uploads", "Assets you uploaded awaiting review"],
          ]}
        />
        <DocsCodeBlock
          language="ts"
          code={`import { forYouLensPath } from "@/lib/routes";
forYouLensPath("assigned"); // /for-you?lens=assigned`}
        />
      </DocSection>

      <DocSection id="code" title="Key files">
        <ul>
          <li><DocsInlineCode>components/inbox/</DocsInlineCode></li>
          <li><DocsInlineCode>lib/inbox/</DocsInlineCode></li>
        </ul>
      </DocSection>
    </>
  );
}

export const tasksFeatureToc = [
  { id: "overview", title: "Task system" },
  { id: "views", title: "Views" },
  { id: "quick-add", title: "Quick add (Q)" },
  { id: "collaboration", title: "Comment → task loop" },
];

export function TasksFeatureContent() {
  return (
    <>
      <DocLead>
        Tasks are Todoist-inspired — Today, Upcoming, Inbox, labels, filters,
        and natural-language quick add from anywhere in the hub.
      </DocLead>

      <DocSection id="overview" title="Task system">
        <DocsScreenshot
          src="/docs/screenshots/tasks.png"
          alt="Tasks today view"
          caption="/tasks/today — daily task view"
        />
      </DocSection>

      <DocSection id="views" title="Views">
        <DocTable
          headers={["Route", "Purpose"]}
          rows={[
            ["/tasks/today", "Due today + overdue"],
            ["/tasks/upcoming", "Calendar-style upcoming"],
            ["/tasks/inbox", "Unscheduled capture"],
            ["/tasks/labels/[slug]", "Filter by team label"],
            ["/tasks/filters/[filterId]", "Saved smart filters"],
            ["/projects/[id]/tasks", "Project-scoped tasks"],
          ]}
        />
      </DocSection>

      <DocSection id="quick-add" title="Quick add (Q)">
        <p>Press <kbd className="rounded border px-1.5 py-0.5 font-mono text-xs">Q</kbd> anywhere in the hub.</p>
        <DocsIllustrationFrame
          gradientClassName="bg-gradient-to-br from-[#10b981] via-[#14b8a6] to-[#0ea5e9]"
          caption="Natural-language task capture"
        >
          <div className="p-4">
            <QuickTasksWorkflowIllustration />
          </div>
        </DocsIllustrationFrame>
        <p>
          Uses <DocsInlineCode>chrono-node</DocsInlineCode> to parse due dates from
          plain text like &quot;Review banner tomorrow 3pm #design&quot;.
        </p>
      </DocSection>

      <DocSection id="collaboration" title="Comment → task loop">
        <DocsIllustrationFrame
          gradientClassName="bg-gradient-to-br from-[#ec4899] via-[#a855f7] to-[#6366f1]"
          caption="Feedback becomes follow-through"
        >
          <div className="p-4">
            <CollaborationLoopWorkflowIllustration />
          </div>
        </DocsIllustrationFrame>
        <DocsCallout variant="success">
          Promote a comment to a linked task, complete the work, then resolve the thread.
        </DocsCallout>
      </DocSection>
    </>
  );
}

export const shareLinksToc = [
  { id: "overview", title: "Public shares" },
  { id: "api", title: "API routes" },
  { id: "security", title: "Security" },
];

export function ShareLinksContent() {
  return (
    <>
      <DocLead>
        Share links generate view-only public URLs for assets, presentations,
        or boards — no login required.
      </DocLead>

      <DocSection id="overview" title="Public shares">
        <p>Route: <DocsInlineCode>/share/[token]</DocsInlineCode></p>
        <p>Tokens are stored in <DocsInlineCode>hub_share_links</DocsInlineCode> (migration 022).</p>
      </DocSection>

      <DocSection id="api" title="API routes">
        <ul>
          <li><DocsInlineCode>POST /api/share</DocsInlineCode> — create link</li>
          <li><DocsInlineCode>DELETE /api/share/[id]</DocsInlineCode> — revoke</li>
        </ul>
      </DocSection>

      <DocSection id="security" title="Security">
        <DocsCallout variant="warning">
          Share tokens are unguessable but not revocable by viewers. Editors can
          revoke links from the share dialog. View dedup is tracked in{" "}
          <DocsInlineCode>hub_share_view_dedup</DocsInlineCode>.
        </DocsCallout>
      </DocSection>
    </>
  );
}

export const searchFeatureToc = [
  { id: "overview", title: "Global search" },
  { id: "scope", title: "What is indexed" },
  { id: "api", title: "API" },
];

export function SearchFeatureContent() {
  return (
    <>
      <DocLead>
        Global search in the hub header finds projects, files, document bodies,
        assets, and tasks in one query.
      </DocLead>

      <DocSection id="overview" title="Global search">
        <p>Keyboard shortcut opens search from anywhere in <DocsInlineCode>HubShell</DocsInlineCode>.</p>
      </DocSection>

      <DocSection id="scope" title="What is indexed">
        <ul>
          <li>Project names</li>
          <li>Project files (boards, canvas, docs)</li>
          <li>Text document body content</li>
          <li>Asset filenames and metadata</li>
          <li>Task titles and descriptions</li>
        </ul>
      </DocSection>

      <DocSection id="api" title="API">
        <DocsCodeBlock
          code={`GET /api/search?q=your+query`}
        />
        <p>Implementation: <DocsInlineCode>lib/search/</DocsInlineCode></p>
      </DocSection>
    </>
  );
}
