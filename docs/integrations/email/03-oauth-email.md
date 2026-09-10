# OAuth Email Connection — Gmail & Outlook

> **Last Verified:** 2025-09-01  
> **Status:** CURRENT

---

## Purpose

For enhanced security (especially for Gmail and Outlook), Teameit can optionally use OAuth 2.0 instead of username/password for email access. This eliminates the need for App Passwords.

---

## When to Use OAuth Email vs. App Password

| Method | Pros | Cons |
|--------|------|------|
| App Password (SMTP/IMAP) | Simple, universal | Password stored (even if encrypted) |
| OAuth (Gmail) | No password stored, more secure | Requires Google Cloud setup |
| OAuth (Outlook) | No password stored | Requires Azure App registration |

**Recommendation:** Use App Password for simplicity in MVP. Upgrade to OAuth in production for enhanced security.

---

## Gmail OAuth Email

### Additional Scopes Required

```typescript
scope: [
  'openid', 'email', 'profile',
  'https://mail.google.com/'  // Full Gmail access (IMAP + SMTP)
]
```

> [!WARNING]
> `https://mail.google.com/` is a **restricted scope** and requires Google OAuth app verification. This can take 4-6 weeks.

### Using OAuth with Nodemailer

```typescript
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: userEmail,
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: storedRefreshToken,
    accessToken: await getValidAccessToken(tenantId, 'gmail')
  }
});
```

### Using OAuth with ImapFlow

```typescript
const client = new ImapFlow({
  host: 'imap.gmail.com',
  port: 993,
  secure: true,
  auth: {
    user: userEmail,
    accessToken: await getValidAccessToken(tenantId, 'gmail')
  }
});
```

---

## Outlook OAuth Email

### Azure App Registration Required

**WHERE:** https://portal.azure.com/ → Azure Active Directory → App registrations → New registration

**Configure:**
- Redirect URI: `https://api.<your-domain>/api/v1/integrations/outlook/oauth/callback`
- Scopes: `Mail.Send`, `Mail.Read`, `IMAP.AccessAsUser.All`, `SMTP.Send`

**Environment Variables:**
```env
AZURE_CLIENT_ID=<your-azure-client-id>
AZURE_CLIENT_SECRET=<your-azure-client-secret>
AZURE_REDIRECT_URI=https://api.<your-domain>/api/v1/integrations/outlook/oauth/callback
```

---

## Implementation Note

For the Teameit MVP, **App Password (SMTP/IMAP)** is implemented and fully functional. OAuth email is a future enhancement recommended for production security hardening.

---

## Official Documentation

- Gmail OAuth for IMAP/SMTP: https://developers.google.com/gmail/imap/xoauth2-protocol
- Nodemailer OAuth2: https://nodemailer.com/smtp/oauth2/
- Microsoft Graph Mail API: https://learn.microsoft.com/en-us/graph/api/resources/mail-api-overview

---

## Next Step

→ [`04-email-webhooks.md`](./04-email-webhooks.md) — Inbound email webhook handling
