# Credential Security — Best Practices Guide

> **Last Verified:** 2025-09-01  
> **Status:** CURRENT

---

## Purpose

This document defines how credentials, API keys, tokens, and secrets must be handled in Teameit. Violation of these rules can lead to security breaches, unauthorized API usage, and data leaks.

---

## The Three Rules

1. **Never put secrets in frontend code** — React/browser code is public
2. **Never commit secrets to git** — Even in private repos; use environment variables
3. **Encrypt tokens at rest** — Database-stored tokens must be encrypted

---

## Credential Classification

| Type | Classification | Storage |
|------|---------------|---------|
| OAuth Client ID | Semi-public (keep server-side) | Server env var |
| OAuth Client Secret | SECRET | Server env var only |
| OAuth Access Token | SENSITIVE | Encrypted in DB |
| OAuth Refresh Token | SENSITIVE | Encrypted in DB |
| Meta App Secret | SECRET | Server env var only |
| WhatsApp System Token | SECRET | Server env var only |
| Google Ads Dev Token | SECRET | Server env var only |
| Twilio Auth Token | SECRET | Server env var only |
| Webhook Verify Tokens | SECRET | Server env var only |
| Supabase Anon Key | Public (safe for frontend) | Frontend env |
| Supabase Service Role Key | SECRET | Server env var only |

---

## Environment Variable Security

### Development Setup

```bash
# .env file (NEVER commit this file to git)
# Add .env to .gitignore immediately

echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
```

### What .env Should Look Like

```env
# PUBLIC (can be exposed to frontend)
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# SERVER ONLY — never use VITE_ prefix for secrets
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # SECRET

META_APP_ID=1234567890                  # Server only
META_APP_SECRET=abc123...               # SECRET
META_WHATSAPP_SYSTEM_TOKEN=EAA...       # SECRET
META_WEBHOOK_VERIFY_TOKEN=random123     # SECRET

GOOGLE_CLIENT_ID=xxx.apps.googleusercon # Server only
GOOGLE_CLIENT_SECRET=GOCSPX-...         # SECRET
GOOGLE_ADS_DEVELOPER_TOKEN=xxx          # SECRET

TWILIO_ACCOUNT_SID=ACxxx                # Server only
TWILIO_AUTH_TOKEN=xxx                   # SECRET

OAUTH_STATE_SECRET=<256-bit-hex>        # SECRET — generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> [!CAUTION]
> In Vite/React, any environment variable prefixed with `VITE_` is bundled into the frontend JavaScript and is publicly visible. NEVER use `VITE_` prefix for secrets.

---

## Token Encryption at Rest

The current MVP stores email credentials as plain JSON in the database. Before production:

**Option 1 — Application-level AES-256-GCM:**
```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // 32 bytes

function encrypt(text: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':');
}

function decrypt(encryptedText: string): string {
  const [ivHex, tagHex, dataHex] = encryptedText.split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return decipher.update(dataHex, 'hex', 'utf8') + decipher.final('utf8');
}
```

**Option 2 — AWS KMS (Production Recommended)**
```typescript
import { KMSClient, EncryptCommand, DecryptCommand } from "@aws-sdk/client-kms";
// Use AWS KMS for envelope encryption of sensitive tokens
```

**Option 3 — Supabase Vault**
Supabase provides a built-in secrets vault for encrypted storage.

---

## Git Security

```bash
# Check if any secrets were accidentally committed
git log --all --full-history -- "*.env"
git grep -i "secret\|password\|token\|api_key" -- "*.ts" "*.tsx" "*.js"

# If secrets found in history, use BFG Repo Cleaner:
# https://rtyley.github.io/bfg-repo-cleaner/
```

---

## Production Secret Management

| Option | Description | Complexity |
|--------|-------------|:----------:|
| Railway Environment Variables | Simple, per-environment | Low |
| Vercel Environment Variables | Built-in for Vercel deployments | Low |
| AWS Secrets Manager | Full-featured rotation | Medium |
| HashiCorp Vault | Self-hosted, enterprise | High |
| Infisical | Open-source, developer-friendly | Low-Medium |

---

## Security Checklist

```
Credential Security Checklist
☐ .env added to .gitignore
☐ No secrets in React VITE_ environment variables
☐ No secrets hardcoded in TypeScript/JavaScript files
☐ Database credentials are encrypted (or plan exists)
☐ Webhook verify tokens are random strings (not guessable)
☐ App Secret not exposed in frontend network requests
☐ OAuth state is signed/encrypted to prevent CSRF
☐ Production uses proper secret management service
☐ Rotation plan exists for all secrets
☐ Access tokens are encrypted in integration_credentials table
```
## Credential encryption

Integration credentials are encrypted server-side with AES-256-GCM before persistence.
Set `SERVER_ENCRYPTION_KEY` (a base64-encoded 32-byte random value) in every API
instance. Existing legacy plaintext rows remain readable for migration; reconnecting
an integration rewrites them encrypted. Never log or expose credential columns.

Tenant context is derived from the authenticated user's membership. `x-tenant-id`
is accepted only as a selector and is rejected unless that user is an active member.
