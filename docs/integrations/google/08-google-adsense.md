# Google AdSense API — Setup Guide

> **Last Verified:** 2025-09-01  
> **Verified Against:** https://developers.google.com/adsense/management/  
> **Status:** CURRENT  
> **API:** AdSense Management API v2  
> **Prerequisite:** [`02-google-oauth.md`](./02-google-oauth.md)

---

## Purpose

Connect Google AdSense to Teameit to display revenue, RPM, impressions, and click data in the Teameit Analytics Dashboard.

---

## Prerequisites

| Requirement | Description |
|-------------|-------------|
| Google Cloud Project | ✅ |
| AdSense Management API enabled | ✅ Enable in Cloud Console |
| Google AdSense Account | ✅ Must have an approved, active AdSense account |
| Account type | ✅ Publisher account (not a manager) |

---

## Step 1: Enable AdSense Management API

**WHERE:** Cloud Console → APIs & Services → Library → "AdSense Management API"  
**WHAT TO DO:** Click Enable

---

## Step 2: OAuth Scope

```typescript
scope: [
  'openid', 'email', 'profile',
  'https://www.googleapis.com/auth/adsense.readonly'
]
```

This scope is **non-sensitive** — no App Review required.

---

## Step 3: List AdSense Accounts

```typescript
GET https://adsense.googleapis.com/v2/accounts
Authorization: Bearer <access_token>
```

Returns a list of accessible AdSense accounts.

---

## Step 4: Fetch Revenue Reports

```typescript
GET https://adsense.googleapis.com/v2/{account=accounts/*}/reports:generate
  ?dateRange=LAST_30_DAYS
  &metrics=ESTIMATED_EARNINGS&metrics=IMPRESSIONS&metrics=CLICKS&metrics=COST_PER_CLICK&metrics=IMPRESSIONS_RPM&metrics=PAGE_VIEWS
  &dimensions=DATE
Authorization: Bearer <access_token>
```

**Key Metrics:**
- `ESTIMATED_EARNINGS` — Revenue
- `IMPRESSIONS` — Ad impressions
- `CLICKS` — Ad clicks
- `COST_PER_CLICK` — CPC
- `IMPRESSIONS_RPM` — RPM (revenue per 1000 impressions)
- `PAGE_VIEWS` — Page views

---

## Teameit Environment Variables

```env
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>
GOOGLE_REDIRECT_URI=https://api.<your-domain>/api/v1/integrations/google/oauth/callback
```

---

## Official Documentation

- AdSense Management API: https://developers.google.com/adsense/management/
- Reports API: https://developers.google.com/adsense/management/reference/rest/v2/accounts.reports/generate
- Metrics Reference: https://developers.google.com/adsense/management/metrics-dimensions

---

## Next Step

→ [`09-google-webhooks-and-notifications.md`](./09-google-webhooks-and-notifications.md)
