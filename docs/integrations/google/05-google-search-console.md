# Google Search Console API — Setup Guide

> **Last Verified:** 2025-09-01  
> **Verified Against:** https://developers.google.com/webmaster-tools/search-console-api-original  
> **Status:** CURRENT  
> **API:** Search Console API v1  
> **Prerequisite:** [`02-google-oauth.md`](./02-google-oauth.md)

---

## Purpose

Connect Google Search Console to Teameit to display organic search performance data — keywords, clicks, impressions, CTR, and average position — in the Teameit SEO Dashboard.

---

## Prerequisites

| Requirement | Description |
|-------------|-------------|
| Google Cloud Project | ✅ |
| Google Search Console API enabled | ✅ Enable in Cloud Console |
| Website verified in Search Console | ✅ At https://search.google.com/search-console/ |
| Access to property | ✅ Verified Owner or restricted user |

---

## Step 1: Enable Google Search Console API

**WHERE:** Cloud Console → APIs & Services → Library → "Google Search Console API"  
**WHAT TO DO:** Click Enable

---

## Step 2: Verify Website in Search Console

**WHERE:** https://search.google.com/search-console/  
**WHAT TO DO:**
1. Click "Add property"
2. Choose property type:
   - **Domain** (covers all protocols + subdomains) — recommended
   - **URL prefix** (specific URL prefix)
3. Verify ownership via:
   - DNS TXT record (for Domain property)
   - HTML tag on homepage
   - Google Analytics (if already connected)
   - Google Tag Manager

---

## Step 3: OAuth Scope

```typescript
scope: [
  'openid', 'email', 'profile',
  'https://www.googleapis.com/auth/webmasters.readonly'
]
```

This scope is **non-sensitive** — no App Review required.

---

## Step 4: List Properties (Sites)

```typescript
GET https://www.googleapis.com/webmasters/v3/sites
Authorization: Bearer <access_token>
```

Response:
```json
{
  "siteEntry": [
    {
      "siteUrl": "https://www.example.com/",
      "permissionLevel": "siteOwner"
    },
    {
      "siteUrl": "sc-domain:example.com",
      "permissionLevel": "siteOwner"
    }
  ]
}
```

---

## Step 5: Fetch Search Analytics Data

```typescript
POST https://www.googleapis.com/webmasters/v3/sites/<siteUrl>/searchAnalytics/query
Authorization: Bearer <access_token>

{
  "startDate": "2025-08-01",
  "endDate": "2025-08-31",
  "dimensions": ["query", "page", "country", "device"],
  "rowLimit": 100,
  "startRow": 0,
  "type": "web"
}
```

**Metrics returned:**
- `clicks` — Total organic clicks
- `impressions` — Times appeared in search results
- `ctr` — Click-through rate (clicks/impressions)
- `position` — Average position in search results

---

## Key Reports for Teameit SEO Dashboard

### Top Keywords (last 28 days)
```json
{
  "dimensions": ["query"],
  "startDate": "28daysAgo",
  "endDate": "today",
  "rowLimit": 25
}
```

### Top Pages
```json
{
  "dimensions": ["page"],
  "startDate": "28daysAgo",
  "endDate": "today"
}
```

### Performance Over Time
```json
{
  "dimensions": ["date"],
  "startDate": "90daysAgo",
  "endDate": "today"
}
```

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
├── provider: 'search-console'
├── tenant_id

integration_credentials
├── access_token / refresh_token
├── external_account_id: <SITE_URL>  (e.g., "https://example.com/")
```

---

## Data Freshness

> [!NOTE]
> Search Console data has a **2–3 day delay**. Data from the last 3 days may be incomplete or not yet available. Always use `endDate` of 3 days ago for complete data.

---

## Troubleshooting

### Problem: Site not appearing in property list
**Cause:** Website is not verified in Search Console, or the user doesn't have access  
**Resolution:** Verify the website at https://search.google.com/search-console/

### Problem: No data returned from API
**Cause:** New site with no indexed pages, or date range too recent (< 3 days old)  
**Resolution:** Check that the site has traffic data in the Search Console UI first

---

## Official Documentation

- Search Console API: https://developers.google.com/webmaster-tools/search-console-api-original
- Search Analytics Reference: https://developers.google.com/webmaster-tools/v1/searchanalytics

---

## Next Step

→ [`06-google-business-profile.md`](./06-google-business-profile.md) — Google Business Profile
