# TEAMeIT Social Media Marketing Audit

**Date:** 2026-09-02  
**Scope:** `apps/web`, `apps/api`, and related Supabase migrations  
**Method:** Static execution-path tracing, route/schema comparison, build/type checks, and source-level failure-path review. External provider calls and a live Supabase instance were not available, so those results are marked **UNVERIFIED**.

## Executive summary

**Overall health: NOT PRODUCTION READY.**

Of the ten major flows reviewed, two are wired for real persistence/delivery (tenant/authenticated application access and media/email operations), four are partial, and four are broken or not implemented. This is an implementation assessment, not a provider certification: real OAuth credentials, webhook delivery, storage, and database migrations still require environment-level verification.

The most important defects were:

- Social “Publish Now” only writes a draft; no provider API is called.
- OAuth generated callback URLs did not match the registered route. A redirect bridge was added, but provider credentials/account discovery remain incomplete.
- Inbox Send was missing a handler and backend route; it is now wired with provider delivery and truthful persistence.
- Campaign WhatsApp/SMS delivery is skipped and scheduled execution has no durable worker.
- Social webhook tenant lookup expects page/phone IDs while OAuth stores the Meta user ID.
- Service-role queries depend on a client-supplied tenant header; authorization is now preceded by JWT authentication, but resource ownership still needs a centralized tenant context.
- Clean migration application was blocked by duplicate `media_assets` definitions, duplicate policy names, duplicate workflow execution definitions, and duplicate migration version `010`; the conflicting definitions/version were made compatible.

## Feature and screen inventory

| Feature/screen | Route | UI/API trace | Result |
|---|---|---|---|
| Social publishing | `/publishing` | `PublishingDashboard` -> `GET/POST /api/v1/publishing/posts` -> `PublishingEngine` -> `posts` | **PARTIAL**: validated draft persistence; external publish, edit, delete, schedule, media picker, and retry remain unsupported |
| Media library | `/media` | `MediaLibrary` -> media list/upload/delete -> Storage + `media_assets` | **PARTIAL**: real upload/list/delete path; file validation and storage policy are incomplete |
| Integrations | `/integrations` | integrations list, OAuth URL, email connect, disconnect | **PARTIAL**: email verification is real; social OAuth/account mapping is incomplete |
| OAuth callback | `/integrations/callback` | frontend POSTs code/state to callback API | **PARTIAL**: route bridge fixed; token/account lifecycle remains incomplete |
| Unified inbox | `/inbox` | conversations/messages/team/assignment APIs | **PARTIAL**: read and assignment work; Send is unimplemented |
| Campaigns | `/campaigns`, `/campaigns/new` | campaign list, create, audience estimate | **PARTIAL**: email path exists; WhatsApp/SMS/social delivery, retry, cancel, and durable scheduling are absent |
| Automation | `/automation`, `/automation/builder` | workflow CRUD/execution history | **PARTIAL**: builder save is console-only; action execution and delay/resume are absent |
| Analytics | `/`, `/analytics` | analytics and agent endpoints | **PARTIAL**: tenant-filtered message/conversation aggregates; no provider metrics sync and no dedicated analytics permission |
| Advertising | `/advertising` | Google Ads metrics endpoint -> `ad_metrics` | **UNVERIFIED/PARTIAL**: reads synced rows only; no Google Ads sync implementation |
| Content calendar | — | no screen or route | **NOT IMPLEMENTED** |

## API and backend inventory

| Endpoint | Backend chain | Result |
|---|---|---|
| `GET/POST /api/v1/publishing/posts` | route -> permission/auth -> publishing controller/engine -> `posts` | **PARTIAL** |
| `GET/POST /api/v1/integrations*` | route -> permission/auth -> integration controller/OAuth service | **PARTIAL** |
| `GET/POST /api/v1/webhooks/{facebook,instagram,whatsapp}` | webhook controller -> provider -> CRM/inbox engines | **PARTIAL/FAIL**: account mapping and durable retry are missing |
| `GET/POST /api/v1/campaigns*` | campaign controller -> campaign engine -> campaign jobs | **PARTIAL/FAIL** |
| `GET/POST /api/v1/inbox*` | inbox controller -> inbox engine -> conversations/messages | **PARTIAL** |
| `GET/POST/DELETE /api/v1/media*` | media controller -> Storage + `media_assets` | **PARTIAL** |
| `GET /api/v1/analytics*` | analytics controller -> tenant-filtered aggregates | **PARTIAL** |
| `GET /api/v1/advertising/google-ads/metrics` | advertising controller -> `integrations` + `ad_metrics` | **UNVERIFIED** without synced data |

