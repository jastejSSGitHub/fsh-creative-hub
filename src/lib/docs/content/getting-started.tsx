import { DocLead, DocSection, DocTable } from "@/components/docs/doc-primitives";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsCodeBlock } from "@/components/docs/docs-code-block";
import { DocsInlineCode } from "@/components/docs/docs-inline-code";
import { DocsScreenshot } from "@/components/docs/docs-media";

export const quickStartToc = [
  { id: "prerequisites", title: "Prerequisites" },
  { id: "clone", title: "Clone & install" },
  { id: "env", title: "Environment" },
  { id: "run", title: "Run locally" },
  { id: "first-login", title: "First login" },
];

export function QuickStartContent() {
  return (
    <>
      <DocLead>
        Get FSH Creative Hub running on your machine in under ten minutes.
        This guide assumes you have access to the Supabase project credentials.
      </DocLead>

      <DocSection id="prerequisites" title="Prerequisites">
        <ul>
          <li>Node.js 20+ and npm</li>
          <li>Git</li>
          <li>Supabase project access (ref: <DocsInlineCode>rnyeonvbnrwephpviyzu</DocsInlineCode>)</li>
          <li>Optional: Google OAuth credentials for production-like sign-in</li>
        </ul>
      </DocSection>

      <DocSection id="clone" title="Clone & install">
        <DocsCodeBlock
          title="terminal"
          code={`git clone https://github.com/jastejSSGitHub/fsh-creative-hub.git
cd fsh-creative-hub
npm install`}
        />
      </DocSection>

      <DocSection id="env" title="Environment">
        <p>
          Copy <DocsInlineCode>.env.example</DocsInlineCode> to{" "}
          <DocsInlineCode>.env.local</DocsInlineCode> and fill in your Supabase
          keys from the dashboard.
        </p>
        <DocsCodeBlock
          title=".env.local"
          language="env"
          code={`cp .env.example .env.local`}
        />
        <DocsCallout variant="warning" title="Never commit secrets">
          <DocsInlineCode>.env.local</DocsInlineCode> and the service role key
          must stay out of git. Vercel env vars are set in the project dashboard.
        </DocsCallout>
      </DocSection>

      <DocSection id="run" title="Run locally">
        <DocsCodeBlock
          code={`npm run dev`}
        />
        <p>
          The app runs at{" "}
          <DocsInlineCode>http://localhost:3010</DocsInlineCode> by default.
          Use <DocsInlineCode>npm run dev:3000</DocsInlineCode> for port 3000.
        </p>
        <DocsScreenshot
          src="/docs/screenshots/landing.png"
          alt="FSH Creative Hub landing page"
          caption="Landing page at localhost:3010"
        />
      </DocSection>

      <DocSection id="first-login" title="First login">
        <p>
          For local development, set{" "}
          <DocsInlineCode>DEV_AUTH_BYPASS=true</DocsInlineCode> and use{" "}
          <strong>Skip login (dev)</strong> on the login page. In production,
          use Google OAuth.
        </p>
        <DocsCallout variant="success" title="You're in">
          After login you land on <DocsInlineCode>/projects</DocsInlineCode> —
          the main hub grid.
        </DocsCallout>
      </DocSection>
    </>
  );
}

export const environmentToc = [
  { id: "required", title: "Required variables" },
  { id: "optional", title: "Optional & server-only" },
  { id: "vercel", title: "Vercel production" },
];

export function EnvironmentContent() {
  return (
    <>
      <DocLead>
        All configuration flows through environment variables. Public keys are
        prefixed with <DocsInlineCode>NEXT_PUBLIC_</DocsInlineCode>.
      </DocLead>

      <DocSection id="required" title="Required variables">
        <DocTable
          headers={["Variable", "Purpose"]}
          rows={[
            ["NEXT_PUBLIC_SUPABASE_URL", "Supabase API URL"],
            ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "Browser-safe anon key for auth & queries"],
            ["NEXT_PUBLIC_SITE_URL", "OAuth redirect base (no trailing slash)"],
          ]}
        />
      </DocSection>

      <DocSection id="optional" title="Optional & server-only">
        <DocTable
          headers={["Variable", "Purpose"]}
          rows={[
            ["DEV_AUTH_BYPASS", "Local only — enables skip login on /login"],
            ["SUPABASE_SERVICE_ROLE_KEY", "Server-only admin client (invites, dev bypass)"],
            ["E2E_TEST_SECRET", "Playwright e2e sign-in route"],
            ["E2E_TEST_PASSWORD", "Playwright test user password"],
          ]}
        />
        <DocsCallout variant="danger" title="Service role key">
          Never expose <DocsInlineCode>SUPABASE_SERVICE_ROLE_KEY</DocsInlineCode>{" "}
          to the client. It bypasses Row Level Security.
        </DocsCallout>
      </DocSection>

      <DocSection id="vercel" title="Vercel production">
        <DocsCodeBlock
          code={`NEXT_PUBLIC_SITE_URL=https://fsh-creative-hub.vercel.app
# Do NOT set DEV_AUTH_BYPASS in production`}
        />
      </DocSection>
    </>
  );
}

