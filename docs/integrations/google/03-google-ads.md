# Google Ads API — Setup Guide

> **Last Verified:** 2025-09-01  
> **Verified Against:** https://developers.google.com/google-ads/api/docs/start  
> **Status:** CURRENT  
> **API Version:** Google Ads API v17+  
> **Prerequisite:** [`02-google-oauth.md`](./02-google-oauth.md)

---

## Purpose

This guide explains how to connect Google Ads to Teameit, enabling:
- Reading campaign performance metrics (spend, impressions, clicks, CTR, CPC, conversions, ROAS)
- Displaying ad insights in the Teameit Analytics Dashboard

---

## Critical Distinction: Google Ads API Has Multiple Credential Layers

> [!IMPORTANT]
> Google Ads API requires **three separate credentials**, NOT just OAuth:
>
> 1. **Google Cloud OAuth Client** (Client ID + Secret) — standard OAuth
> 2. **Developer Token** — specific to Google Ads API access
> 3. **Customer ID** — identifies the specific Google Ads account

Do NOT confuse these. All three are required.

---

## Account Hierarchy

```
Google Account (developer's account)
         ↓
    Google Cloud Project (OAuth credentials)
         ↓
    Google Ads Developer Token (from ads.google.com)
         ↓
    Google Ads Account (Customer ID: XXX-XXX-XXXX)
         ↓
    Manager Account (MCC) — optional
         ↓
    Sub-accounts (for agency clients)
```

---

## Step 1: Enable Google Ads API in Cloud Console

**WHERE:** Google Cloud Console → APIs & Services → Library → Search "Google Ads API"  
**WHAT TO DO:** Click "Enable"

---

## Step 2: Apply for a Google Ads Developer Token

The **Developer Token** is different from OAuth. It identifies your application to the Google Ads API.

**WHERE:** Google Ads → Tools & Settings → API Center  
**DIRECT URL:** https://ads.google.com/aw/apicenter

**WHAT TO DO:**
1. Log in to the **Manager Account (MCC)** — you must apply from an MCC, not a regular ads account
2. Navigate to Tools → API Center
3. Read and accept the Terms and Conditions
4. Note your **Developer Token** (starts with a long alphanumeric string)

### Developer Token Access Levels

| Level | Description |
|-------|-------------|
| **Test Account Access** | Can only access test accounts; free and immediate |
| **Basic Access** | Up to 15,000 operations/day; requires approval (1–5 days) |
| **Standard Access** | Higher limits; requires additional review |

**For development:** Use Test Account access with a Google Ads test account  
**For production:** Apply for Basic or Standard access

**To apply for Basic Access:**  
API Center → Apply for Basic Access → Complete the questionnaire → Submit

---

## Step 3: Create a Google Ads Test Account (For Development)

**WHERE:** Google Ads → (Switch to Test Account mode)

Or create a test account via the API:
```
POST https://googleads.googleapis.com/v17/customers/<manager_id>/customers:mutate
```

Test accounts are completely separate from live accounts and don't affect real campaigns.

---

## Step 4: OAuth with `adwords` Scope

When the user connects Google Ads in Teameit:

```typescript
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: [
    'openid',
    'email',
    'profile',
    'https://www.googleapis.com/auth/adwords'
  ],
  state: encryptedState
});
```

---

## Step 5: Configure Google Ads Client

Install the Google Ads API client library:

```bash
npm install google-ads-api
```

Initialize with all three credentials:

```typescript
import { GoogleAdsApi } from 'google-ads-api';

const googleAdsClient = new GoogleAdsApi({
  client_id: process.env.GOOGLE_CLIENT_ID!,
  client_secret: process.env.GOOGLE_CLIENT_SECRET!,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
});

// Create a customer client for a specific account
const customer = googleAdsClient.Customer({
  customer_id: '<CUSTOMER_ID>',
  refresh_token: credentials.refresh_token
});
```

---

## Step 6: Fetch Accessible Accounts

After OAuth, list all Google Ads accounts the user has access to:

```typescript
// List accessible customers
const response = await googleAdsClient.listAccessibleCustomers({
  refresh_token: tokens.refresh_token
});
// Returns list of Customer IDs the user can access
```

Then fetch account details:
```typescript
const customer = googleAdsClient.Customer({ customer_id: customerId, refresh_token });
const account = await customer.query(`
  SELECT customer.id, customer.descriptive_name, customer.currency_code
  FROM customer
  WHERE customer.id = ${customerId}
  LIMIT 1
