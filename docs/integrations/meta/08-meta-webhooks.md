# Meta Webhooks — Setup Guide

> **Last Verified:** 2025-09-01  
> **Verified Against:** https://developers.facebook.com/docs/graph-api/webhooks  
> **Status:** CURRENT

---

## Purpose

Meta Webhooks deliver real-time event notifications from Facebook, Instagram, and WhatsApp to Teameit's backend. Without webhooks, Teameit would need to poll the API constantly, which is inefficient and violates Meta's rate limits.

---

## What Teameit Uses Webhooks For

| Event | Platform | Teameit Action |
|-------|----------|---------------|
| New message received | WhatsApp, Messenger, Instagram DM | Create message in Inbox |
| Message delivered | WhatsApp | Update message status |
| Message read | WhatsApp | Update message status |
| Comment on post | Facebook, Instagram | Create notification |
| Page like | Facebook | Analytics event |
| Template approved/rejected | WhatsApp | Update template status |
| Phone number quality update | WhatsApp | Alert admin |

---

## Teameit Webhook Endpoint Architecture

```
Meta Platform
       ↓
POST https://api.<your-domain>/api/v1/webhooks/<platform>
       ↓
1. Signature verification (X-Hub-Signature-256)
       ↓
2. Event stored in webhook_events table
       ↓
3. Idempotency check (external_id uniqueness)
       ↓
4. Event parsed and routed
       ↓
5. Business logic executed
       ↓
6. Event marked as processed
```

---

## Step 1: Webhook Endpoint Setup

Teameit must expose a public HTTPS endpoint for Meta to call.

