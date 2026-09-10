# WhatsApp Business Platform — Setup Guide

> **Last Verified:** 2025-09-01  
> **Verified Against:** https://developers.facebook.com/docs/whatsapp/cloud-api/get-started  
> **Status:** CURRENT  
> **API:** WhatsApp Cloud API (Meta-hosted)  
> **Prerequisite:** [`02-meta-app-creation.md`](./02-meta-app-creation.md) must be completed first.

---

## Purpose

This guide explains how to connect a WhatsApp Business Account (WABA) to Teameit, enabling:
- Receiving and sending WhatsApp messages in the Unified Inbox
- Sending bulk WhatsApp campaigns
- Managing message templates
- Setting up webhook delivery for inbound messages

---

## Account Hierarchy

```
Meta Developer Account
         ↓
    Meta App (Business type)
         ↓
    Meta Business Portfolio (Business Manager)
         ↓
    WhatsApp Business Account (WABA)
         ↓
    Phone Number(s)
```

Each level is distinct. Connecting one does **not** automatically configure the others.

---

## Prerequisites

| Requirement | Description |
|-------------|-------------|
| Meta Developer Account | ✅ See `01-meta-developer-account.md` |
| Meta App (Business type) | ✅ See `02-meta-app-creation.md` |
| Meta Business Manager | ✅ Must exist at https://business.facebook.com/ |
| Business Verification | 🔒 Required before production messaging |
| Phone Number | ✅ Must not be registered on WhatsApp or WhatsApp Business App |
| WhatsApp Business Policy Compliance | ✅ Your business must comply with Meta's messaging policies |

---

## Step 1: Add WhatsApp Product to Your Meta App

**WHERE:** Meta App Dashboard → Add a Product  
**WHAT TO DO:**
1. Find **"WhatsApp"** in the product list
2. Click **"Set Up"**

**Expected Result:** WhatsApp appears in the left sidebar under your app. You see a "Getting Started" quickstart page.

---

## Step 2: Configure Your WhatsApp Business Account

### 2.1 — Link to a Meta Business Portfolio

**WHERE:** WhatsApp → Getting Started  
**WHAT TO DO:**
1. Under "Step 1: Select a Meta Business Portfolio", choose your existing Business Manager
2. If you don't have one, create it at https://business.facebook.com/

### 2.2 — Create or Select a WABA

**WHERE:** WhatsApp → Getting Started → Step 2  
**WHAT TO DO:**
1. Select an existing WhatsApp Business Account OR click **"Create new WhatsApp Business Account"**
2. If creating new:
   - Enter **Business Name** (visible to customers)
   - Enter **Business Category**
   - Enter **Business Description** (optional)
3. Click **"Continue"**

### 2.3 — Add a Phone Number

**WHERE:** WhatsApp → Getting Started → Step 3: Add a phone number  
**WHAT TO DO:**
1. Click **"Add phone number"**
2. Enter a **Display Name** (your business name as customers will see it — requires approval)
3. Select **Category** (e.g., "Other", "Education", "E-commerce")
4. Enter a **Description** (optional)
5. Enter your **phone number** (must NOT be on WhatsApp/WhatsApp Business App)
6. Verify via **SMS OTP** or **Voice Call**

> [!WARNING]
> If the phone number is currently registered on the WhatsApp consumer app or WhatsApp Business App, it must be migrated first. During migration, the number is removed from the app.

**Expected Result:** Phone number is added with status "Connected" or "Pending" (pending display name approval).

---

## Step 3: Generate a Temporary Access Token (Development)

**WHERE:** WhatsApp → API Setup → "Temporary access token" section  
**WHAT TO COPY:**
- **Temporary Access Token** (valid for 24 hours — for testing only)
- **Phone Number ID** (the ID of your business phone number)
- **WhatsApp Business Account ID** (the WABA ID)

> [!NOTE]
> The temporary token is ONLY for development/testing. For production, you must implement a proper System User token (see Step 6).

---

## Step 4: Send Your First Test Message

**WHERE:** WhatsApp → API Setup → Send Messages section  
**WHAT TO DO:**
1. Enter a recipient phone number (your personal WhatsApp number in international format: `+1234567890`)
2. Click **"Send Message"**

**Expected Result:** You receive a "Hello World" template message on WhatsApp.

This confirms:
- Your WABA is connected
- Your phone number is active
- The Cloud API is reachable

---

## Step 5: Configure Webhooks

Webhooks receive incoming messages, delivery status updates, and other events.

**WHERE:** Meta App Dashboard → WhatsApp → Configuration  
OR  
Meta App Dashboard → Webhooks product

