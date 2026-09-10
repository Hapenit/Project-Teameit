# SMTP Configuration — Implementation Guide

> **Last Verified:** 2025-09-01  
> **Status:** CURRENT  
> **Implementation:** Nodemailer + ImapFlow (already in Teameit MVP)

---

## Purpose

Documents the complete SMTP (outbound sending) and IMAP (inbound receiving) implementation in Teameit's Email Engine.

---

## Teameit's Email Stack

```
Outbound (SMTP):  nodemailer
Inbound (IMAP):   imapflow
Connection test:  Both verified during Connect flow
```

---

## Teameit Email Connect Flow (Already Implemented)

```
User fills email config form
         ↓
POST /api/v1/integrations/email
         ↓
Server verifies SMTP (nodemailer.createTransport().verify())
         ↓
Server verifies IMAP (ImapFlow connect + logout)
         ↓
Credentials saved to integrations table
         ↓
IMAP Sync Engine starts polling inbox
         ↓
Inbound emails appear in Teameit Inbox
```

---

## SMTP Configuration (Sending)

```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: config.host,         // e.g., 'smtp.gmail.com'
  port: parseInt(config.port, 10),  // 465 (SSL) or 587 (STARTTLS)
  secure: config.secure,     // true for 465, false for 587
  auth: {
    user: config.user,
    pass: config.password
  },
  // For 587 (STARTTLS):
  // tls: { rejectUnauthorized: true }
});

// Verify connection
await transporter.verify();

// Send email
await transporter.sendMail({
  from: `"${senderName}" <${config.user}>`,
  to: recipientEmail,
  subject: subject,
  html: htmlBody,
  text: textBody  // Plain text fallback
});
```

---

## IMAP Sync Engine (Receiving)

```typescript
import { ImapFlow } from 'imapflow';

const client = new ImapFlow({
  host: config.imapHost,
  port: parseInt(config.imapPort, 10),
  secure: config.imapSecure,
  auth: {
    user: config.user,
    pass: config.password
  },
  logger: false
});

// Connect and sync INBOX
await client.connect();
const lock = await client.getMailboxLock('INBOX');

try {
  // Fetch unseen emails since last sync
  for await (const message of client.fetch({ seen: false }, {
    uid: true,
    flags: true,
    envelope: true,   // From, To, Subject, Date
    source: true,     // Raw email source
    bodyStructure: true
  })) {
    // Process each inbound email:
    await InboxEngine.handleIncomingMessage({
      tenantId,
      contactId: await findOrCreateContact(message.envelope.from[0].address),
      channel: 'email',
      content: message.envelope.subject || '(no subject)',
      externalId: message.uid.toString(),
      messageType: 'email'
    });
    
    // Mark as seen
    await client.messageFlagsAdd(message.uid, ['\\Seen'], { uid: true });
  }
} finally {
  lock.release();
  await client.logout();
}
```

---

## Email Rate Limits

| Provider | Daily Limit | Per-minute Limit |
|----------|-------------|:----------------:|
| Gmail (personal) | 500/day | ~100/min |
| Google Workspace | 2000/day | ~100/min |
| Amazon SES (sandbox) | 200/day | 1/sec |
| Amazon SES (production) | Configurable | Configurable |
| SendGrid (free) | 100/day | — |
| SendGrid (paid) | Plan-based | — |

> [!WARNING]
> Exceeding Gmail's rate limits will result in a 24-hour sending suspension. For campaigns with >500 recipients/day, use Amazon SES or SendGrid.

---

## Email Configuration Form Fields

The Teameit Connect Email modal captures:

| Field | Type | Example |
|-------|------|---------|
| SMTP Host | text | `smtp.gmail.com` |
| SMTP Port | number | `465` |
| Username | text | `support@company.com` |
| Password | password | App Password |
| Secure | checkbox | `true` (SSL) |
| IMAP Host | text | `imap.gmail.com` |
| IMAP Port | number | `993` |
| IMAP Secure | checkbox | `true` |

---

## Troubleshooting

### Problem: SMTP verification fails with "Invalid login"
**Cause:** Wrong password, or Gmail blocking less-secure sign-in  
**Resolution:** Use App Password (not regular Gmail password). Ensure 2FA is enabled on the Gmail account.

### Problem: IMAP connection times out
**Cause:** Port blocked, or wrong host/port combination  
**Resolution:** Try port 993 with `secure: true` first. If that fails, try port 143 with `secure: false`.

### Problem: Inbound emails not appearing in inbox
**Cause:** IMAP polling not running, or emails already marked as read  
**Resolution:** Check that the IMAP sync job is running. Verify emails are UNSEEN in the inbox.

### Problem: "Certificate verify failed" on IMAP
**Cause:** Self-signed TLS certificate on custom IMAP server  
**Resolution:** Add `tls: { rejectUnauthorized: false }` to ImapFlow config (only for trusted private servers).

---

## Official Documentation

- Nodemailer: https://nodemailer.com/about/
- ImapFlow: https://imapflow.com/module-imapflow-ImapFlow.html
- Gmail SMTP: https://support.google.com/a/answer/176600

---

## Next Step

→ [`03-oauth-email.md`](./03-oauth-email.md) — Gmail/Outlook OAuth email connection