export const localAuthToc = [
  { id: "dev-bypass", title: "Dev bypass" },
  { id: "google", title: "Google OAuth" },
  { id: "middleware", title: "Middleware guards" },
];

export function LocalAuthContent() {
  return (
    <>
      <DocLead>
        Authentication is handled by Supabase Auth with session cookies refreshed
        in Next.js middleware on every request.
      </DocLead>

      <DocSection id="dev-bypass" title="Dev bypass">
        <p>
          When <DocsInlineCode>DEV_AUTH_BYPASS=true</DocsInlineCode>, the login
          page shows a skip button that creates a session via{" "}
          <DocsInlineCode>/auth/dev-bypass</DocsInlineCode>.
        </p>
        <DocsCallout variant="warning">
          This route must never be enabled in production.
        </DocsCallout>
      </DocSection>

      <DocSection id="google" title="Google OAuth">
        <p>Configure in Supabase → Authentication → Providers → Google.</p>
        <p>Redirect URLs must include:</p>
        <DocsCodeBlock
          code={`http://localhost:3010/auth/callback
https://fsh-creative-hub.vercel.app/auth/callback`}
        />
        <DocsScreenshot
          src="/docs/screenshots/login.png"
          alt="Login page with Google sign-in"
          caption="Login page — Google OAuth and dev skip"
        />
      </DocSection>

      <DocSection id="middleware" title="Middleware guards">
        <p>Public routes (no session required):</p>
        <ul>
          <li><DocsInlineCode>/</DocsInlineCode> and <DocsInlineCode>/landing</DocsInlineCode></li>
          <li><DocsInlineCode>/login</DocsInlineCode> and <DocsInlineCode>/auth/*</DocsInlineCode></li>
          <li><DocsInlineCode>/share/[token]</DocsInlineCode></li>
          <li><DocsInlineCode>/docs</DocsInlineCode> (this documentation)</li>
        </ul>
        <p>All other routes redirect unauthenticated users to login with a <DocsInlineCode>next</DocsInlineCode> param.</p>
      </DocSection>
    </>
  );
}

export const projectStructureToc = [
  { id: "top-level", title: "Top-level layout" },
  { id: "app-router", title: "App Router" },
  { id: "lib", title: "lib/ modules" },
  { id: "components", title: "components/" },
];

export function ProjectStructureContent() {
  return (
    <>
      <DocLead>
        Creative Hub is a single Next.js 16 app — no separate backend service.
        Business logic lives in Server Components, Server Actions, and a few API routes.
      </DocLead>

      <DocSection id="top-level" title="Top-level layout">
        <DocsCodeBlock
          language="text"
          code={`fsh-creative-hub/
├── src/app/           # Routes & API
├── src/components/    # UI (hub/, landing/, docs/, …)
├── src/lib/           # Server actions, queries, Supabase
├── supabase/migrations/
├── scripts/           # Seed & migrate utilities
├── e2e/               # Playwright tests
└── PRD and MD files/  # Product specs (linked from docs)`}
        />
      </DocSection>

      <DocSection id="app-router" title="App Router">
        <DocTable
          headers={["Path", "Purpose"]}
          rows={[
            ["/", "Public landing page"],
            ["/login", "Auth entry"],
            ["/projects", "Project grid (hub home)"],
            ["/tasks/*", "Task views (Today, Upcoming, Inbox, labels)"],
            ["/for-you", "Inbox / triage feed"],
            ["/projects/[id]/*", "Project workspace, boards, canvas, docs"],
            ["/share/[token]", "Public view-only links"],
            ["/docs", "This documentation"],
          ]}
        />
      </DocSection>

      <DocSection id="lib" title="lib/ modules">
        <ul>
          <li><DocsInlineCode>lib/supabase/</DocsInlineCode> — browser, server, middleware, admin clients</li>
          <li><DocsInlineCode>lib/projects/</DocsInlineCode> — project CRUD & members</li>
          <li><DocsInlineCode>lib/workspace/</DocsInlineCode> — assets, comments, votes</li>
          <li><DocsInlineCode>lib/tasks/</DocsInlineCode> — task system</li>
          <li><DocsInlineCode>lib/inbox/</DocsInlineCode> — For You feed</li>
          <li><DocsInlineCode>lib/search/</DocsInlineCode> — global search</li>
          <li><DocsInlineCode>lib/routes.ts</DocsInlineCode> — canonical path helpers</li>
        </ul>
      </DocSection>

      <DocSection id="components" title="components/">
        <ul>
          <li><DocsInlineCode>hub/</DocsInlineCode> — authenticated shell (header, nav, search)</li>
          <li><DocsInlineCode>landing/</DocsInlineCode> — marketing page</li>
          <li><DocsInlineCode>workspace/</DocsInlineCode> — asset overlay, presentation</li>
          <li><DocsInlineCode>project-files/</DocsInlineCode> — project home, boards</li>
          <li><DocsInlineCode>docs/</DocsInlineCode> — documentation UI</li>
        </ul>
      </DocSection>
    </>
  );
}