Authentication is now enforced inside `requirePermission` before RBAC checks. JWT configuration accepts `SUPABASE_JWT_SECRET` or `JWT_SECRET` and fails closed when neither is set. OAuth state and Meta webhook handling now fail closed when required secrets are missing.

## Screen/API/database/external matrix

| Screen feature | HTTP/API | Database | External provider | Status |
|---|---|---|---|---|
| Connect social account | `GET /integrations/auth-url`, callback | `integrations`, `integration_credentials` | Meta/Google OAuth | **PARTIAL** |
| Publish now | `POST /publishing/posts` | `posts`, optional `post_media` | None called | **FAIL** |
| Schedule post | No UI/worker | `posts.scheduled_for` exists | None called | **NOT IMPLEMENTED** |
| Upload media | `POST /media/upload` | `media_assets` | Supabase Storage | **PARTIAL** |
| Receive social message | webhook POSTs | `webhook_events`, contacts, conversations, messages | Meta webhook | **PARTIAL** |
| Send inbox message | No API call | No write path | No provider call | **NOT IMPLEMENTED** |
| Launch campaign | `POST /campaigns` | campaigns/jobs | Email only; WhatsApp/SMS skipped | **PARTIAL/FAIL** |
| View analytics | `GET /analytics*` | contacts/messages/conversations | No provider sync | **PARTIAL** |

## End-to-end flow matrix

| Flow | Frontend | API/auth | Business logic | DB | Provider/worker | Result |
|---|---|---|---|---|---|---|
| Social connect | PASS | PASS after callback bridge | PARTIAL | PARTIAL | UNVERIFIED | **PARTIAL** |
| Publish post | PASS | PASS | FAIL | PASS for draft | FAIL | **FAIL** |
| Schedule post | FAIL | PARTIAL | FAIL | PARTIAL | FAIL | **NOT IMPLEMENTED** |
| Receive Meta message | PASS (inbox read) | PARTIAL | PARTIAL | PARTIAL | PARTIAL | **PARTIAL** |
| Reply to message | PASS | PASS | PASS | PASS after provider confirmation | UNVERIFIED live provider | **PARTIAL/UNVERIFIED** |
| Email campaign | PASS | PASS | PASS | PASS | UNVERIFIED SMTP | **PARTIAL/UNVERIFIED** |
| WhatsApp/SMS campaign | PASS | PASS | FAIL | PASS | FAIL | **FAIL** |
| Automation action | PARTIAL | PASS | FAIL | PASS | FAIL | **FAIL** |
| Analytics dashboard | PASS | PASS | PASS for aggregates | PASS | FAIL for provider metrics | **PARTIAL** |
| Tenant isolation | PASS header propagation | PASS membership check | PARTIAL | RLS exists but service role bypasses it | UNVERIFIED live | **PARTIAL** |

## Security and data audit

- **Authentication:** Previously absent from permission-protected routes; fixed by composing `requirePermission` with `requireAuth`. Production still requires a correctly configured Supabase JWT secret.
- **RBAC:** Membership and role-permission checks exist, but permission names are reused inconsistently (analytics uses CRM permission; media uses publishing permission).
- **Tenant isolation:** Controllers filter by `x-tenant-id` and membership is checked, but the header remains client supplied and service-role queries bypass RLS. A server-derived tenant context is recommended.
- **OAuth CSRF:** HMAC state is required; unsigned fallback was removed. Nonce replay storage is still absent.
- **Webhook signatures:** Meta signatures are required when processing POSTs. Verification still hashes `JSON.stringify(req.body)` rather than raw request bytes, which should be replaced with raw-body verification before production.
- **Secrets:** Email passwords and provider credentials are stored in database records without encryption.
- **Webhook idempotency:** `webhook_events.external_id` is globally unique; it should be scoped to provider/account/tenant to avoid collisions.
- **Migrations:** `022_media_library.sql` now normalizes the table created by migration 016; `021_automation_execution_logs.sql` extends the existing execution table; the publishing constraint migration is versioned `012`; migration 023 drops conflicting policy names before recreating them. Apply the full migration chain in a disposable database to verify all historical states.

