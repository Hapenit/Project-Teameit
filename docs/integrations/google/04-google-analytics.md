# Google Analytics (GA4) — Setup Guide

> **Last Verified:** 2025-09-01  
> **Verified Against:** https://developers.google.com/analytics/devguides/reporting/data/v1  
> **Status:** CURRENT  
> **API:** Google Analytics Data API v1 (GA4 only)  
> **Prerequisite:** [`02-google-oauth.md`](./02-google-oauth.md)

---

## Purpose

Connect Google Analytics 4 (GA4) to Teameit to display website traffic, session, conversion, and acquisition data in the Teameit Analytics Dashboard.

> [!NOTE]
> This guide covers **GA4 only**. Universal Analytics (UA) was deprecated in July 2023 and is no longer supported.

---

## Prerequisites

| Requirement | Description |
|-------------|-------------|
| Google Cloud Project | ✅ |
| Google Analytics Data API enabled | ✅ Enable in Cloud Console |
| GA4 Property | ✅ Must have a GA4 property at analytics.google.com |
| Access to GA4 Property | ✅ Viewer or higher access |

---

## Step 1: Enable Google Analytics Data API

**WHERE:** Cloud Console → APIs & Services → Library → "Google Analytics Data API"  
**WHAT TO DO:** Click Enable

---

## Step 2: OAuth Scope

```typescript
scope: [
  'openid', 'email', 'profile',
  'https://www.googleapis.com/auth/analytics.readonly'
]
```

This scope is **non-sensitive** — no App Review required.

---

## Step 3: List GA4 Properties

After OAuth, discover the user's GA4 properties:

```typescript
import { BetaAnalyticsDataClient } from '@google-analytics/data';

// List accessible accounts
GET https://analyticsadmin.googleapis.com/v1alpha/accounts
Authorization: Bearer <token>

// List properties for an account
GET https://analyticsadmin.googleapis.com/v1alpha/properties?filter=parent:accounts/<ACCOUNT_ID>
Authorization: Bearer <token>
```

> [!NOTE]
> You need the **Analytics Admin API** (separate from the Data API) to list accounts and properties. Enable both APIs.

---

## Step 4: Query GA4 Data

```typescript
const { BetaAnalyticsDataClient } = require('@google-analytics/data');

const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials: { access_token: userAccessToken }
});

const [response] = await analyticsDataClient.runReport({
  property: `properties/${propertyId}`,
  dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
  dimensions: [{ name: 'date' }],
  metrics: [
    { name: 'activeUsers' },
    { name: 'newUsers' },
    { name: 'sessions' },
    { name: 'screenPageViews' },
    { name: 'bounceRate' },
    { name: 'conversions' }
  ]
});
```

---

## Key Metrics

| Metric | GA4 API Name | Description |
|--------|-------------|-------------|
| Active Users | `activeUsers` | Users who visited in period |
| New Users | `newUsers` | First-time visitors |
| Sessions | `sessions` | Total sessions |
| Page Views | `screenPageViews` | Total page views |
| Bounce Rate | `bounceRate` | % of single-page sessions |
| Conversions | `conversions` | Goal completions |
| Avg Engagement Time | `averageSessionDuration` | Time per session |

---

## Teameit Environment Variables

```env
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>
GOOGLE_REDIRECT_URI=https://api.<your-domain>/api/v1/integrations/google/oauth/callback
```

---

## Database Mapping

```
integrations
├── provider: 'google-analytics'
├── tenant_id

integration_credentials
├── access_token / refresh_token
├── external_account_id: <GA4_PROPERTY_ID>  (e.g., "properties/123456789")
```

---

## Official Documentation

- GA4 Data API: https://developers.google.com/analytics/devguides/reporting/data/v1
- Analytics Admin API: https://developers.google.com/analytics/devguides/config/admin/v1
- Metrics & Dimensions: https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema

---

## Next Step

→ [`05-google-search-console.md`](./05-google-search-console.md)
