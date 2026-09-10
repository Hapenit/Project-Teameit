# SMS Delivery Webhooks — Setup Guide

> **Last Verified:** 2025-09-01  
> **Status:** CURRENT

---

## Purpose

SMS providers send delivery status webhooks to Teameit to update message status (delivered, failed, etc.).

---

## Twilio Delivery Webhook

**Configure in Twilio Console:**
- Phone Numbers → Active Numbers → Select number
- Messaging → "A MESSAGE COMES IN" → Webhook → POST
  - URL: `https://api.<your-domain>/api/v1/webhooks/sms/inbound`
- Status Callback:
  - Specified in the `sendMessage()` call as `statusCallback` parameter

**Webhook Payload (Delivery Status):**
```json
{
  "SmsSid": "SM...",
  "SmsStatus": "delivered",
  "MessageStatus": "delivered",
  "To": "+1234567890",
  "MessageSid": "SM...",
  "AccountSid": "AC..."
}
```

**Status values:** `queued`, `sending`, `sent`, `delivered`, `undelivered`, `failed`

---

## Twilio Webhook Validation

```typescript
import twilio from 'twilio';

function validateTwilioWebhook(req: Request): boolean {
  const signature = req.headers['x-twilio-signature'] as string;
  return twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN!,
    signature,
    process.env.API_BASE_URL + '/api/v1/webhooks/sms/delivery',
    req.body
  );
}
```

---

## Kaleyra Delivery Webhook

Configure in Kaleyra dashboard:
- SMS → Settings → Delivery Reports → Webhook URL:
  `https://api.<your-domain>/api/v1/webhooks/sms/delivery`

**Payload:**
```json
{
  "id": "MSG_ID",
  "mobile": "91XXXXXXXXXX",
  "status": "delivered",
  "time": "2025-09-01 10:30:00"
}
```

---

## Teameit Webhook Handler

```typescript
// POST /api/v1/webhooks/sms/delivery
export const handleSmsDelivery = async (req: Request, res: Response) => {
  const { provider } = req.params;
  const payload = req.body;
  
  // Parse status based on provider
  let messageId: string;
  let status: 'delivered' | 'failed' | 'undelivered';
  
  if (provider === 'twilio') {
    messageId = payload.MessageSid;
    status = payload.MessageStatus === 'delivered' ? 'delivered' : 'failed';
  } else if (provider === 'kaleyra') {
    messageId = payload.id;
    status = payload.status === 'delivered' ? 'delivered' : 'failed';
  }
  
  // Update message status in database
  await supabaseAdmin
    .from('messages')
    .update({ status })
    .eq('external_id', messageId);
  
  return res.status(200).json({ received: true });
};
```

---

## Official Documentation

- Twilio Webhooks: https://www.twilio.com/docs/usage/webhooks
- Twilio Delivery Callbacks: https://www.twilio.com/docs/sms/outbound-message-logging
- Kaleyra Webhooks: https://developers.kaleyra.io/docs/delivery-reports
