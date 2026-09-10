# Facebook Pages — Setup Guide

> **Last Verified:** 2025-09-01  
> **Verified Against:** https://developers.facebook.com/docs/messenger-platform  
> **Status:** CURRENT  
> **Prerequisite:** [`02-meta-app-creation.md`](./02-meta-app-creation.md) must be completed first.

---

## Purpose

This guide explains how to connect a Facebook Page to Teameit, enabling:
- Receiving and sending Facebook Messenger messages in the Unified Inbox
- Reading and replying to Page comments
- Publishing posts to a Facebook Page
- Receiving Page notification webhooks

---

## Account Hierarchy

```
Meta Developer Account
         ↓
    Meta App (Business type)
         ↓
    Facebook Page (owned by your Business Manager)
         ↓
    Page Access Token
         ↓
    Teameit Messenger Inbox
```

---

## Prerequisites

| Requirement | Description |
|-------------|-------------|
| Meta Developer Account | ✅ |
| Meta App (Business type) | ✅ |
| Facebook Page | ✅ Must be a Page (not a personal profile) |
| Page Admin Access | ✅ You must be an Admin of the Page |
| Business Manager | ✅ Page should be claimed by your Business Manager |

---

## Step 1: Ensure You Have a Facebook Page

**WHERE:** https://www.facebook.com/pages/create  
**WHY:** Messenger API only works with Pages, not personal profiles.

If you already have a Page, ensure:
- You are listed as an **Admin** of the Page
- The Page is claimed by your Meta Business Manager

**To claim a Page:**  
Business Manager → Business Settings → Accounts → Pages → Add → Claim a Page → Enter Page name

---

## Step 2: Add Messenger Product to Your Meta App

**WHERE:** Meta App Dashboard → Add Product → Messenger → "Set Up"

**Expected Result:** Messenger appears in the left sidebar.

---

## Step 3: Configure Messenger Settings

**WHERE:** Messenger → Settings  

### 3.1 — Access Tokens

**WHAT TO DO:**
1. Under "Access Tokens", click **"Add or Remove Pages"**
2. Log in with the Facebook account that has Admin access to your Page
3. Select the Page(s) you want to connect
4. Click **"Done"**

**Expected Result:** Your Page appears in the Access Tokens list with a **Page Access Token** visible.

> [!CAUTION]
> This is a **temporary Page Access Token** (short-lived). For production, you must generate a **long-lived Page Access Token** via the Graph API. See Step 6.

### 3.2 — Required Permissions for Messenger

| Permission | Purpose | Review Required? |
|-----------|---------|:----------------:|
| `pages_messaging` | Send and receive Messenger messages | 🔒 Production |
| `pages_show_list` | Access the list of managed Pages | ❌ |
| `pages_read_engagement` | Read comments and posts | 🔒 Production |
| `pages_manage_posts` | Create posts | 🔒 Production |

---

## Step 4: Configure Webhooks

**WHERE:** Messenger → Settings → Webhooks section

**WHAT TO DO:**
1. Click **"Add Callback URL"**
2. Enter Callback URL: `https://api.<your-domain>/api/v1/webhooks/facebook`
3. Enter Verify Token: (same `META_WEBHOOK_VERIFY_TOKEN` as WhatsApp, or a separate one)
4. Click **"Verify and Save"**
5. Under **Webhook Fields**, click **"Add Subscriptions"** and select:

| Field | Subscribe? | Purpose |
|-------|:----------:|---------|
| `messages` | ✅ | Incoming Messenger messages |
| `messaging_postbacks` | ✅ | Button clicks, postbacks |
| `messaging_referrals` | ✅ | Referral tracking |
| `feed` | ✅ | Page comments |
| `message_deliveries` | ✅ | Delivery status |
| `message_reads` | ✅ | Read receipts |

---

## Step 5: Subscribe the Page to the App

**WHERE:** Via Graph API or Messenger Settings

```bash
curl -X POST "https://graph.facebook.com/v21.0/<PAGE_ID>/subscribed_apps" \
  -d "subscribed_fields=messages,messaging_postbacks,feed" \
  -H "Authorization: Bearer <PAGE_ACCESS_TOKEN>"
```

---

## Step 6: Generate Long-Lived Page Access Token (Production)

Short-lived tokens expire in ~1 hour. For production:

**Step 6.1 — Generate long-lived User Token:**
```
GET https://graph.facebook.com/v21.0/oauth/access_token
  ?grant_type=fb_exchange_token
  &client_id=<APP_ID>
  &client_secret=<APP_SECRET>
  &fb_exchange_token=<SHORT_LIVED_USER_TOKEN>
```