**Development:** Use [ngrok](https://ngrok.com/) to expose localhost:
```bash
ngrok http 3001
# Copy the https://xxxxx.ngrok.io URL
```

**Production:** Must be a real HTTPS domain (self-signed certificates not accepted).

---

## Step 2: Configure Webhook in Meta App Dashboard

**WHERE:** Meta App Dashboard → Webhooks → Add Callback URL

**WHAT TO ENTER:**

| Field | Value |
|-------|-------|
| Callback URL | `https://api.<your-domain>/api/v1/webhooks/meta` |
| Verify Token | Your `META_WEBHOOK_VERIFY_TOKEN` value |

**WHAT HAPPENS:**
Meta sends a GET request:
```
GET /api/v1/webhooks/meta
  ?hub.mode=subscribe
  &hub.challenge=<random-number>
  &hub.verify_token=<your-verify-token>
```

Your backend must respond with `200 OK` and the raw `hub.challenge` value.

### Teameit Verification Handler (Express)

```typescript
// GET /api/v1/webhooks/meta
app.get('/api/v1/webhooks/meta', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.status(403).send('Forbidden');
});
```

---

## Step 3: Verify Webhook Signatures (Security)

Every POST request from Meta includes an `X-Hub-Signature-256` header.

**Verification logic:**
```typescript
import crypto from 'crypto';

function verifyMetaSignature(req: Request): boolean {
  const signature = req.headers['x-hub-signature-256'] as string;
  if (!signature) return false;

  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', process.env.META_APP_SECRET!)
    .update(req.rawBody) // Must use raw body buffer, NOT parsed JSON
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

> [!IMPORTANT]
> You must access the **raw request body bytes** for signature verification. Express's `json()` middleware transforms the body. Use `express.raw({ type: 'application/json' })` on the webhook route, or capture rawBody in a custom middleware.

---

## Step 4: Subscribe to Platform-Specific Events

### WhatsApp Webhook Fields

**WHERE:** App Dashboard → WhatsApp → Configuration → Webhook Fields

| Field | Purpose |
|-------|---------|
| `messages` | All message types (text, media, template) |
| `message_status` | Delivered/read/failed status updates |
| `template_category_update` | Template approval/rejection |
| `phone_number_quality_update` | Quality score changes |
| `account_review_update` | WABA review status |

### Facebook Page Webhook Fields

**WHERE:** App Dashboard → Webhooks → Page

| Field | Purpose |
|-------|---------|
| `messages` | Messenger messages |
| `messaging_postbacks` | Button/quick reply clicks |
| `feed` | Page posts and comments |
| `message_deliveries` | Delivery receipts |
| `message_reads` | Read receipts |

### Instagram Webhook Fields

**WHERE:** App Dashboard → Webhooks → Instagram

| Field | Purpose |
|-------|---------|
| `messages` | Instagram DMs |
| `comments` | Post comments |
| `mentions` | @mentions |
| `story_insights` | Story metrics |

---

## Step 5: Payload Processing

### WhatsApp Message Payload Structure

```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "<WABA_ID>",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "+1234567890",
          "phone_number_id": "<PHONE_NUMBER_ID>"
        },
        "contacts": [{
          "profile": { "name": "Customer Name" },
          "wa_id": "1234567890"
        }],
        "messages": [{
          "from": "1234567890",
          "id": "wamid.xxxxxxxxxxxx",
          "timestamp": "1234567890",
          "text": { "body": "Hello!" },
          "type": "text"
        }]
      },
      "field": "messages"
    }]
  }]
}
```

### Facebook Messenger Payload Structure

```json
{
  "object": "page",
  "entry": [{
    "id": "<PAGE_ID>",
    "messaging": [{
      "sender": { "id": "<USER_PSID>" },
      "recipient": { "id": "<PAGE_ID>" },
      "timestamp": 1234567890,
      "message": {
        "mid": "m_xxxxxxxxxxxx",
        "text": "Hello from Messenger"
      }
    }]
  }]
}
```

---

## Step 6: Deduplication

Teameit's webhook processor uses the `webhook_events` table with a unique constraint on `external_id`:

```sql
-- Unique constraint prevents duplicate processing
UNIQUE(provider, external_id)
```

If a duplicate arrives (Meta may retry on timeouts), the insert fails with `23505` (unique violation), which Teameit catches and returns `200 OK` without re-processing.

---

## Environment Variables

```env
META_WEBHOOK_VERIFY_TOKEN=<your-custom-random-string>
META_APP_SECRET=<your-app-secret>  # Used for signature verification
```

| Variable | Visibility | Notes |
|----------|------------|-------|
| `META_WEBHOOK_VERIFY_TOKEN` | Server only | Set to any random string; must match Meta dashboard |
| `META_APP_SECRET` | Server only — SECRET | Used to compute HMAC signature |

---

## Webhook Response Requirements

| Condition | Required Response |
|-----------|-----------------|
| Successful processing | `200 OK` within 20 seconds |
| Duplicate event | `200 OK` (do not re-process) |
| Invalid signature | `400 Bad Request` |
| Server error | `5xx` (Meta will retry) |

> [!WARNING]
> If Teameit returns non-200 responses too frequently, Meta may disable the webhook subscription. Always return 200 for legitimate events, even if processing fails internally.

---

## Meta Retry Policy

If Teameit returns a non-200 response, Meta retries with exponential backoff:
- Retry 1: ~1 minute
- Retry 2: ~5 minutes
- Retry 3: ~30 minutes
- After 10+ consecutive failures: Webhook may be disabled

---

## Testing Webhooks

### Using Meta's Test Tool

**WHERE:** App Dashboard → Webhooks → Test  
**WHAT TO DO:** Click "Test" next to any field to send a sample payload

### Using curl

```bash
# Simulate a WhatsApp inbound message
curl -X POST https://api.<your-domain>/api/v1/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=<computed-signature>" \
  -d '{"object":"whatsapp_business_account","entry":[...]}'
```

---

## Troubleshooting

### Problem: Webhook verification fails (403)
**Cause:** Verify token in Teameit backend does not match Meta dashboard  
**Resolution:** Check `META_WEBHOOK_VERIFY_TOKEN` environment variable. Ensure no extra spaces.

### Problem: Signature verification fails
**Cause:** Using parsed JSON body instead of raw body bytes  
**Resolution:** Use `express.raw()` middleware specifically on the webhook route before `express.json()`.

### Problem: Events arriving with delay
**Cause:** Meta webhook delivery is eventual; usually < 5 seconds but can be delayed  
**Resolution:** This is normal. Do not implement polling as a fallback unless > 5 minutes delay.

### Problem: Webhook stops receiving events
**Cause:** Too many failed deliveries caused Meta to disable it  
**Resolution:** Fix the endpoint, then re-enable in App Dashboard → Webhooks → Re-enable.

---

## Official Documentation

- Webhooks Overview: https://developers.facebook.com/docs/graph-api/webhooks
- WhatsApp Webhooks: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks
- Messenger Webhooks: https://developers.facebook.com/docs/messenger-platform/webhooks
- Instagram Webhooks: https://developers.facebook.com/docs/instagram-api/guides/webhooks
- Signature Verification: https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
