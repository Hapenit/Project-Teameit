# Instagram — Setup Guide

> **Last Verified:** 2025-09-01  
> **Verified Against:** https://developers.facebook.com/docs/instagram-api  
> **Status:** CURRENT  
> **API:** Instagram Graph API  
> **Prerequisite:** [`03-facebook-pages.md`](./03-facebook-pages.md) — Facebook Page must be connected first.

---

## Purpose

This guide explains how to connect an Instagram Professional Account to Teameit, enabling:
- Receiving and replying to Instagram Direct Messages (DMs) in the Unified Inbox
- Publishing posts, Reels, and carousels
- Monitoring and replying to comments
- Reading Instagram analytics

---

## Critical Prerequisite: Instagram Requires a Facebook Page

> [!IMPORTANT]
> Instagram's API **requires** your Instagram Professional Account to be connected to a Facebook Page. Without this link, you cannot access Instagram's Graph API.

```
Meta Developer Account
         ↓
    Meta App (Business type)
         ↓
    Facebook Page (connected to Instagram)
         ↓
    Instagram Professional Account
         ↓
    Instagram Graph API Access
```

---

## Prerequisites

| Requirement | Description |
|-------------|-------------|
| Meta Developer Account | ✅ |
| Meta App (Business type) | ✅ |
| Facebook Page | ✅ Must be connected to your Instagram account |
| Instagram Professional Account | ✅ Must be a **Business** or **Creator** account (not Personal) |
| Page Admin Access | ✅ You must be Admin of the linked Facebook Page |

---

## Step 1: Convert Instagram to a Professional Account

If your Instagram account is personal:

**WHERE:** Instagram App → Profile → Menu → Settings → Account → Switch to Professional Account  
**WHAT TO SELECT:** Business (recommended for Teameit integrations)

**Expected Result:** Account is now a Business or Creator Professional Account.

---

## Step 2: Link Instagram to a Facebook Page

**WHERE:** Instagram App → Profile → Edit Profile → Page → Connect a Facebook Page  
**WHAT TO DO:**
1. Tap **"Connect Page"**
2. Select the Facebook Page you want to link (must be a Page you Admin)
3. Confirm the connection

**Expected Result:** Instagram account shows the linked Page name.

**Alternative (via Facebook):**  
Facebook Page → Settings → Instagram → Connect Account

---

## Step 3: Add Instagram Graph API Product to Meta App

**WHERE:** Meta App Dashboard → Add Product → Instagram → "Set Up"

The Instagram Graph API product provides access to:
- Business Discovery
- Content Publishing
- Comment Management
- DM Management (instagram_manage_messages)

---

## Step 4: Configure Required Permissions

**WHERE:** App Dashboard → App Review → Permissions and Features

| Permission | Purpose | Review Required? |
|-----------|---------|:----------------:|
| `instagram_basic` | Connect Instagram account, read basic info | 🔒 Production |
| `instagram_manage_messages` | Send/receive DMs | 🔒 Production |
| `instagram_manage_comments` | Read/reply to comments | 🔒 Production |
| `instagram_content_publish` | Publish posts, Reels, carousels | 🔒 Production |
| `instagram_read_engagement` | Read post engagement metrics | 🔒 Production |
| `pages_show_list` | List managed Facebook Pages | ❌ No review |
| `pages_read_engagement` | Required alongside Instagram access | 🔒 Production |

---

## Step 5: Configure Webhooks for Instagram

**WHERE:** Meta App Dashboard → Webhooks → Instagram  
OR  
Messenger → Webhooks (same callback URL can be reused)

**WHAT TO DO:**
1. Enter Callback URL: `https://api.<your-domain>/api/v1/webhooks/instagram`
2. Enter Verify Token
3. Click **"Verify and Save"**
4. Subscribe to fields:

| Field | Subscribe? | Purpose |
|-------|:----------:|---------|
| `messages` | ✅ | Instagram DMs |
| `messaging_postbacks` | ✅ | Quick reply clicks |
| `comments` | ✅ | Post comments |
| `mentions` | ✅ | Mentions in stories/posts |
| `story_insights` | ❌ (optional) | Story analytics |

---

## OAuth Flow (Teameit Connection)

```
User clicks "Connect Instagram"
         ↓
Backend generates OAuth state
         ↓
Redirect to:
  https://www.facebook.com/v21.0/dialog/oauth
  ?client_id=<APP_ID>
  &redirect_uri=<REDIRECT_URI>
  &scope=instagram_basic,instagram_manage_messages,instagram_manage_comments,
         instagram_content_publish,pages_show_list,pages_read_engagement
  &state=<encrypted-state>
         ↓
User logs in with Facebook (linked to Instagram)
         ↓
Callback with ?code=<auth-code>
         ↓
Exchange code → user access token
         ↓
Fetch user's Pages:
  GET /me/accounts
         ↓
For each Page, get linked Instagram account:
  GET /<PAGE_ID>?fields=instagram_business_account
         ↓
User selects Instagram account
         ↓
Store: Instagram Business Account ID + Page Access Token
         ↓
Connected ✅
```