**WHAT TO DO:**
1. Enter the **Callback URL**: `https://api.<your-domain>/api/v1/webhooks/whatsapp`
2. Enter a **Verify Token**: Create a random secret string (e.g., `whatsapp_verify_teameit_xyz123`)
3. Click **"Verify and Save"**

**How verification works:**
Meta sends a GET request to your callback URL with `hub.mode=subscribe`, `hub.challenge=<challenge>`, and `hub.verify_token=<your-token>`. Your server must respond with the `hub.challenge` value.

**Teameit's webhook handler at** `POST /api/v1/webhooks/whatsapp`:
- Validates `X-Hub-Signature-256` header using `META_APP_SECRET`
- Processes and deduplicates events
- Routes to `InboxEngine.handleIncomingMessage()`

### Webhook Events to Subscribe

**WHERE:** Webhooks → WhatsApp Business Account → Manage  
**WHAT TO SELECT:**

| Field | Subscribe? | Purpose |
|-------|:----------:|---------|
| `messages` | ✅ | Incoming messages |
| `message_status` | ✅ | Delivery/read receipts |
| `account_review_update` | ✅ | WABA review status changes |
| `phone_number_quality_update` | ✅ | Phone quality changes |
| `template_category_update` | ✅ | Template changes |

---

## Step 6: Create a System User Token (Production)

The temporary token expires in 24 hours. For production, create a permanent System User token.

**WHERE:** Meta Business Settings → Users → System Users  
**WHAT TO DO:**
1. Click **"Add"** → Create a new System User (e.g., "Teameit System User")
2. Set role to **"Admin"** (to allow app management)
3. Click the System User → **"Add Assets"** → Select your WhatsApp Business Account
4. Click **"Generate New Token"**
5. Select your Teameit Meta App
6. Select the following permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
7. Set **Token Expiration** to **"Never"**
8. Click **"Generate Token"**

> [!CAUTION]
> Copy this token immediately. It will not be shown again. Store it as `META_WHATSAPP_SYSTEM_TOKEN` in your server environment variables.

---

## Step 7: Subscribe to WABA Webhooks

Ensure your webhook subscription is active for the WABA.

**WHERE:** WhatsApp → Configuration → Subscribed fields  
**VERIFY:** `messages` and `message_status` are subscribed.

Alternatively via Graph API:
```bash
curl -X POST "https://graph.facebook.com/v21.0/<WABA-ID>/subscribed_apps" \
  -H "Authorization: Bearer <SYSTEM_USER_TOKEN>"
```

---

## Teameit Environment Variables

```env
# Server-only — NEVER expose to frontend
META_APP_ID=<your-meta-app-id>
META_APP_SECRET=<your-meta-app-secret>
META_WHATSAPP_SYSTEM_TOKEN=<permanent-system-user-token>
META_WHATSAPP_PHONE_NUMBER_ID=<phone-number-id>
META_WHATSAPP_WABA_ID=<whatsapp-business-account-id>
META_WEBHOOK_VERIFY_TOKEN=<your-custom-verify-token>
META_REDIRECT_URI=https://api.<your-domain>/api/v1/integrations/meta/oauth/callback
# Optional Cloud API campaign pacing (milliseconds between sends)
WHATSAPP_CAMPAIGN_INTERVAL_MS=100
```

| Variable | Visibility | Notes |
|----------|------------|-------|
| `META_APP_SECRET` | Server only — SECRET | Used for webhook signature verification |
| `META_WHATSAPP_SYSTEM_TOKEN` | Server only — SECRET | Long-lived production token |
| `META_WEBHOOK_VERIFY_TOKEN` | Server only | Used during webhook verification handshake |

---

## OAuth Flow for User-Connected WABAs

When a tenant connects their own WABA through Teameit's UI:

```
User clicks "Connect WhatsApp"
         ↓
Backend generates OAuth state
         ↓
Redirect to Meta OAuth:
  https://www.facebook.com/v21.0/dialog/oauth
  ?client_id=<APP_ID>
  &redirect_uri=<REDIRECT_URI>
  &scope=whatsapp_business_messaging,whatsapp_business_management
  &state=<encrypted-state>
         ↓
User logs in & grants permissions
         ↓
Meta redirects to Teameit callback with ?code=<auth-code>&state=<state>
         ↓
Backend validates state
         ↓
Exchange code for access token:
  POST https://graph.facebook.com/v21.0/oauth/access_token
         ↓
Fetch user's WABAs:
  GET https://graph.facebook.com/v21.0/me/businesses
         ↓
User selects WABA and phone number
         ↓
Store credentials + WABA ID + Phone Number ID
         ↓
Subscribe webhook to WABA
         ↓
Connected ✅
```

---

## Database Mapping

