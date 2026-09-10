# TEAMeIT marketing site

Public SaaS marketing and legal pages for TEAMeIT. Deploy this app on HTTPS (for example Vercel) as the company website. Keep the authenticated product on `NEXT_PUBLIC_APP_URL`.

## Local development

```bash
cd apps/marketing
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000.

## Environment

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical public origin, e.g. `https://teameit.com` |
| `NEXT_PUBLIC_APP_URL` | Product origin for Login / Sign up, e.g. `https://app.teameit.com` |
| `CONTACT_WEBHOOK_URL` | Optional server-only webhook for contact and deletion forms |

Do not put API keys, OAuth secrets, access tokens, or Supabase service-role keys in this frontend.

## Meta data deletion URL

Configure Meta with:

`https://<your-domain>/data-deletion`

Privacy, Terms, Cookies, and Data Deletion are public routes and do not require login.
