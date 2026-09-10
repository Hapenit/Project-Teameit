# Google Cloud Project — Setup Guide

> **Last Verified:** 2025-09-01  
> **Verified Against:** https://cloud.google.com/resource-manager/docs/creating-managing-projects  
> **Status:** CURRENT  
> **Console URL:** https://console.cloud.google.com/

---

## Purpose

A Google Cloud Project is the foundation for all Google integrations in Teameit. It:
- Houses all API credentials (OAuth Client IDs and Secrets)
- Controls which Google APIs are enabled
- Manages the OAuth consent screen shown to users
- Provides billing for paid Google APIs

**This must be created FIRST before any Google integration.**

---

## What Teameit Uses This For

All Google integrations share one Google Cloud Project:

| Integration | API Enabled in this Project |
|-------------|---------------------------|
| Google OAuth | Google Auth Platform (all OAuth) |
| Google Analytics | Google Analytics Data API |
| Google Ads | Google Ads API |
| Search Console | Google Search Console API |
| Google Business Profile | My Business Account Management API / My Business Business Information API |
| YouTube | YouTube Data API v3 |
| Google AdSense | AdSense Management API |

---

## Account Prerequisites

| Requirement | Details |
|-------------|---------|
| Google Account | A real Google/Gmail account for the project owner |
| Google Workspace (optional) | Recommended for business use — enables Internal user type |
| Billing Account | Required if using paid APIs (Google Ads API, etc.) |
| Credit Card | Required to create a billing account |

---

## Step 1: Access Google Cloud Console

**WHERE:** https://console.cloud.google.com/  
**WHAT TO DO:** Log in with your Google account (use your business Google Workspace account if available).

---

## Step 2: Create a New Project

**WHERE:** Top navbar → Project selector dropdown → **"New Project"**

**WHAT TO ENTER:**

| Field | Value | Notes |
|-------|-------|-------|
| Project Name | `Teameit` or `Teameit Production` | Human-readable name |
| Organization | Your Google Workspace organization | Optional if no Workspace |
| Location | Your organization folder | Leave as "No organization" if no Workspace |

**Click:** "Create"

**Expected Result:** Project is created and you are switched to its context. You see the project name in the top navbar.

> [!NOTE]
> The Project ID (auto-generated from the name) is permanent and cannot be changed. Note it down.

---

## Step 3: Link a Billing Account

**WHERE:** Billing → Link a billing account  
OR  
Navigation Menu → Billing → Manage Billing Account

**WHAT TO DO:**
1. Click **"Link a billing account"**
2. Select existing account or create new:
   - Add credit/debit card
   - Complete identity verification if prompted

**Why:** Several APIs (Google Ads, GA Data API for large volumes) require billing to be enabled.

> [!NOTE]
> Most development and low-volume usage of Google APIs falls within the free tier. You will not be charged unless you exceed the free tier limits.

---

## Step 4: Enable Required APIs

For each Google integration, the corresponding API must be enabled in this project.

**WHERE:** APIs & Services → Library (search for each API)

Enable the following APIs (in order of Teameit integration):

| API Name | Search Term | Used For |
|----------|-------------|---------|
| Google Analytics Data API | "analytics data" | GA4 dashboard |
| Google Search Console API | "search console" | SEO dashboard |
| My Business Account Management API | "my business account" | GBP account discovery |
| My Business Business Information API | "my business business information" | GBP location data |
| My Business Notifications API | "my business notifications" | GBP notifications |
| YouTube Data API v3 | "youtube data" | YouTube integration |
| AdSense Management API | "adsense management" | AdSense revenue |
| Google Ads API | "google ads api" | Ads dashboard |

**To enable an API:**
1. Click the API name in the Library
2. Click **"Enable"**
3. Wait for the "API enabled" confirmation

---

## Step 5: Configure OAuth Consent Screen

**WHERE:** APIs & Services → OAuth consent screen  
(In newer UI: APIs & Services → Google Auth Platform)

### 5.1 — Select User Type

| User Type | When to Use |
|-----------|------------|
| **Internal** | Available only to users in your Google Workspace org — no review required |
| **External** | Available to any Google user — requires OAuth verification for sensitive scopes |

