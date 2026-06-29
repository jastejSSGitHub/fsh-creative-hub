# FSH Creative Hub

Internal creative collaboration for FSH Design — projects, initiatives, assets, review, tasks, and team consensus.

**Live:** [fsh-creative-hub.vercel.app](https://fsh-creative-hub.vercel.app)  
**Documentation:** [/docs](http://localhost:3010/docs) (also linked from the landing page)

## Quick start

```bash
git clone https://github.com/jastejSSGitHub/fsh-creative-hub.git
cd fsh-creative-hub
npm install
cp .env.example .env.local
# Fill in Supabase keys, then:
npm run dev
```

Open [http://localhost:3010](http://localhost:3010). For local dev, set `DEV_AUTH_BYPASS=true` and use **Skip login** on `/login`.

## Documentation

Full technical documentation for the dev team lives at **`/docs`**:

- Getting started (env, auth, project structure)
- Architecture (routes, server actions, design system)
- Supabase (migrations, tables, storage)
- Feature guides (projects, review, tasks, For You, …)
- Operations (deploy, scripts, troubleshooting)

## Stack

Next.js 16 · React 19 · Supabase · Tailwind v4 · Vercel

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server on port 3010 |
| `npm run validate` | Typecheck + build |
| `npm run test:e2e` | Playwright tests |

See [docs/operations/scripts](/docs/operations/scripts) for seed and migration utilities.

## Product specs

Product requirements and roadmap: `PRD and MD files/`