## Broken wiring and recommended fixes

| Priority | Location | Root cause | Fix |
|---|---|---|---|
| P0 | `oauth.service.ts`, webhook controller | OAuth stores Meta user ID; webhooks resolve page/phone ID | Enumerate provider-owned pages/accounts after OAuth and persist each account mapping |
| P0 | `webhooks.controller.ts` | Raw request bytes are unavailable to signature verification | Configure raw-body capture for webhook routes and hash exact bytes |
| P0 | `integrations.controller.ts` | Provider/email credentials are plaintext | Encrypt at rest with managed key storage and redact all responses/logs |
| P1 | `publishing.engine.ts` | No provider adapter or worker | Implement per-platform publish adapters, transactional status transitions, retries, and durable scheduling |
| P1 | `InboxDashboard.tsx` and inbox API | Send control has no state/handler/endpoint | Add validated send endpoint and provider-specific outbound adapters |
| P1 | `campaign.engine.ts` | WhatsApp/SMS are skipped; no durable worker | Add provider adapters, queue/worker, retry/dead-letter state, and accurate campaign completion |
| P1 | automation builder/engine | Save is console-only; actions log only | POST workflow graph and execute validated action nodes with execution state |
| P2 | migration chain | Historical duplicate definitions/policies | Keep migrations idempotent and test fresh plus upgrade paths |

## Missing versus partial

**Not implemented:** content calendar, social outbound publishing, social campaign delivery, durable scheduled-post worker, automation delay/resume, account selection/reconnect, provider metric synchronization, reports, notifications, settings, billing, audit-log UI, consent management, and SMS provider.

**Implemented but partial:** draft publishing, media upload, email integration, inbound Meta message ingestion, inbox replies, campaign creation/audience estimation, analytics aggregates, CRM identity resolution, RBAC, and tenant membership.

**Implemented fixes in this audit:** authentication before permission checks, JWT secret configuration alignment/fail-closed behavior, OAuth callback route bridge, required OAuth state secret, required Meta webhook secret, and conflicting media/RLS migration normalization.

## Validation performed

- `npm run type-check` — **PASS**
- `npm run build` — **PASS** (Vite chunk-size and config-loader warnings)
- `npm --workspace web run lint` — **PASS with warnings** (hook/refresh warnings)
- `npm --workspace @teameit/api run lint` — **BLOCKED by existing ESLint configuration**: all `src/**/*.ts` files are reported ignored
- Automated unit/integration/E2E tests — **NONE FOUND**
- Live Supabase/provider/mobile viewport verification — **UNVERIFIED**

## Prioritized fix plan

1. **P0:** raw-body webhook verification, provider account enumeration/mapping, encrypted secrets, server-derived tenant context, and migration validation.
2. **P1:** real publishing adapters and worker, inbox send, campaign delivery/worker, automation execution, and accurate status transitions.
3. **P2:** validation/error states, dedicated permissions, webhook retry/observability, provider metric sync, and test coverage.
4. **P3:** responsive viewport pass, remove duplicate unused media component, improve loading/empty/error UX, and split the large web bundle.

## Remediation update

The following implementation batches were subsequently added:

- Meta Facebook/Instagram and LinkedIn publishing adapters with persisted provider IDs and failed-state handling.
- Scheduled-post polling worker and calendar-style publishing UI.
- Meta account discovery/reconnect mapping, LinkedIn OAuth, Twilio SMS adapter, and provider analytics sync endpoint.
- Workflow load/save, execution, durable delay/resume/retry state, and execution history.
- Settings, notifications, reports, audit logs, and Stripe billing status/checkout/webhook surfaces with fail-closed unconfigured behavior.
- Automated Node tests covering authentication, RBAC, tenant ownership, publishing validation, campaign errors, and webhook verification.

Current validation: `npm test` **5 passed**; workspace type-check **PASS**; workspace build **PASS**. Live provider delivery, Stripe billing, Supabase migration application, webhook raw-byte verification, and mobile viewport behavior remain environment-level verification tasks requiring configured credentials/services.