**For Teameit (SaaS serving multiple tenants):** Select **External**

### 5.2 — Configure App Information

| Field | Value |
|-------|-------|
| App name | `Teameit` |
| User support email | Your support email |
| App logo | Teameit logo (PNG, max 1MB) |
| App domain | `yourdomain.com` |
| Developer contact email | Your developer email |

### 5.3 — Add Authorized Domains

Add:
- `yourdomain.com`
- `api.yourdomain.com`

### 5.4 — Configure Scopes

Click "Add or Remove Scopes" and add scopes for each Google integration (see `02-google-oauth.md` for the full scope list).

**Non-sensitive scopes** (no review needed):
- `openid`, `email`, `profile`
- `analytics.readonly`
- `webmasters.readonly`
- `adsense.readonly`
- `youtube.readonly`

**Sensitive/Restricted scopes** (review required):
- `business.manage` (Google Business Profile)
- `adwords` (Google Ads)
- `youtube.upload`

### 5.5 — Add Test Users

While your app is in **Testing** status, only listed users can authorize.

**WHERE:** OAuth consent screen → Test users → Add Users  
**WHAT TO ADD:** Developer email addresses for testing

---

## Step 6: Create OAuth 2.0 Client ID

**WHERE:** APIs & Services → Credentials → Create Credentials → OAuth client ID

**WHAT TO CONFIGURE:**

| Field | Value |
|-------|-------|
| Application type | **Web application** |
| Name | `Teameit Web Client` |

**Authorized JavaScript origins** (for security):
```
http://localhost:5173
https://yourdomain.com
```

**Authorized redirect URIs:**
```
http://localhost:3001/api/v1/integrations/google/oauth/callback
https://api.<your-domain>/api/v1/integrations/google/oauth/callback
```

**After creating, download the credentials JSON** or copy:
- **Client ID** (ends in `.apps.googleusercontent.com`)
- **Client Secret**

---

## Teameit Environment Variables

```env
# Server-only — NEVER expose to frontend
GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your-client-secret>
GOOGLE_REDIRECT_URI=https://api.<your-domain>/api/v1/integrations/google/oauth/callback
```

| Variable | Visibility | Notes |
|----------|------------|-------|
| `GOOGLE_CLIENT_ID` | Server only (technically public but keep server-side) | Identifies your app |
| `GOOGLE_CLIENT_SECRET` | Server only — SECRET | Never expose |
| `GOOGLE_REDIRECT_URI` | Server only | Must match console exactly |

---

## Verify Project Setup

```
Google Cloud Project Checklist
☐ Google Cloud project created
☐ Billing account linked
☐ Project ID noted
☐ All required APIs enabled
☐ OAuth consent screen configured
☐ App name, logo, support email filled in
☐ Authorized domains added
☐ Required scopes added
☐ OAuth Client ID created (Web application)
☐ Redirect URIs configured (localhost + production)
☐ Client ID and Client Secret copied to .env
☐ Test users added
```

---

## Troubleshooting

### Problem: "This app is blocked" during OAuth
**Cause:** App is in Testing mode and the user attempting to authenticate is not in the Test Users list  
**Resolution:** Add the user's Google email to Test Users, OR publish the app (requires review)

### Problem: API quota exceeded
**Cause:** Free tier limit reached for a specific API  
**Resolution:** Check quotas in APIs & Services → Quotas. Request quota increase or upgrade billing.

### Problem: "Access blocked: Teameit's request is invalid"
**Cause:** Redirect URI in OAuth request does not exactly match the authorized URI in the console  
**Resolution:** Compare character-by-character: protocol, domain, path, no trailing slash

---

## Official Documentation

- Create a project: https://cloud.google.com/resource-manager/docs/creating-managing-projects
- OAuth consent screen: https://developers.google.com/workspace/guides/configure-oauth-consent
- Create credentials: https://developers.google.com/workspace/guides/create-credentials
- Google Cloud Console: https://console.cloud.google.com/

---

## Next Step

→ [`02-google-oauth.md`](./02-google-oauth.md) — Detailed OAuth flow implementation
