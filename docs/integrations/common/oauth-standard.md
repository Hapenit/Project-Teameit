# OAuth 2.0 Standard — Teameit Implementation Reference

> **Last Verified:** 2025-09-01  
> **Status:** CURRENT

---

## Purpose

This document defines the standard OAuth 2.0 implementation used across all Teameit integrations. All platform-specific OAuth implementations follow this pattern.

---

## Standard OAuth Flow

```
User clicks "Connect [Platform]"
         ↓
GET /api/v1/integrations/<provider>/auth-url
         ↓
Backend creates state:
  {
    tenantId: "uuid",
    provider: "meta | google | ...",
    nonce: "random-16-bytes-hex",
    timestamp: Date.now()
  }
  → Encrypt state with SERVER_SECRET
  → Base64URL encode
         ↓
Return { url: "<provider-auth-url>?...&state=<encrypted-state>" }
         ↓
Frontend: window.location.href = url
         ↓
[User authorizes on provider]
         ↓
Provider redirects to:
  GET /api/v1/integrations/<provider>/oauth/callback
  ?code=<auth-code>&state=<encrypted-state>
         ↓
Backend:
  1. Decode + decrypt state
  2. Validate nonce is not reused (cache for 10 min)
  3. Validate timestamp < 10 minutes old
  4. Exchange code for tokens
  5. Decrypt user identity from token
  6. Upsert credentials in database
  7. Redirect to frontend: /integrations?connected=<provider>
```

---

## State Security Requirements

```typescript
// State creation
const state = {
  tenantId,
  provider,
  nonce: crypto.randomBytes(16).toString('hex'),
  timestamp: Date.now()
};

// Encrypt using AES-256-GCM or HMAC-signed JWT
const encryptedState = jwt.sign(state, process.env.OAUTH_STATE_SECRET!, { expiresIn: '10m' });
const urlSafeState = Buffer.from(encryptedState).toString('base64url');

// State validation
function validateState(stateParam: string): OAuthState {
  const decoded = Buffer.from(stateParam, 'base64url').toString();
  return jwt.verify(decoded, process.env.OAUTH_STATE_SECRET!) as OAuthState;
  // JWT expiry check handles timestamp validation
}
```

---

## Token Storage Standard

```typescript
interface StoredCredentials {
  access_token: string;     // Encrypt before storing
  refresh_token?: string;   // Encrypt before storing
  expires_at: Date;
  scopes: string[];
  external_account_id: string;  // Provider user/account ID
  provider_metadata: Record<string, any>;  // Provider-specific data
}

// Minimum encryption: AES-256-GCM
// Production recommendation: AWS KMS or HashiCorp Vault
```

---

## Environment Variables Required

```env
# OAuth state signing
OAUTH_STATE_SECRET=<random-256-bit-hex-string>

# Per-provider credentials
META_APP_ID=
META_APP_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

---

## Error Handling

| Error | Cause | Response |
|-------|-------|----------|
| `access_denied` | User denied permissions | Redirect to `/integrations?error=denied` |
| `invalid_state` | State tampered or expired | Return 400 |
| `invalid_grant` | Code expired or reused | Return 400, ask user to retry |
| `server_error` | Provider error | Return 500, log error |

---

## Disconnect Standard

```typescript
async function disconnectIntegration(tenantId: string, provider: string) {
  // 1. Attempt to revoke token with provider (best effort)
  try { await revokeProviderToken(provider, tenantId); } catch {}
  
  // 2. Mark integration as disconnected (don't delete historical data)
  await supabaseAdmin
    .from('integrations')
    .update({ status: 'disconnected' })
    .eq('tenant_id', tenantId)
    .eq('provider', provider);

  // 3. Delete credentials (but keep integration record for audit)
  await supabaseAdmin
    .from('integration_credentials')
    .delete()
    .eq('integration_id', integrationId);
}
```

---

## Token Expiry Handling

```
API call fails with 401
         ↓
Check if refresh_token exists
         ↓
    YES: Attempt refresh
         ↓
    Refresh success → retry API call
         ↓
    Refresh fail → mark integration 'expired'
         ↓
         NO: Mark integration 'expired'
         ↓
Send notification to tenant admin:
"Your [Platform] connection has expired. Please reconnect."
```
