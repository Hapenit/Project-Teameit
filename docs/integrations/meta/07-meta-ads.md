# Meta Ads — Setup Guide

> **Last Verified:** 2025-09-01  
> **Verified Against:** https://developers.facebook.com/docs/marketing-api  
> **Status:** CURRENT  
> **API:** Meta Marketing API  
> **Prerequisite:** [`06-meta-business-suite.md`](./06-meta-business-suite.md) — Business verification recommended.

---

## Purpose

This guide explains how to connect a Meta Ad Account to Teameit, enabling:
- Reading ad campaign performance metrics
- Viewing spend, impressions, clicks, CTR, CPC, ROAS
- Displaying ad insights in the Teameit Analytics Dashboard

---

## Account Hierarchy

```
Meta Developer Account
         ↓
    Meta App (Business type)
         ↓
    Meta Business Manager (Verified)
         ↓
    Ad Account (owned or access granted)
         ↓
    Marketing API Access
         ↓
    Teameit Ads Dashboard
```

---

## Prerequisites

| Requirement | Description |
|-------------|-------------|
| Meta Developer Account | ✅ |
| Meta App | ✅ Business type |
| Business Manager | ✅ Verified |
| Ad Account | ✅ Must have at least Analyst access |
| Marketing API access | ✅ Must be enabled for the app |

---

## Step 1: Enable Marketing API on Your App

**WHERE:** Meta App Dashboard → Add Product → Marketing API → "Set Up"

**Expected Result:** Marketing API appears in your app's product list.

---

## Step 2: Required Permissions

| Permission | Purpose | Review Required? |
|-----------|---------|:----------------:|
| `ads_read` | Read campaigns, ad sets, ads, and insights | 🔒 Production |
| `ads_management` | Create/edit campaigns, ad sets, ads | 🔒 Production |
| `business_management` | Access business-level assets | ✅ Required |
| `read_insights` | Read ad performance data | 🔒 Production |

> [!NOTE]
> For Teameit's Analytics Dashboard (read-only), `ads_read` and `read_insights` are sufficient. `ads_management` is only needed if you intend to create/edit campaigns.

---

## Step 3: OAuth Flow

```
User clicks "Connect Meta Ads"
         ↓
Redirect to Facebook OAuth:
  scope=ads_read,business_management,read_insights
         ↓
User grants permissions
         ↓
Callback received
         ↓
Exchange code → token
         ↓
Fetch Ad Accounts:
  GET /v21.0/me/adaccounts?fields=name,currency,account_status
         ↓
User selects Ad Account
         ↓
Store: Ad Account ID + token
         ↓
Fetch initial metrics
         ↓
Connected ✅
```

---

## Step 4: Fetch Ad Account Data

```bash
# List ad accounts for the user
GET /v21.0/me/adaccounts?fields=name,currency,account_status,amount_spent

# Get campaign metrics
GET /v21.0/<AD_ACCOUNT_ID>/insights
  ?fields=campaign_name,spend,impressions,clicks,ctr,cpc,cpm,reach
  &level=campaign
  &date_preset=last_30d
  &access_token=<token>
```

---

## Key Metrics Available

| Metric | API Field | Description |
|--------|-----------|-------------|
| Spend | `spend` | Total amount spent |
| Impressions | `impressions` | Times ads were shown |
| Reach | `reach` | Unique people who saw ads |
| Clicks | `clicks` | Total ad clicks |
| CTR | `ctr` | Click-through rate |
| CPC | `cpc` | Cost per click |
| CPM | `cpm` | Cost per 1,000 impressions |
| Conversions | `conversions` | Total conversion events |
| ROAS | `purchase_roas` | Return on ad spend |

---

## Environment Variables

```env
META_APP_ID=<your-app-id>
META_APP_SECRET=<your-app-secret>
META_REDIRECT_URI=https://api.<your-domain>/api/v1/integrations/meta/oauth/callback
```

---

## Database Mapping

```
integrations
├── provider: 'meta-ads'
├── tenant_id

integration_credentials
├── access_token
├── external_account_id: <AD_ACCOUNT_ID>  (format: act_XXXXXXXXX)

ad_metrics table (synced)
├── tenant_id
├── platform: 'meta'
├── campaign_name
├── spend
├── impressions
├── clicks
├── ctr
├── cpc
├── conversions
├── roas
├── date_start
├── date_end
```

---

## Production Requirements

| Requirement | Details |
|-------------|---------|
| Business Verification | Required for `ads_management` |
| App Review for `ads_read` | Required for Live mode |
| Privacy Policy | Required for review |

---

## Troubleshooting

### Problem: Ad account returns `User does not have sufficient permissions`
**Cause:** The authenticated user only has View access (not Analyst)  
**Resolution:** Ensure the user has Analyst or higher access in Business Manager → Ad Accounts

### Problem: `Invalid OAuth access token` when fetching insights
**Cause:** Token expired or has wrong permissions  
**Resolution:** Re-connect the integration; ensure `ads_read` scope is included in OAuth request

---

## Official Documentation

- Marketing API: https://developers.facebook.com/docs/marketing-api
- Ad Insights: https://developers.facebook.com/docs/marketing-api/insights
- Ad Account Reference: https://developers.facebook.com/docs/marketing-api/reference/ad-account

---

## Next Step

→ [`08-meta-webhooks.md`](./08-meta-webhooks.md) — Meta Webhooks configuration