---

## Fetching the Instagram Business Account ID

```bash
curl "https://graph.facebook.com/v21.0/<PAGE_ID>?fields=instagram_business_account&access_token=<PAGE_TOKEN>"
```

Response:
```json
{
  "instagram_business_account": {
    "id": "17841400000000001"
  },
  "id": "<PAGE_ID>"
}
```

Store this `instagram_business_account.id` — it is used in all Instagram Graph API calls.

---

## Key API Endpoints

| Operation | Method | URL |
|-----------|--------|-----|
| Get account info | GET | `/<IG_USER_ID>?fields=name,biography,followers_count` |
| Get media | GET | `/<IG_USER_ID>/media` |
| Get conversations | GET | `/<IG_USER_ID>/conversations` |
| Get messages | GET | `/<CONVERSATION_ID>/messages` |
| Send DM | POST | `/me/messages` |
| Create media container | POST | `/<IG_USER_ID>/media` |
| Publish media | POST | `/<IG_USER_ID>/media_publish` |
| Reply to comment | POST | `/<COMMENT_ID>/replies` |

---

## Database Mapping

```
integrations
├── provider: 'instagram'
├── tenant_id
├── status

integration_credentials
├── access_token (page access token)
├── external_account_id: <INSTAGRAM_BUSINESS_ACCOUNT_ID>

metadata (JSONB)
├── ig_username
├── ig_account_name
├── linked_page_id
├── follower_count
```

---

## Content Publishing — Image Post Example

**Step 1 — Create media container:**
```bash
POST /v21.0/<IG_USER_ID>/media
  ?image_url=<public-image-url>
  &caption=<post-caption>
  &access_token=<token>
```
Returns: `{ "id": "<CONTAINER_ID>" }`

**Step 2 — Publish the container:**
```bash
POST /v21.0/<IG_USER_ID>/media_publish
  ?creation_id=<CONTAINER_ID>
  &access_token=<token>
```
Returns: `{ "id": "<MEDIA_ID>" }`

> [!IMPORTANT]
> Images must be hosted at a **publicly accessible HTTPS URL** for Meta to download them. Use Teameit's Media Library / Supabase Storage for hosting assets.

---

## Production App Review Requirements

All Instagram permissions require App Review for Live mode:

| Permission | Evidence Needed |
|-----------|----------------|
| `instagram_manage_messages` | Screencast of DM flow, use case description |
| `instagram_content_publish` | Screencast of content publishing flow |
| `instagram_manage_comments` | Screencast of comment reply flow |

**Timeline:** 5–30 business days

---

## Testing Checklist

```
Instagram Integration Test
☐ Instagram account converted to Professional (Business)
☐ Instagram linked to Facebook Page
☐ Instagram Graph API product added to Meta App
☐ OAuth flow completes successfully
☐ Instagram Business Account ID fetched
☐ Account info fetched via API
☐ Webhook configured and verified
☐ Test DM received in Teameit Inbox
☐ Reply sent from Teameit
☐ Reply received on Instagram
☐ Test post published via API
☐ App Review submitted for production
```

---

## Troubleshooting

### Problem: `instagram_business_account` field returns null
**Cause:** Instagram account is not linked to the Facebook Page, OR the account is still Personal  
**Resolution:** Ensure the Instagram account is a Business/Creator account AND linked to the Page.

### Problem: Cannot send DMs — "The recipient must initiate the conversation"
**Cause:** Instagram DM API requires the customer to message first (24-hour messaging window)  
**Resolution:** Can only reply within 24 hours of the last message from the customer. This is a Meta policy restriction.

### Problem: Content publishing returns "Invalid image URL"
**Cause:** Image URL is not publicly accessible or not HTTPS  
**Resolution:** Ensure the Supabase Storage bucket is set to public access and uses HTTPS.

---

## Official Documentation

- Instagram Graph API: https://developers.facebook.com/docs/instagram-api
- DM API: https://developers.facebook.com/docs/messenger-platform/instagram
- Content Publishing: https://developers.facebook.com/docs/instagram-api/guides/content-publishing
- Comments: https://developers.facebook.com/docs/instagram-api/guides/comment-moderation
- Instagram Webhooks: https://developers.facebook.com/docs/instagram-api/guides/webhooks

---

## Next Step

→ [`06-meta-business-suite.md`](./06-meta-business-suite.md) — Meta Business Suite
