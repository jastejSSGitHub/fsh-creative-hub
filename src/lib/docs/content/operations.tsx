import { DocLead, DocSection, DocTable } from "@/components/docs/doc-primitives";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsCodeBlock } from "@/components/docs/docs-code-block";
import { DocsInlineCode } from "@/components/docs/docs-inline-code";

export const deploymentToc = [
  { id: "vercel", title: "Vercel deploy" },
  { id: "env", title: "Environment variables" },
  { id: "auth", title: "Production auth" },
  { id: "domain", title: "Custom domain" },
];

export function DeploymentContent() {
  return (
    <>
      <DocLead>
        Creative Hub deploys to Vercel from the GitHub repo. Production URL:{" "}
        <DocsInlineCode>https://fsh-creative-hub.vercel.app</DocsInlineCode>
      </DocLead>

      <DocSection id="vercel" title="Vercel deploy">
        <ol>
          <li>Connect <DocsInlineCode>jastejSSGitHub/fsh-creative-hub</DocsInlineCode> to Vercel</li>
          <li>Set environment variables (see below)</li>
          <li>Deploy — Next.js build runs <DocsInlineCode>next build</DocsInlineCode></li>
        </ol>
        <DocsCodeBlock
          code={`npm run validate   # typecheck + build — run before merging`}
        />
      </DocSection>

      <DocSection id="env" title="Environment variables">
        <DocTable
          headers={["Variable", "Production value"]}
          rows={[
            ["NEXT_PUBLIC_SUPABASE_URL", "Supabase project URL"],
            ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "Anon key"],
            ["NEXT_PUBLIC_SITE_URL", "https://fsh-creative-hub.vercel.app"],
            ["SUPABASE_SERVICE_ROLE_KEY", "Service role (server only)"],
          ]}
        />
        <DocsCallout variant="danger">
          Do not set <DocsInlineCode>DEV_AUTH_BYPASS</DocsInlineCode> in production.
        </DocsCallout>
      </DocSection>

      <DocSection id="auth" title="Production auth">
        <p>Add production callback URL to Supabase before go-live:</p>
        <DocsCodeBlock
          code={`https://fsh-creative-hub.vercel.app/auth/callback`}
        />
      </DocSection>

      <DocSection id="domain" title="Custom domain">
        <p>
          Add a custom domain in Vercel project settings, then update{" "}
          <DocsInlineCode>NEXT_PUBLIC_SITE_URL</DocsInlineCode> and Supabase redirect URLs to match.
        </p>
      </DocSection>
    </>
  );
}

export const scriptsToc = [
  { id: "dev", title: "Development" },
  { id: "seed", title: "Seed scripts" },
  { id: "migrate", title: "Data migration" },
];

export function ScriptsContent() {
  return (
    <>
      <DocLead>
        Utility scripts in <DocsInlineCode>scripts/</DocsInlineCode> help seed demo
        data and migrate legacy content.
      </DocLead>

      <DocSection id="dev" title="Development">
        <DocTable
          headers={["Script", "Command"]}
          rows={[
            ["Dev server (port 3010)", "npm run dev"],
            ["Typecheck", "npm run typecheck"],
            ["Full validate", "npm run validate"],
            ["Lint", "npm run lint"],
          ]}
        />
      </DocSection>

      <DocSection id="seed" title="Seed scripts">
        <DocsCodeBlock
          code={`npm run seed:presentation-demo
npm run seed:healthy-cart-canada`}
        />
        <p>Seeds require <DocsInlineCode>SUPABASE_SERVICE_ROLE_KEY</DocsInlineCode> in <DocsInlineCode>.env.local</DocsInlineCode>.</p>
      </DocSection>

      <DocSection id="migrate" title="Data migration">
        <DocsCodeBlock code={`npm run migrate:blenz`} />
        <p>Migrates legacy Blenz review-board data into hub tables.</p>
      </DocSection>
    </>
  );
}

export const testingToc = [
  { id: "playwright", title: "Playwright" },
  { id: "e2e-auth", title: "E2E sign-in" },
  { id: "ci", title: "CI recommendation" },
];

export function TestingContent() {
  return (
    <>
      <DocLead>
        End-to-end tests use Playwright. The suite is early-stage — expand coverage
        as features stabilize.
      </DocLead>

      <DocSection id="playwright" title="Playwright">
        <DocsCodeBlock
          code={`npm run test:e2e`}
        />
        <p>Config: <DocsInlineCode>playwright.config.ts</DocsInlineCode></p>
      </DocSection>

      <DocSection id="e2e-auth" title="E2E sign-in">
        <p>
          A test-only route <DocsInlineCode>/api/e2e/sign-in</DocsInlineCode> creates
          sessions when <DocsInlineCode>E2E_TEST_SECRET</DocsInlineCode> is set.
          Never enable in production.
        </p>
      </DocSection>

      <DocSection id="ci" title="CI recommendation">
        <DocsCallout variant="tip">
          Run <DocsInlineCode>npm run validate</DocsInlineCode> on every PR —
          it typechecks, validates motion keyframes, and runs a production build.
        </DocsCallout>
      </DocSection>
    </>
  );
}