**Step 6.2 — Exchange for never-expiring Page Token:**
```
GET https://graph.facebook.com/v21.0/<PAGE_ID>
  ?fields=access_token
  &access_token=<LONG_LIVED_USER_TOKEN>
```

The returned `access_token` is a **never-expiring Page Access Token** tied to that User-Page relationship.

> [!NOTE]
> Page tokens do not expire as long as the user maintains Admin access to the Page and does not revoke the app's permissions.

---

## OAuth Flow (Teameit Connection)

```
User clicks "Connect Facebook"
         ↓
Backend generates OAuth state
         ↓
Redirect to:
  https://www.facebook.com/v21.0/dialog/oauth
  ?client_id=<APP_ID>
  &redirect_uri=<REDIRECT_URI>
  &scope=pages_messaging,pages_show_list,pages_manage_posts,pages_read_engagement
  &state=<encrypted-state>
         ↓
User logs in & grants permissions
         ↓
Callback received with ?code=<auth-code>
         ↓
Exchange code → user access token
         ↓
Fetch user's Pages:
  GET /me/accounts (returns all managed Pages with tokens)
         ↓
User selects Page
         ↓
Exchange for long-lived Page token
         ↓
Subscribe Page to webhooks
         ↓
Store token + Page ID in database
         ↓
Connected ✅
```

---

## Teameit Environment Variables

```env
# These are shared with all Meta integrations
META_APP_ID=<your-meta-app-id>
META_APP_SECRET=<your-meta-app-secret>
META_REDIRECT_URI=https://api.<your-domain>/api/v1/integrations/meta/oauth/callback
META_WEBHOOK_VERIFY_TOKEN=<your-verify-token>
```

---

## Database Mapping

```
integrations
├── provider: 'facebook'
├── tenant_id
├── status

integration_credentials
├── access_token (page access token)
├── external_account_id: <PAGE_ID>

metadata (JSONB)
├── page_name
├── page_category
├── page_picture_url
├── subscribed_fields: ['messages', 'feed', ...]
```

---

## Teameit Backend Routes

```
POST   /api/v1/integrations/facebook/connect
GET    /api/v1/integrations/facebook/oauth/callback
GET    /api/v1/integrations/facebook/pages        (list available pages)
POST   /api/v1/integrations/facebook/select-page  (save selected page)
POST   /api/v1/webhooks/facebook                  (inbound messages, comments)
DELETE /api/v1/integrations/facebook              (disconnect)
```

---

## Production App Review Requirements

To use `pages_messaging` in Live mode with users outside your app's test list:

**WHERE:** App Dashboard → App Review → Permissions and Features

Submit for:
- `pages_messaging` — Requires justification, screencast, and privacy policy

**Evidence Required:**
- Video screencast demonstrating the full messaging flow in Teameit
- Written description of the use case
- Privacy Policy URL
- App icon and valid App Store link (if mobile)

**Timeline:** 5–30 business days

---

## Testing Checklist

```
Facebook Pages Integration Test
☐ Facebook Page created and accessible
☐ Messenger product added to Meta App
☐ Page connected via Facebook Login
☐ Page Access Token obtained
☐ Webhook URL configured and verified
☐ Page subscribed to webhook fields
☐ Test message sent to Page from personal account
☐ Message appears in Teameit Inbox
☐ Reply sent from Teameit
☐ Reply received in Facebook Messenger
☐ Long-lived token generated for production
☐ App Review submitted (for production)
```

---

## Troubleshooting

### Problem: Page not appearing in account list
**Cause:** Your Facebook account is not an Admin of the Page  
**Resolution:** Ask the current Page Admin to add you as Admin, or use the correct Facebook account.

### Problem: Webhook messages not arriving
**Cause:** Page is not subscribed to the app, or webhook subscription is inactive  
**Resolution:** Re-run the `/subscribed_apps` API call. Check Webhooks → Subscriptions in the dashboard.

### Problem: Page Access Token invalid after 1 hour
**Cause:** Short-lived token was used — needs to be exchanged for long-lived  
**Resolution:** Implement the long-lived token exchange in Step 6.

---

## Official Documentation

- Messenger Platform: https://developers.facebook.com/docs/messenger-platform
- Page Access Tokens: https://developers.facebook.com/docs/facebook-login/guides/access-tokens#pagetokens
- Webhooks: https://developers.facebook.com/docs/messenger-platform/webhooks
- App Review: https://developers.facebook.com/docs/app-review

---

## Next Step

→ [`04-instagram.md`](./04-instagram.md) — Instagram connection
