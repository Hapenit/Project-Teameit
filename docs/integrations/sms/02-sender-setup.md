# SMS Sender Setup — Sender ID & Phone Numbers

> **Last Verified:** 2025-09-01  
> **Status:** CURRENT

---

## Sender ID Types

| Type | Format | Supported By | Notes |
|------|--------|-------------|-------|
| Alphanumeric | TMTPLT (6 chars) | Most international providers | India: must be DLT-registered |
| Short Code | 12345 | US, some others | Requires carrier approval |
| Long Code | +1234567890 | Global (Twilio) | 2-way SMS supported |
| Toll-Free | +18001234567 | US | Higher throughput |

---

## India Sender ID (DLT Header) Registration

1. Log in to your DLT portal (Jio/Airtel/Vi/BSNL)
2. Navigate to: Headers → Add Header
3. Enter 6-character sender ID (e.g., `TMTPLT`)
4. Select Header Type: Transactional / Promotional / Service
5. Submit for approval (1-3 business days)

Once approved, enter your Sender ID in Teameit:
`Settings → Integrations → SMS → Sender ID`

---

## Template Registration (India DLT)

Every SMS template must be registered separately.

1. DLT Portal → Templates → Add Template
2. Enter template content with variables marked as `{#var#}`:
   ```
   Hi {#var#}, your OTP is {#var#}. Valid for 10 minutes.
   ```
3. Select category: Transactional / Promotional / Service Implicit / Service Explicit
4. Submit and wait for approval (1-5 business days)
5. Copy the approved **Template ID**
6. Register in your SMS provider dashboard (Kaleyra/MSG91) to map DLT Template ID

---

## Twilio Phone Number Setup

1. Log in at https://console.twilio.com/
2. Navigate to: Phone Numbers → Buy a Number
3. Select country, capabilities (SMS), and number
4. Configure: `A MESSAGE COMES IN → Webhook → POST → https://api.<your-domain>/api/v1/webhooks/sms/inbound`

---

## Official Documentation

- Twilio Phone Numbers: https://www.twilio.com/docs/phone-numbers
- DLT Registration: https://dltconnect.jio.com/
