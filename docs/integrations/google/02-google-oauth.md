# Google OAuth 2.0 — Implementation Guide

> **Last Verified:** 2025-09-01  
> **Verified Against:** https://developers.google.com/identity/protocols/oauth2/web-server  
> **Status:** CURRENT  
> **Prerequisite:** [`01-google-cloud-project.md`](./01-google-cloud-project.md)

---

## Purpose

All Google integrations in Teameit use the same OAuth 2.0 authorization code flow with a shared Google Cloud project. This guide documents the complete OAuth implementation including state management, token exchange, refresh, and storage.

---

## OAuth Flow Diagram

```
User clicks "Connect Google [Service]"
         ↓
Backend creates encrypted state:
  { tenantId, provider, nonce, scopes }
         ↓
Redirect to Google:
  https://accounts.google.com/o/oauth2/v2/auth
  ?client_id=<CLIENT_ID>
  &redirect_uri=<REDIRECT_URI>
  &response_type=code
  &scope=<SCOPES>
  &state=<encrypted-state>
  &access_type=offline         ← Required for refresh token
  &prompt=consent              ← Required to receive refresh_token every time
         ↓
User logs in to Google
         ↓
User sees consent screen (scopes requested)
         ↓
User clicks "Allow"
         ↓
Google redirects to:
  https://api.<domain>/api/v1/integrations/google/oauth/callback
  ?code=<authorization-code>
  &state=<same-state>
         ↓
Backend validates state (nonce, tenant ID)
         ↓
Exchange code for tokens:
  POST https://oauth2.googleapis.com/token
         ↓
Receive:
  access_token (1 hour expiry)
  refresh_token (long-lived)
  id_token (user info)
         ↓
Decrypt user info from id_token
         ↓
Store tokens encrypted in database
         ↓
Fetch Google service-specific accounts
         ↓
User selects account/property
         ↓
Connected ✅
```

---

## Step 1: Construct Authorization URL

```typescript
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

function generateGoogleAuthUrl(provider: string, scopes: string[], tenantId: string): string {
  const state = Buffer.from(JSON.stringify({
    tenantId,
    provider,
    nonce: crypto.randomBytes(16).toString('hex')
  })).toString('base64url');

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',      // Always request refresh token
    scope: scopes,
    state: state,
    include_granted_scopes: true  // Incremental authorization
  });
}
```

---

## Step 2: Handle the OAuth Callback

```typescript
// GET /api/v1/integrations/google/oauth/callback
async function handleGoogleCallback(req: Request, res: Response) {
  const { code, state, error } = req.query;

  // Handle user denial
  if (error === 'access_denied') {
    return res.redirect('/integrations?error=denied');
  }

  // Validate state
  const decodedState = JSON.parse(Buffer.from(state as string, 'base64url').toString());
  const { tenantId, provider } = decodedState;

  // Exchange code for tokens
  const { tokens } = await oauth2Client.getToken(code as string);
  
  // Validate id_token to get user info
  const ticket = await oauth2Client.verifyIdToken({
    idToken: tokens.id_token!,
    audience: process.env.GOOGLE_CLIENT_ID
  });
  const payload = ticket.getPayload()!;
  
  // Store tokens
  await storeGoogleTokens({
    tenantId,
    provider,
    accessToken: tokens.access_token!,
    refreshToken: tokens.refresh_token!,
    expiresAt: new Date(tokens.expiry_date!),
    googleEmail: payload.email!,
    googleUserId: payload.sub!
  });

  // Redirect back to frontend
  return res.redirect(`/integrations?connected=${provider}`);
}
```

---

## Step 3: Token Refresh

Google access tokens expire after **1 hour**. Teameit must automatically refresh them.

```typescript
async function getValidAccessToken(tenantId: string, provider: string): Promise<string> {
  const credentials = await getStoredCredentials(tenantId, provider);
  
  if (new Date() < credentials.expires_at) {
    return credentials.access_token;
  }
  
  // Token expired — refresh it
  oauth2Client.setCredentials({
    refresh_token: credentials.refresh_token
  });
  
  const { credentials: newTokens } = await oauth2Client.refreshAccessToken();
  
  // Update stored token
  await updateStoredCredentials(tenantId, provider, {
    access_token: newTokens.access_token!,
    expires_at: new Date(newTokens.expiry_date!)
  });
  
  return newTokens.access_token!;
}
```

