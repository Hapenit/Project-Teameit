# Email Inbound Processing — Webhooks & IMAP Polling

> **Last Verified:** 2025-09-01  
> **Status:** CURRENT

---

## Purpose

Explains how Teameit receives inbound email replies and processes them into the Unified Inbox.

---

## Inbound Email Strategy

Teameit uses **IMAP polling** (not webhooks) to receive inbound emails. This is because most email providers (Gmail, Outlook, Zoho) do not provide push webhooks for IMAP mailboxes.

```
Customer sends email reply
         ↓
Email lands in business inbox (Gmail/Outlook/etc.)
         ↓
Teameit IMAP Sync Engine polls every N minutes
         ↓
Fetches UNSEEN messages
         ↓
Parses: From, Subject, Body
         ↓
Finds/creates Contact in CRM
         ↓
Creates Message in conversations table
         ↓
Appears in Teameit Unified Inbox
```

---

## IMAP Sync Engine

The sync is implemented in `apps/api/src/modules/inbox/ImapSyncEngine.ts`.

### Sync Schedule

```typescript
// Run IMAP sync for all tenants with active email integrations
// Recommended: every 2-5 minutes for near-real-time experience
import cron from 'node-cron';

cron.schedule('*/3 * * * *', async () => {
  await ImapSyncEngine.syncAll();
});
```

### Sync Logic

```typescript
class ImapSyncEngine {
  static async syncAll() {
    // Fetch all tenants with active email integrations
    const { data: integrations } = await supabaseAdmin
      .from('integrations')
      .select('*, integration_credentials(*)')
      .eq('provider', 'email')
      .eq('status', 'active');

    for (const integration of integrations) {
      await this.syncMailbox(integration);
    }
  }

  static async syncMailbox(integration: any) {
    const creds = integration.credentials;
    const client = new ImapFlow({
      host: creds.imapHost,
      port: parseInt(creds.imapPort),
      secure: creds.imapSecure,
      auth: { user: creds.user, pass: creds.password },
      logger: false
    });

    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    
    try {
      for await (const message of client.fetch({ seen: false }, { 
        uid: true, envelope: true, bodyParts: ['1'] 
      })) {
        // Idempotency: skip if already processed
        const externalId = `email_${message.uid}_${creds.user}`;
        
        await InboxEngine.handleIncomingMessage({
          tenantId: integration.tenant_id,
          contactId: await findOrCreateContactByEmail(
            integration.tenant_id,
            message.envelope.from[0].address,
            message.envelope.from[0].name
          ),
          channel: 'email',
          content: message.envelope.subject || '(no subject)',
          externalId,
          messageType: 'email'
        });
        
        // Mark as read to prevent reprocessing
        await client.messageFlagsAdd(message.uid, ['\\Seen'], { uid: true });
      }
    } finally {
      lock.release();
      await client.logout();
    }
  }
}
```

---

## Alternative: Inbound Email via SMTP Server / Webhook

For providers that support inbound email webhooks (e.g., **SendGrid Inbound Parse**, **Mailgun Inbound Routes**, **Postmark Inbound**):

```
Inbound email arrives at provider
         ↓
Provider POSTs parsed email data to:
POST https://api.<your-domain>/api/v1/webhooks/email/inbound
         ↓
Teameit processes and routes to Inbox
```

**Example: SendGrid Inbound Parse Webhook Payload**
```json
{
  "from": "customer@example.com",
  "to": "support@yourbusiness.com",
  "subject": "Re: Your order",
  "text": "Thank you for your quick response...",
  "html": "<html>...",
  "headers": "...",
  "attachments": "0"
}
```

**Setup for SendGrid Inbound:**
1. Verify your domain in SendGrid
2. Settings → Inbound Parse → Add Host & URL
3. Hostname: `inbound.yourdomain.com`
4. URL: `https://api.<your-domain>/api/v1/webhooks/email/inbound`
5. Set up MX record: `inbound.yourdomain.com → mx.sendgrid.net`

---

## Email Thread Matching

When an inbound email arrives, Teameit should match it to an existing conversation:

```typescript
// Find existing open conversation for this contact+channel
// Match by email address and optionally by subject (In-Reply-To header)
const conversation = await supabaseAdmin
  .from('conversations')
  .select('id')
  .eq('tenant_id', tenantId)
  .eq('contact_id', contactId)
  .eq('channel', 'email')
  .eq('status', 'open')
  .single();
```

---

## Official Documentation

- SendGrid Inbound Parse: https://docs.sendgrid.com/for-developers/parsing-email/inbound-email
- Mailgun Inbound Routes: https://documentation.mailgun.com/en/latest/user_manual.html#receiving-forwarding-and-storing-messages
- ImapFlow: https://imapflow.com/

---

## Next Step

SMS provider setup → [`../sms/01-sms-provider.md`](../sms/01-sms-provider.md)
