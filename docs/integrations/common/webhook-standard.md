# Webhook Standard — Teameit Implementation Reference

> **Last Verified:** 2025-09-01  
> **Status:** CURRENT

---

## Purpose

This document defines the standard webhook processing architecture used across all Teameit integrations. All platform-specific webhook handlers follow this pattern.

---

## Standard Webhook Processing Flow

```
Platform sends POST request
         ↓
Teameit Webhook Endpoint
  POST /api/v1/webhooks/<provider>
         ↓
Step 1: Validate Signature
  (HMAC-SHA256, provider-specific)
         ↓
Step 2: Parse Provider-Specific Payload
         ↓
Step 3: Insert into webhook_events table
  (idempotency check via UNIQUE external_id)
         ↓
Step 4: If duplicate → return 200, skip processing
         ↓
Step 5: Route to appropriate handler
         ↓
Step 6: Execute business logic
         ↓
Step 7: Mark event as 'processed'
         ↓
Return 200 OK (ALWAYS within 20 seconds)
```

---

## Database Schema

```sql
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,          -- 'whatsapp', 'facebook', 'sms', etc.
  event_type TEXT NOT NULL,        -- 'message', 'delivery_status', etc.
  external_id TEXT NOT NULL,       -- Provider's event/message ID
  payload JSONB NOT NULL,          -- Raw payload
  status TEXT NOT NULL DEFAULT 'pending',  -- pending, processed, failed
  error_log TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(provider, external_id)    -- Idempotency constraint
);
```

---

## Signature Verification by Provider

| Provider | Header | Method |
|----------|--------|--------|
| Meta (WhatsApp/Facebook/Instagram) | `X-Hub-Signature-256` | HMAC-SHA256 of raw body with App Secret |
| Twilio | `X-Twilio-Signature` | Twilio library validation |
| Kaleyra | Custom header | Provider-specific |
| Google (Pub/Sub) | JWT signature | Google public key verification |

---

## Idempotency Implementation

```typescript
static async handleWebhook(data: WebhookPayload, processor: Function) {
  // Insert with UNIQUE constraint on (provider, external_id)
  const { data: event, error: insertError } = await supabaseAdmin
    .from('webhook_events')
    .insert({
      provider: data.provider,
      event_type: data.eventType,
      external_id: data.externalId,
      payload: data.payload,
      status: 'pending'
    })
    .select().single();

  if (insertError) {
    if (insertError.code === '23505') {
      // Duplicate — already processed
      return { success: true, duplicate: true };
    }
    throw insertError;
  }

  try {
    await processor(data.payload);
    await supabaseAdmin
      .from('webhook_events')
      .update({ status: 'processed', processed_at: new Date().toISOString() })
      .eq('id', event.id);
    return { success: true };
  } catch (error: any) {
    await supabaseAdmin
      .from('webhook_events')
      .update({ status: 'failed', error_log: error.message })
      .eq('id', event.id);
    throw error;
  }
}
```

---

## Response Requirements

> [!IMPORTANT]
> All webhook endpoints MUST return HTTP 200 within 20 seconds.
> 
> - Return 200 even for duplicates
> - Return 200 even if business logic processing fails (log the error, don't surface it to provider)
> - Only return non-200 for genuine signature validation failures (400) or critical server errors (500)

---

## Webhook Endpoint Registration

Teameit uses a single `/api/v1/webhooks/:provider` route that dispatches to provider-specific handlers:

```typescript
router.post('/api/v1/webhooks/:provider', async (req, res) => {
  const { provider } = req.params;
  
  switch (provider) {
    case 'whatsapp':
    case 'facebook':
    case 'instagram':
      return handleMetaWebhook(req, res);
    case 'sms':
      return handleSmsWebhook(req, res);
    case 'email':
      return handleEmailWebhook(req, res);
    default:
      return res.status(404).json({ error: 'Unknown provider' });
  }
});
```

---

## Testing Webhooks Locally

Use ngrok to expose localhost to the internet:

```bash
# Install ngrok and authenticate
ngrok http 3001

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Use this as your webhook callback URL in provider dashboards during development
```
