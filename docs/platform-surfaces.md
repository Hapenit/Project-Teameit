# Platform surfaces

The API exposes tenant-scoped administration endpoints under `/api/v1/platform`:

- `GET/PUT /settings` (only tenant owners/admins may update)
- `GET /notifications` and `POST /notifications/:id/read`
- `GET/POST /reports`
- `GET /audit-logs`
- `GET /billing/status` and `POST /billing/checkout`

Every request requires a Supabase bearer token and `x-tenant-id`. The migration
`026_platform_surfaces.sql` enables RLS for all new tables. Apply migrations
with `supabase db push` before using these routes.

Stripe is intentionally opt-in. Without both `STRIPE_SECRET_KEY` and
`STRIPE_WEBHOOK_SECRET`, status is `unconfigured` and checkout returns 503;
the API never reports a successful payment when Stripe is unavailable.