```
integrations
├── provider: 'whatsapp'
├── tenant_id
├── status

integration_credentials
├── access_token (system user token or user token)
├── external_account_id: <WABA ID>

integrations_metadata (or JSONB field)
├── phone_number_id
├── waba_id
├── display_name
├── phone_number
├── quality_rating
```

---

## Teameit Backend Routes

```
POST   /api/v1/integrations/whatsapp/connect
GET    /api/v1/integrations/whatsapp/status
GET    /api/v1/integrations/whatsapp/templates
POST   /api/v1/integrations/whatsapp/messages
GET    /api/v1/integrations/whatsapp/oauth/callback
POST   /api/v1/webhooks/whatsapp            (inbound messages)
GET    /api/v1/integrations/whatsapp/status
DELETE /api/v1/integrations/whatsapp        (disconnect)
```

---

## API Endpoints Used

| Operation | Method | URL |
|-----------|--------|-----|
| Send message | POST | `/v21.0/<PHONE_NUMBER_ID>/messages` |
| Upload media | POST | `/v21.0/<PHONE_NUMBER_ID>/media` |
| Get templates | GET | `/v21.0/<WABA_ID>/message_templates` |
| Create template | POST | `/v21.0/<WABA_ID>/message_templates` |
| Get phone numbers | GET | `/v21.0/<WABA_ID>/phone_numbers` |
| Subscribe webhook | POST | `/v21.0/<WABA_ID>/subscribed_apps` |

---

## Production Requirements

Before going live with WhatsApp messaging:

| Requirement | How to Complete |
|-------------|----------------|
| **Business Verification** | Business Manager → Business Info → Business Verification → Submit documents |
| **Display Name Approval** | Submit during phone number registration; Meta reviews within 1–5 business days |
| **Messaging Limit Increase** | Starts at Tier 1 (250 messages/day); increases with quality and volume |
| **Template Approval** | Submit templates; approved templates required for outbound campaigns |

---

## Message Templates

WhatsApp requires pre-approved templates for marketing and utility messages initiated by businesses.

**WHERE:** WhatsApp Manager → Account tools → Message Templates  
OR  
Via API: `POST /v21.0/<WABA_ID>/message_templates`

Template categories:
- **Marketing** — Promotional content
- **Utility** — Transactional (orders, shipping, appointments)
- **Authentication** — OTP messages

---

## Testing Checklist

```
WhatsApp Integration Test
☐ WhatsApp product added to Meta App
☐ WABA created and linked to Business Portfolio
☐ Phone number added and verified
☐ Test message sent successfully
☐ Webhook URL configured
☐ Verify token configured
☐ Webhook verification succeeds
☐ Inbound message appears in Teameit inbox
☐ Reply sent from Teameit inbox
☐ Delivery status webhook received
☐ System User token generated (for production)
☐ Business Verification submitted
☐ Display name approved
```

---

## Negative Test Cases

| Scenario | Expected Teameit Behavior |
|----------|--------------------------|
| Webhook signature invalid | Return 400, log error, discard event |
| Duplicate message ID received | Deduplicate using `webhook_events.external_id` constraint |
| Message delivery fails | Update `messages.status = 'failed'`, store error reason |
| Token expired | Mark integration expired, prompt user to reconnect |
| WABA suspended | Mark integration as error, notify admin |

---

## Troubleshooting

### Problem: Webhook verification fails with 403
**Cause:** `META_WEBHOOK_VERIFY_TOKEN` in Teameit backend does not match what is entered in Meta dashboard  
**Resolution:** Check exact string match in both places. No extra spaces or quotes.

### Problem: Cannot send messages — "Phone number not in approved list"
**Cause:** App is in Development mode; only pre-approved test numbers can receive messages  
**Resolution:** Add recipient's number to Test Numbers in WhatsApp API Setup, OR switch app to Live mode.

### Problem: "The account does not have permission to send messages"
**Cause:** Missing `whatsapp_business_messaging` permission or System User token lacks access to the WABA  
**Resolution:** Re-generate System User token with correct permissions.

### Problem: Template rejected
**Cause:** Template content violates WhatsApp policies, or category is incorrect  
**Resolution:** Review WhatsApp Business Messaging Policy; revise template; resubmit.

---

## Official Documentation

- Cloud API Getting Started: https://developers.facebook.com/docs/whatsapp/cloud-api/get-started
- Send Messages: https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages
- Webhooks: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks
- Message Templates: https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates
- Business Verification: https://developers.facebook.com/docs/messenger-platform/policy/business-verification
- WhatsApp Business Policy: https://www.whatsapp.com/legal/business-policy/

---

## Next Step

→ [`06-meta-business-suite.md`](./06-meta-business-suite.md) — Meta Business Suite integration
