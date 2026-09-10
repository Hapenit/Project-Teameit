# Meta Business Suite — Setup Guide

> **Last Verified:** 2025-09-01  
> **Verified Against:** https://developers.facebook.com/docs/marketing-api/business-manager  
> **Status:** CURRENT  
> **Prerequisite:** [`02-meta-app-creation.md`](./02-meta-app-creation.md)

---

## Purpose

Meta Business Suite (formerly Facebook Business Manager) is the management layer that owns all business assets. Teameit uses it to discover connected Pages, Instagram accounts, WhatsApp Business Accounts, and Ad Accounts that belong to a tenant's business.

---

## Asset Hierarchy

```
Meta Business Portfolio (Business Manager)
         ↓
    ┌────────────────────────────────────┐
    │  Facebook Pages                    │
    │  Instagram Professional Accounts   │
    │  WhatsApp Business Accounts        │
    │  Ad Accounts                       │
    │  Product Catalogs                  │
    │  Pixels / Datasets                 │
    └────────────────────────────────────┘
```

---

## Step 1: Create a Meta Business Manager

**WHERE:** https://business.facebook.com/  
**WHAT TO DO:**
1. Click **"Create Account"**
2. Enter:
   - Business name
   - Your name
   - Business email
3. Follow verification steps
4. Complete Business Profile with:
   - Business address
   - Phone number
   - Website
   - Tax ID (for certain regions)

> [!NOTE]
> A Meta Business Manager is separate from your personal Facebook account and your Meta Developer account. However, all three are linked.

---

## Step 2: Business Verification (Required for Production)

**WHERE:** Business Manager → Settings → Business Info → Business Verification

**WHAT TO DO:**
1. Click **"Start Verification"**
2. Select verification method:
   - **Domain verification** (recommended) — Add a DNS TXT record or meta tag
   - **Phone verification** — Receive call on registered business number
   - **Document verification** — Upload business registration document
3. Complete the chosen verification

**Expected Result:** Verification status changes from "Pending" to "Verified"

**Why this matters:** WhatsApp Business Platform, Meta Ads, and certain permissions require a Verified Business.

---

## Step 3: Claim/Add Assets to Business Manager

### Add a Facebook Page
**WHERE:** Business Settings → Accounts → Pages → Add  
**WHAT TO DO:** Enter Page URL or name → Claim Page

### Add an Instagram Account
**WHERE:** Business Settings → Accounts → Instagram Accounts → Add  
**WHAT TO DO:** Log in with Instagram credentials → Add account

### Add a WhatsApp Business Account
**WHERE:** Business Settings → Accounts → WhatsApp Business Accounts  
**WHAT TO DO:** Add existing WABA or create new one

### Add an Ad Account
**WHERE:** Business Settings → Accounts → Ad Accounts → Add  
**WHAT TO DO:** Add existing, claim, or request access

---

## Step 4: Required Permission — `business_management`

The `business_management` scope allows Teameit to:
- Discover all assets under the Business Portfolio
- Read business information
- Manage connected assets

**Add this scope to your OAuth request:**
```
scope=business_management,pages_show_list,...
```

---

## Step 5: Fetch Business Assets via API

After OAuth, Teameit fetches the tenant's business assets:

```bash
# Get user's businesses
GET /v21.0/me/businesses?access_token=<token>

# Get assets for a business
GET /v21.0/<BUSINESS_ID>/owned_pages
GET /v21.0/<BUSINESS_ID>/owned_instagram_accounts  
GET /v21.0/<BUSINESS_ID>/owned_whatsapp_business_accounts
GET /v21.0/<BUSINESS_ID>/owned_ad_accounts
```

---

## Environment Variables

```env
META_APP_ID=<your-app-id>
META_APP_SECRET=<your-app-secret>
META_REDIRECT_URI=https://api.<your-domain>/api/v1/integrations/meta/oauth/callback
```

*No additional variables needed — Business Suite uses the same Meta App credentials.*

---

## Database Mapping

```
integrations
├── provider: 'meta-business'
├── tenant_id

integration_credentials
├── access_token
├── external_account_id: <BUSINESS_ID>

metadata (JSONB)
├── business_name
├── business_verification_status
├── owned_pages: [...]
├── owned_instagram_accounts: [...]
├── owned_wabas: [...]
├── owned_ad_accounts: [...]
```

---

## Troubleshooting

### Problem: Business not appearing in API response
**Cause:** The Facebook account used for OAuth does not have Admin/Employee access to the Business Manager  
**Resolution:** Ensure the user connecting is listed in Business Settings → People

### Problem: Assets not visible under business
**Cause:** Assets are not claimed by / added to the Business Manager  
**Resolution:** Use Business Settings to claim each asset before connecting

---

## Official Documentation

- Business Manager API: https://developers.facebook.com/docs/marketing-api/business-manager
- Business Verification: https://developers.facebook.com/docs/development/release/business-verification
- Business Settings: https://business.facebook.com/settings/

---

## Next Step

→ [`07-meta-ads.md`](./07-meta-ads.md) — Meta Ads integration
