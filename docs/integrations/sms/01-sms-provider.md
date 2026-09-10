# SMS Provider — Selection & Architecture Guide

> **Last Verified:** 2025-09-01  
> **Status:** CURRENT

---

## Purpose

This guide covers SMS provider selection, the provider abstraction layer in Teameit, and critical compliance requirements especially for India (DLT/TRAI).

---

## Teameit SMS Architecture

Teameit uses a **provider abstraction layer** so the SMS provider can be changed without rebuilding the platform:

```
Teameit Campaign Engine
         ↓
    SMS Provider Interface
         ↓
    ┌────────────────────────────────────┐
    │  Twilio  │  AWS SNS  │  D7 Networks │
    │  TextLocal│ Kaleyra  │  Msg91      │
    └────────────────────────────────────┘
         ↓
    Provider API
         ↓
    Customer Phone
         ↓
    Delivery Webhook → Teameit
```

---

## Supported Providers

| Provider | Best For | Indian Market | International |
|----------|---------|:------------:|:-------------:|
| Twilio | Global, developer-friendly | ✅ | ✅ |
| AWS SNS | AWS ecosystem | ✅ | ✅ |
| Kaleyra | India-first | ✅✅ | ✅ |
| MSG91 | India-first, DLT support | ✅✅ | ❌ |
| TextLocal | India + UK | ✅✅ | Limited |
| D7 Networks | Middle East + Global | ✅ | ✅ |

**Recommendation for India:** Kaleyra or MSG91 (both are DLT-registered, which is mandatory for India)  
**Recommendation for Global:** Twilio or AWS SNS

---

## ⚠️ India DLT/TRAI Compliance (MANDATORY)

> [!CAUTION]
> In India, the **Telecom Regulatory Authority of India (TRAI)** mandates DLT (Distributed Ledger Technology) registration for ALL commercial SMS senders as of 2021.
>
> **Without DLT registration, SMS messages sent in India will be BLOCKED by telecom operators.**

### DLT Requirements

| Requirement | Description |
|-------------|-------------|
| **Principal Entity (PE) Registration** | Your company must register as a Principal Entity on DLT |
| **Sender ID (Header) Registration** | Your 6-character sender ID (e.g., TMTPLT) must be registered |
| **Template Registration** | Every SMS template must be registered before sending |
| **DLT Platform** | Must register on one of the approved DLT platforms: Jio DLT, Airtel DLT, Vi DLT, BSNL DLT, TRAI DLT |

### DLT Registration Process

1. Register at one of: https://dltconnect.jio.com/ or https://dlt.airtel.in/ or https://vilpower.in/
2. Submit business documents (GST, business registration)
3. Approval takes 2-7 business days
4. Register your Sender ID (Header)
5. Register each SMS template with the approved PE ID
6. Map templates in your SMS provider (Kaleyra/MSG91) to DLT template IDs

---

## SMS Provider Interface (TypeScript)

```typescript
// Teameit SMS Provider Adapter interface
export interface SmsProvider {
  sendSms(params: {
    to: string;            // International format: +91XXXXXXXXXX
    message: string;
    templateId?: string;   // DLT template ID (India)
    senderId?: string;     // DLT Sender ID (India)
    reference?: string;    // Internal message ID
  }): Promise<{
    messageId: string;
    status: 'queued' | 'sent' | 'failed';
    error?: string;
  }>;

  validateDeliveryWebhook(payload: any, signature: string): boolean;
}
```

---

## Twilio Provider Adapter Example

```typescript
import twilio from 'twilio';

export class TwilioSmsProvider implements SmsProvider {
  private client: twilio.Twilio;
  
  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );
  }

  async sendSms({ to, message, reference }) {
    const msg = await this.client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
      statusCallback: `${process.env.API_BASE_URL}/api/v1/webhooks/sms/delivery`
    });
    
    return { messageId: msg.sid, status: 'queued' };
  }
}
```

---

## Environment Variables

```env
# Choose ONE provider
SMS_PROVIDER=twilio  # or: aws_sns | kaleyra | msg91 | textlocal

# Twilio
TWILIO_ACCOUNT_SID=<your-account-sid>
TWILIO_AUTH_TOKEN=<your-auth-token>
TWILIO_PHONE_NUMBER=+1234567890

# Kaleyra (India)
KALEYRA_API_KEY=<your-api-key>
KALEYRA_SID=<your-sid>
KALEYRA_SENDER_ID=TMTPLT

# MSG91 (India)
MSG91_AUTH_KEY=<your-auth-key>
MSG91_SENDER_ID=TMTPLT
MSG91_ROUTE=4  # 4=Transactional, 1=Promotional
```

---

## Official Documentation

- Twilio: https://www.twilio.com/docs/sms
- AWS SNS SMS: https://docs.aws.amazon.com/sns/latest/dg/sns-mobile-phone-number-as-subscriber.html
- Kaleyra: https://developers.kaleyra.io/
- MSG91: https://docs.msg91.com/
- TRAI DLT: https://trai.gov.in/sites/default/files/RegulationUcc18072018.pdf
- Jio DLT Portal: https://dltconnect.jio.com/

---

## Next Step

→ [`02-sender-setup.md`](./02-sender-setup.md) — Sender ID and number configuration
