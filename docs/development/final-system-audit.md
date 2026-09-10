# Teameit — Full System Audit
**Date:** 2026-09-01  
**Auditor:** Antigravity System Verification  
**Status:** COMPLETE

---

## Executive Summary

The Teameit codebase has a well-structured architectural foundation — the module boundaries, DB schema, RLS policies, provider pattern, and core flow design are correct. However, several **critical defects** exist that prevent the system from functioning as a real product:

- OAuth is entirely simulated (fake tokens, fake accounts)
- Analytics dashboard returns fabricated/random data
- Advertising controller queries a non-existent table and generates fake metrics
- Dashboard home screen is hardcoded static zeros with no API calls
- Tenant creation does not assign an owner role
- Navigation sidebar has broken and duplicate routes
- Automation engine action nodes do not execute any real action
- Publishing engine creates a post record but never calls any provider API
- No Settings, Notifications, Billing, SMS, Invitations, Onboarding UI, or Audit Logs modules
- API URL is hardcoded to `localhost:3001` throughout the frontend
- `dummy_anon_key` fallback in Supabase frontend config
- Messages query in analytics missing `tenant_id` filter (cross-tenant data leakage risk)
- Agent performance `messagesSent` is a randomized mock value
- MediaLibraryDashboard uses `via.placeholder.com` for all image previews
- Meta webhook signature verification not cryptographically implemented

---

## 1. Frontend Audit

### App.tsx
| Issue | Severity | Line |
|-------|----------|------|
| /integrations route registered TWICE | P2 | 76 & 141 |
| DashboardContent shows hardcoded 0s with no real API calls | P1 | 21-35 |
| No /settings, /notifications, /onboarding, /team routes | P1 | — |
| Missing redirect from / when user has no tenant | P1 | 149 |

### DashboardLayout.tsx
| Issue | Severity | Line |
|-------|----------|------|
| /automations nav link labeled "Campaigns" — route does not exist | P2 | 43 |
| "Campaigns" appears twice in sidebar | P2 | 34 & 44 |
| No Settings, Team, Notifications links in nav | P2 | — |

### TenantContext.tsx
| Issue | Severity | Line |
|-------|----------|------|
| API URL hardcoded to http://localhost:3001 | P1 | 47, 76 |
| No environment variable for API base URL | P1 | — |

### config/supabase.ts
| Issue | Severity | Line |
|-------|----------|------|
| Falls back to 'dummy_anon_key' — client initializes silently broken | P1 | 4 |

### MediaLibraryDashboard.tsx
| Issue | Severity | Line |
|-------|----------|------|
| Uses via.placeholder.com external service for all image previews | P3 | 140 |

### Missing Frontend Modules (NOT IMPLEMENTED)
- Settings (no UI, no route)
- Notifications (no UI, no route)
- Team management (no UI, no route)
- User invitations (no UI, no route)
- Onboarding wizard (no UI, no route)
- Billing (no UI, no route)
- Audit logs (no UI, no route)
- SMS (no UI, no route)
- Reports (no dedicated page)
- User profile (no UI)

---

## 2. Backend Audit

### oauth.service.ts — CRITICAL
| Issue | Severity |
|-------|----------|
| OAuth is entirely simulated — generates mock_code_ URLs back to localhost | P0 |
| Uses Math.random() fake access tokens — no real provider token stored | P0 |
| State uses plain base64 JSON — no HMAC signing, vulnerable to CSRF | P0 |
| Stored credentials are plaintext — no encryption | P1 |
| Token expiry set to 1 hour from fake data — no refresh implemented | P1 |

### advertising.controller.ts — CRITICAL
| Issue | Severity | Line |
|-------|----------|------|
| Queries tenant_integrations — TABLE DOES NOT EXIST (should be integrations) | P0 | 10 |
| Generates and inserts fake random metric data into real DB | P0 | 31-55 |

