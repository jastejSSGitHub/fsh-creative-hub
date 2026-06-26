# Supabase migrations — FSH Creative Hub

Project ref: `rnyeonvbnrwephpviyzu`  
Dashboard: https://supabase.com/dashboard/project/rnyeonvbnrwephpviyzu

## Apply migrations

### Option A — Supabase SQL Editor (manual)

1. Open **SQL Editor** in the dashboard.
2. Paste the contents of `001_hub_schema.sql`.
3. Run the script.

### Option B — Supabase CLI

```bash
supabase link --project-ref rnyeonvbnrwephpviyzu
supabase db push
```

## After migration — Auth settings

In **Authentication → URL configuration**:

| Setting | Local | Production |
|---|---|---|
| Site URL | `http://localhost:3010` | Your Vercel URL |
| Redirect URLs | `http://localhost:3010/auth/callback` | `https://YOUR_VERCEL_URL/auth/callback` |

Also set `NEXT_PUBLIC_SITE_URL` in Vercel env vars to your production URL.

Enable providers under **Authentication → Providers**:

- **Email** — enable; turn off “Confirm email” for faster internal onboarding (optional)
- **Google** — add OAuth client ID/secret from Google Cloud Console

### Auth rate limits (magic links only)

Supabase limits how often magic-link emails can be sent (built-in SMTP: ~2/hour project-wide, ~60s between sends per user). **This is not controlled by our app.**

Recommended for the FSH team:

1. **Use Google sign-in** or **email + password** (no email send, no OTP wait)
2. In Supabase: **Authentication → Rate Limits** — raise `OTP` / `Email sent` after custom SMTP is configured
3. Local dev: set `DEV_AUTH_BYPASS=true` in `.env.local` and use **Skip login (dev)**

## Tables created

`hub_profiles`, `hub_projects`, `hub_project_members`, `hub_initiatives`, `hub_assets`, `hub_comments`, `hub_votes`, `hub_ideas`, `hub_idea_votes`, `hub_activity`

Storage bucket: `hub-media` (public read)

Realtime enabled on: `hub_comments`, `hub_votes`
