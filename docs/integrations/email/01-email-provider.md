# Email Provider — Selection & Setup Guide

> **Last Verified:** 2025-09-01  
> **Status:** CURRENT

---

## Purpose

This guide explains how to configure an email provider for Teameit's Email Engine, enabling:
- Sending marketing email campaigns
- Sending transactional emails (welcome, password reset)
- Receiving inbound email replies in the Unified Inbox (via IMAP)

---

## Email Architecture in Teameit

```
Teameit Email Engine
         ↓
    ┌────┴────┐
    │ Sending  │  ← SMTP (via Nodemailer)
    │ SMTP     │
    └─────────┘
         ↓
    ┌────┴────┐
    │Receiving │  ← IMAP (via ImapFlow)
    │ IMAP     │
    └─────────┘
```

---

## Supported Email Providers

Teameit supports any SMTP/IMAP provider. Common providers:

| Provider | SMTP Host | IMAP Host | Notes |
|----------|-----------|-----------|-------|
| Gmail (Google Workspace) | `smtp.gmail.com` | `imap.gmail.com` | Requires App Password or OAuth |
| Gmail (Personal) | `smtp.gmail.com` | `imap.gmail.com` | Requires App Password (2FA must be on) |
| Outlook / Microsoft 365 | `smtp-mail.outlook.com` | `outlook.office365.com` | Requires App Password |
| Amazon SES | `email-smtp.<region>.amazonaws.com` | N/A (no IMAP) | Outbound only; use SES for sending at scale |
| SendGrid | `smtp.sendgrid.net` | N/A (no IMAP) | Outbound only; use for bulk campaigns |
| Zoho Mail | `smtp.zoho.com` | `imap.zoho.com` | Full SMTP+IMAP |
| Custom SMTP | Varies | Varies | Any provider with SMTP/IMAP access |

---

## Provider Recommendation by Use Case

| Use Case | Recommended Provider |
|----------|---------------------|
| Small volume (<5000/day) | Gmail Workspace or Zoho |
| High volume campaigns | Amazon SES + SES for SMTP, separate inbox for IMAP |
| Transactional (receipts) | SendGrid or Amazon SES |
| Full inbox (send + receive) | Gmail Workspace, Zoho, or custom domain |

---

## Step 1: Choose Your Provider

For most Teameit deployments, we recommend:
- **Gmail Workspace** for send + receive (team-owned domain)
- **Amazon SES** for high-volume marketing sends

---

## Step 2: Create Email Account

Create a dedicated email address for Teameit (do not use a personal address):

Examples:
- `hello@yourbusiness.com`
- `support@yourbusiness.com`
- `noreply@yourbusiness.com` (for outbound only)

---

## Step 3: Configure App Password (Gmail)

Gmail requires an **App Password** when 2-Step Verification is enabled (SMTP/IMAP with username/password).

**WHERE:** https://myaccount.google.com/apppasswords  
**WHAT TO DO:**
1. Log in with the Gmail account
2. Select App: "Mail"
3. Select Device: "Other (custom name)" → Enter "Teameit"
4. Click "Generate"
5. Copy the 16-character App Password

> [!IMPORTANT]
> Use the App Password as the `password` field in Teameit's email configuration. Do NOT use your regular Gmail password — it will be rejected by modern security.

---

## Step 4: Configure Email in Teameit

Navigate to Teameit → Settings → Integrations → Email Engine → Configure

Enter:
```
SMTP Settings
Host:     smtp.gmail.com
Port:     465
Secure:   true (TLS/SSL)
Username: hello@yourbusiness.com
Password: <your-16-char-app-password>

IMAP Settings
Host:     imap.gmail.com
Port:     993
Secure:   true (TLS/SSL)
```

---

## Common SMTP/IMAP Configuration Reference

### Gmail
```
SMTP: smtp.gmail.com:465 (SSL) or smtp.gmail.com:587 (TLS/STARTTLS)
IMAP: imap.gmail.com:993 (SSL)
Auth: username + App Password
```

### Outlook / Microsoft 365
```
SMTP: smtp-mail.outlook.com:587 (STARTTLS)
IMAP: outlook.office365.com:993 (SSL)
Auth: username + App Password or OAuth
```

### Amazon SES
```
SMTP: email-smtp.<region>.amazonaws.com:465 (TLS) or :587 (STARTTLS)
Auth: SES SMTP credentials (different from AWS access key)
IMAP: Not supported (outbound only)
```

### SendGrid
```
SMTP: smtp.sendgrid.net:465 or :587
Auth: username=apikey, password=<your-sendgrid-api-key>
IMAP: Not supported
```

---

## SPF / DKIM / DMARC (Required for Email Deliverability)

Before sending campaigns at any significant volume, configure these DNS records:

| Record | Purpose | Where to Configure |
|--------|---------|-------------------|
| **SPF** | Declares authorized sending servers | DNS TXT record at your domain |
| **DKIM** | Cryptographically signs your emails | DNS TXT record (key from your email provider) |
| **DMARC** | Policy for failed SPF/DKIM | DNS TXT record |

**Example SPF for Gmail:**
```
TXT record @ yourdomain.com:
v=spf1 include:_spf.google.com ~all
```

**Example DMARC:**
```
TXT record _dmarc.yourdomain.com:
v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com
```

---

## Teameit Environment Variables

```env
# These are stored per-tenant in the database, not in .env
# The .env only needs to know Supabase storage configuration
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
```

Email credentials are stored **per-tenant** in the `integrations` table as encrypted JSON, since each tenant has their own email configuration.

---

## Security Warning

> [!CAUTION]
> Email passwords and SMTP credentials must be stored encrypted in the database. In the current MVP implementation, credentials are stored as plain JSON. Before production, implement encryption using AES-256 or a KMS service.

---

## Official Documentation

- Gmail SMTP Settings: https://support.google.com/a/answer/176600
- Gmail App Passwords: https://support.google.com/accounts/answer/185833
- Amazon SES: https://docs.aws.amazon.com/ses/latest/dg/smtp-credentials.html
- SendGrid SMTP: https://docs.sendgrid.com/for-developers/sending-email/integrating-with-the-smtp-api

---

## Next Step

→ [`02-smtp.md`](./02-smtp.md) — Detailed SMTP configuration and testing