### analytics.controller.ts — CRITICAL
| Issue | Severity | Line |
|-------|----------|------|
| volumeData generated using Math.random() — fabricated chart data | P0 | 54 |
| channelData is hardcoded static (WhatsApp:400, IG:300, FB:100) | P0 | 59-63 |
| totalMessages fallback is hardcoded 1432 | P0 | 71 |
| messages count query missing tenant_id filter — CROSS-TENANT DATA LEAK | P0 | 24-28 |
| Agent performance messagesSent is Math.random() | P1 | 141 |

### tenants.controller.ts
| Issue | Severity | Line |
|-------|----------|------|
| Creates tenant and membership but NEVER assigns an owner role | P0 | 22-31 |
| No user-friendly unique slug validation | P2 | — |
| No default settings record created for tenant | P2 | — |

### automation.engine.ts
| Issue | Severity | Line |
|-------|----------|------|
| actionNode handler only console.logs — never calls any provider | P1 | 58-63 |
| Delay node not handled — no pause/resume mechanism | P1 | — |
| No retry logic if action fails | P1 | — |
| No duplicate trigger prevention | P1 | — |

### publishing.engine.ts
| Issue | Severity | Line |
|-------|----------|------|
| Creates post record but NEVER calls any social media provider API | P1 | 53-56 |
| No publishing worker / scheduler for scheduled posts | P1 | — |

### webhooks.controller.ts
| Issue | Severity | Line |
|-------|----------|------|
| No HMAC-SHA256 signature verification for Meta webhooks | P0 | 15, 73, 124 |

### campaign.engine.ts
| Issue | Severity | Line |
|-------|----------|------|
| SMS/WhatsApp channels not implemented — silently fake setTimeout | P1 | 156-159 |
| external_message_id is fabricated string | P1 | 167 |
| No consent/opt-out check before sending | P1 | — |
| TypeScript error on err.message (needs cast) | P2 | 176 |

### Missing Backend Modules (NOT IMPLEMENTED)
- SMS provider (no module, no routes)
- Notifications (no module, no routes)
- Settings (no module, no routes)
- Billing (no module, no routes)
- Audit logs (no module, no routes)
- Team invitations (no invite/accept endpoints)
- Token refresh logic for OAuth integrations
- Publishing scheduled worker
- Automation delay/resume worker

---

## 3. Database Audit

### RLS Coverage
| Table | RLS | Issue |
|-------|-----|-------|
| users | PASS | OK |
| tenants | PASS | OK |
| tenant_members | PASS | OK |
| contacts | PASS | OK |
| integrations | PASS | OK |
| conversations | PASS | OK |
| messages | PASS | OK |
| campaigns | FAIL | No policies |
| campaign_jobs | FAIL | No RLS |
| posts | FAIL | No RLS |
| workflows | FAIL | No RLS |
| workflow_executions | FAIL | No RLS |
| ad_metrics | FAIL | No RLS |
| media_library | FAIL | No RLS |
| pipelines | FAIL | No RLS |

### Other DB Issues
- Migration numbers 012, 014, 018 missing — suggests deleted/skipped migrations
- integrations table has both a credentials column AND a linked integration_credentials table — inconsistent dual-path

---

## 4. Security Audit

| Issue | Severity |
|-------|----------|
| OAuth state is plain base64 — no signing, CSRF vulnerable | P0 |
| Meta webhook HMAC verification not implemented | P0 |
| Mock tokens stored as real credentials | P0 |
| messages analytics missing tenant_id filter — cross-tenant leak | P0 |
| JWT fallback is well-known local dev default string | P1 |
| Email credentials stored as plaintext JSON in DB | P1 |
| No rate limiting on any API endpoint | P2 |
| CORS configured with app.use(cors()) — accepts all origins | P2 |

---

## 5. Bug Priority Summary

| Priority | Count | Action |
|----------|-------|--------|
| P0 — Critical | 9 | Fix immediately |
| P1 — High | 18 | Fix before launch |
| P2 — Medium | 8 | Fix before launch |
| P3 — Low | 3 | Fix when time allows |
| NOT IMPLEMENTED | 10 | Scope and schedule |