---

## Step 4: Scopes Reference

Each Google integration uses specific scopes. Request only what is needed.

| Provider | Scopes |
|----------|--------|
| Google Analytics | `https://www.googleapis.com/auth/analytics.readonly` |
| Search Console | `https://www.googleapis.com/auth/webmasters.readonly` |
| Google Ads | `https://www.googleapis.com/auth/adwords` |
| Business Profile | `https://www.googleapis.com/auth/business.manage` |
| YouTube (read) | `https://www.googleapis.com/auth/youtube.readonly` |
| YouTube (upload) | `https://www.googleapis.com/auth/youtube.upload` |
| AdSense | `https://www.googleapis.com/auth/adsense.readonly` |
| User info (always) | `openid email profile` |

> [!NOTE]
> Always include `openid email profile` to identify the connected Google account.

---

## Incremental Authorization

For Teameit's multi-integration design, use incremental authorization to add scopes without requiring re-login:

```typescript
// First connection (Analytics only)
scope: 'openid email profile https://www.googleapis.com/auth/analytics.readonly'

// Later, adding Search Console
scope: 'https://www.googleapis.com/auth/webmasters.readonly'
// include_granted_scopes: true  ← This adds to existing grants
```

---

## Step 5: Token Revocation on Disconnect

When a user disconnects a Google integration:

```typescript
async function revokeGoogleAccess(tenantId: string, provider: string) {
  const credentials = await getStoredCredentials(tenantId, provider);
  
  // Revoke token with Google
  await oauth2Client.revokeToken(credentials.access_token);
  
  // Remove from database
  await supabaseAdmin
    .from('integrations')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('provider', provider);
}
```

---

## Database Mapping

```
integrations
├── provider: 'google-analytics' | 'google-ads' | 'search-console' | 'gbp' | 'youtube' | 'adsense'
├── tenant_id
├── status

integration_credentials
├── access_token (encrypted)
├── refresh_token (encrypted)
├── external_account_id: Google User ID (sub)
├── expires_at

metadata (JSONB)
├── google_email
├── google_name
├── scopes_granted: [...]
```

---

## Teameit Backend Routes

```
GET  /api/v1/integrations/google/auth-url?provider=<provider>
GET  /api/v1/integrations/google/oauth/callback
DELETE /api/v1/integrations/google/:provider
```

---

## OAuth Verification (Production)

For sensitive or restricted scopes (`adwords`, `business.manage`, `youtube.upload`), Google requires **OAuth App Verification**:

**WHERE:** Google Cloud Console → APIs & Services → OAuth consent screen → Publish App → Submit for Verification

**Requirements:**
- Valid business entity
- Privacy Policy URL (must clearly describe data usage)
- Homepage URL
- App description
- Screencast/demo video for each sensitive scope
- Justification for each restricted scope

**Timeline:** 4–6 weeks

**While pending verification:** Only Test Users can authorize the app. You can test with up to 100 test users.

---

## Troubleshooting

### Problem: No refresh_token in token response
**Cause:** `prompt=consent` was not included in the authorization URL, OR the user has already granted access before  
**Resolution:** Always include `prompt=consent` and `access_type=offline`. If user previously granted, they must revoke and re-grant.

### Problem: `invalid_grant` error on token exchange
**Cause:** Authorization code was already used, or has expired (codes expire in ~10 minutes)  
**Resolution:** Do not reuse codes. Ensure the callback handler runs promptly.

### Problem: `Token has been expired or revoked` on API call
**Cause:** Access token expired and refresh failed (refresh token revoked by user)  
**Resolution:** Mark integration as expired; prompt user to reconnect.

---

## Official Documentation

- OAuth 2.0 Web Server: https://developers.google.com/identity/protocols/oauth2/web-server
- Scopes Reference: https://developers.google.com/identity/protocols/oauth2/scopes
- Token Verification: https://developers.google.com/identity/sign-in/web/backend-auth
- OAuth Verification: https://support.google.com/cloud/answer/9110914

---

## Next Step

Proceed to the specific integration:

- Google Ads → [`03-google-ads.md`](./03-google-ads.md)
- Google Analytics → [`04-google-analytics.md`](./04-google-analytics.md)
- Search Console → [`05-google-search-console.md`](./05-google-search-console.md)
- Google Business Profile → [`06-google-business-profile.md`](./06-google-business-profile.md)