export const troubleshootingToc = [
  { id: "auth", title: "Auth issues" },
  { id: "rls", title: "RLS errors" },
  { id: "realtime", title: "Realtime not updating" },
  { id: "build", title: "Build failures" },
];

export function TroubleshootingContent() {
  return (
    <>
      <DocLead>
        Common issues when onboarding or deploying Creative Hub.
      </DocLead>

      <DocSection id="auth" title="Auth issues">
        <DocTable
          headers={["Symptom", "Fix"]}
          rows={[
            ["Redirect loop on login", "Check NEXT_PUBLIC_SITE_URL matches actual URL"],
            ["OAuth code error", "Add callback URL to Supabase redirect list"],
            ["Skip login missing", "Set DEV_AUTH_BYPASS=true in .env.local only"],
            ["Magic link rate limit", "Use Google sign-in instead"],
          ]}
        />
      </DocSection>

      <DocSection id="rls" title="RLS errors">
        <p>
          &quot;Row level security&quot; or empty results often mean the user is not
          a project member. Check <DocsInlineCode>hub_project_members</DocsInlineCode>.
        </p>
        <DocsCallout variant="warning">
          Never debug RLS issues with the service role key in client code.
        </DocsCallout>
      </DocSection>

      <DocSection id="realtime" title="Realtime not updating">
        <ul>
          <li>Confirm table is in the Realtime publication (migrations enable this)</li>
          <li>Check browser console for channel subscription errors</li>
          <li>Verify user has SELECT permission via RLS on the row</li>
        </ul>
      </DocSection>

      <DocSection id="build" title="Build failures">
        <DocsCodeBlock code={`npm run typecheck   # isolate TS errors
npm run build       # full Next.js build`} />
        <p>See <DocsInlineCode>AGENTS.md</DocsInlineCode> for Next.js 16 breaking changes.</p>
      </DocSection>
    </>
  );
}

export const workflowToc = [
  { id: "branching", title: "Branching" },
  { id: "pr", title: "Pull requests" },
  { id: "specs", title: "Product specs" },
];

export function WorkflowContent() {
  return (
    <>
      <DocLead>
        Guidelines for contributing to Creative Hub as the team grows.
      </DocLead>

      <DocSection id="branching" title="Branching">
        <ul>
          <li><DocsInlineCode>main</DocsInlineCode> — production (Vercel auto-deploy)</li>
          <li>Feature branches: <DocsInlineCode>feature/short-description</DocsInlineCode></li>
          <li>Run <DocsInlineCode>npm run validate</DocsInlineCode> before opening a PR</li>
        </ul>
      </DocSection>

      <DocSection id="pr" title="Pull requests">
        <ul>
          <li>Link to relevant PRD section or roadmap phase</li>
          <li>Include screenshots for UI changes</li>
          <li>New DB changes require a numbered migration file</li>
        </ul>
      </DocSection>

      <DocSection id="specs" title="Product specs">
        <p>Detailed product docs live in <DocsInlineCode>PRD and MD files/</DocsInlineCode>:</p>
        <ul>
          <li>FSH_Creative_Hub_PRD.md — full product spec</li>
          <li>FSH_Creative_Hub_Roadmap_Remaining_Work.md — phased backlog</li>
          <li>Collaboration_Features_Implementation_Spec.md</li>
          <li>Hub_Overlay_UI_Style.md</li>
        </ul>
      </DocSection>
    </>
  );
}

export const cursorMcpToc = [
  { id: "what", title: "What is MCP?" },
  { id: "cursor-only", title: "Cursor-only tooling" },
  { id: "team-workflow", title: "Team workflow without MCP" },
];

export function CursorMcpContent() {
  return (
    <>
      <DocLead>
        MCP (Model Context Protocol) connects AI assistants in Cursor to external
        services. It is an IDE feature — not part of the Creative Hub application.
      </DocLead>

      <DocSection id="what" title="What is MCP?">
        <p>
          The <strong>user-supabase</strong> MCP server lets Cursor agents run SQL,
          apply migrations, list tables, and fetch logs directly from your Supabase
          project while you code.
        </p>
      </DocSection>

      <DocSection id="cursor-only" title="Cursor-only tooling">
        <DocsCallout variant="info">
          MCP is exclusive to Cursor (and compatible IDEs). Teammates using VS Code
          without Cursor should use the Supabase dashboard or CLI instead.
        </DocsCallout>
        <p>To enable in Cursor: Settings → MCP → add the Supabase server with your project credentials.</p>
      </DocSection>

      <DocSection id="team-workflow" title="Team workflow without MCP">
        <p>Everyone should use the same source of truth:</p>
        <ol>
          <li>Schema changes → new file in <DocsInlineCode>supabase/migrations/</DocsInlineCode></li>
          <li>Apply via <DocsInlineCode>supabase db push</DocsInlineCode> or SQL Editor</li>
          <li>Regenerate TypeScript types</li>
          <li>Commit migration + type updates together</li>
        </ol>
        <DocsCallout variant="success" title="MCP is optional">
          MCP accelerates solo development but does not replace committed migrations.
          Anything applied via MCP must still be saved as a migration file for the team.
        </DocsCallout>
      </DocSection>
    </>
  );
}