`);
```

---

## Step 7: Fetch Campaign Metrics (GAQL Query)

Google Ads API uses **GAQL (Google Ads Query Language)** — a SQL-like syntax.

```typescript
const campaigns = await customer.query(`
  SELECT
    campaign.id,
    campaign.name,
    campaign.status,
    metrics.cost_micros,
    metrics.impressions,
    metrics.clicks,
    metrics.ctr,
    metrics.average_cpc,
    metrics.conversions,
    metrics.conversions_value
  FROM campaign
  WHERE segments.date DURING LAST_30_DAYS
    AND campaign.status != 'REMOVED'
  ORDER BY metrics.cost_micros DESC
`);
```

> [!NOTE]
> `cost_micros` is the spend in micro-units (divide by 1,000,000 to get the actual currency value).

---

## Key Metrics

| Metric | GAQL Field | Description |
|--------|-----------|-------------|
| Spend | `metrics.cost_micros / 1000000` | Total spend |
| Impressions | `metrics.impressions` | Ad impressions |
| Clicks | `metrics.clicks` | Ad clicks |
| CTR | `metrics.ctr` | Click-through rate |
| Avg CPC | `metrics.average_cpc / 1000000` | Cost per click |
| Conversions | `metrics.conversions` | Conversion events |
| ROAS | `metrics.conversions_value / (cost_micros/1e6)` | Computed value |

---

## Teameit Environment Variables

```env
# Server-only
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>
GOOGLE_REDIRECT_URI=https://api.<your-domain>/api/v1/integrations/google/oauth/callback

# Google Ads specific
GOOGLE_ADS_DEVELOPER_TOKEN=<your-developer-token>
```

| Variable | Visibility | Notes |
|----------|------------|-------|
| `GOOGLE_ADS_DEVELOPER_TOKEN` | Server only — SECRET | Apply from Google Ads API Center |

---

## Database Mapping

```
integrations
├── provider: 'google-ads'
├── tenant_id

integration_credentials
├── access_token (encrypted)
├── refresh_token (encrypted)
├── external_account_id: <CUSTOMER_ID>

ad_metrics (synced daily)
├── platform: 'google'
├── campaign_id
├── campaign_name
├── spend
├── impressions
├── clicks
├── ctr
├── conversions
├── date_start / date_end
```

---

## Manager Account (MCC) Support

If a tenant manages multiple Google Ads accounts via a Manager Account:

```typescript
// Login-customer-id header enables MCC traversal
const customer = googleAdsClient.Customer({
  customer_id: '<SUB_ACCOUNT_ID>',
  login_customer_id: '<MANAGER_ACCOUNT_ID>',  // The MCC
  refresh_token: credentials.refresh_token
});
```

---

## Production Requirements

| Requirement | Details |
|-------------|---------|
| Developer Token Basic Access | Required; submit at API Center |
| OAuth Verification | Required for `adwords` scope (sensitive) |
| Privacy Policy | Must describe ad data usage |

---

## Testing Checklist

```
Google Ads Integration Test
☐ Google Ads API enabled in Cloud Console
☐ Developer token obtained from API Center
☐ Test account created
☐ OAuth flow completes with adwords scope
☐ Customer ID discovered and listed
☐ Campaign metrics fetched successfully
☐ Data appears in Teameit Analytics Dashboard
☐ Date range filtering works
☐ Token refresh works (test by waiting >1hr)
☐ Basic Access applied for (for production)
```

---

## Troubleshooting

### Problem: `AuthorizationError: USER_PERMISSION_DENIED`
**Cause:** Developer token is in test mode but Customer ID is a real account  
**Resolution:** Use a test account when developer token is in Test Account Access level

### Problem: Developer token shows as "Pending"
**Cause:** Basic Access application under review  
**Resolution:** Continue testing with Test Account Access. Wait 1–5 business days for Basic Access.

### Problem: `OAUTH_TOKEN_FAILED`
**Cause:** Refresh token is invalid or has been revoked  
**Resolution:** Re-connect the Google Ads integration

---

## Official Documentation

- Google Ads API: https://developers.google.com/google-ads/api/docs/start
- GAQL Reference: https://developers.google.com/google-ads/api/docs/query/overview
- Developer Token: https://developers.google.com/google-ads/api/docs/access-levels
- Node.js Client: https://github.com/Opteo/google-ads-api

---

## Next Step

→ [`04-google-analytics.md`](./04-google-analytics.md) — Google Analytics (GA4) integration
