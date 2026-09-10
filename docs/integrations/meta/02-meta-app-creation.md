# Meta App Creation — Setup Guide

> **Last Verified:** 2025-09-01  
> **Verified Against:** https://developers.facebook.com/docs/development/create-an-app/  
> **Status:** CURRENT  
> **Prerequisite:** [`01-meta-developer-account.md`](./01-meta-developer-account.md) must be completed first.

---

## Purpose

A Meta App is the registration unit through which Teameit accesses all Meta APIs — Facebook Pages, Instagram, WhatsApp Business Platform, and Meta Ads. The App produces an **App ID** and **App Secret** which are Teameit's primary credentials for all Meta integrations.

One Meta App can power all Meta integrations in Teameit. You do not need separate apps for Facebook, Instagram, and WhatsApp.

---

## Account Hierarchy

```
Meta Developer Account (your Facebook account)
         ↓
    Meta App (App ID + App Secret)
         ↓
    Business Portfolio (linked)
         ↓
    ┌────────────────────────────────┐
    │  Facebook Pages                │
    │  Instagram Accounts            │
    │  WhatsApp Business Accounts    │
    │  Ad Accounts                   │
    └────────────────────────────────┘
```

---

## Step 1: Create the Meta App

### 1.1 — Navigate to App Dashboard

**WHERE:** https://developers.facebook.com/apps/  
**WHAT TO DO:** Click **"Create App"**

### 1.2 — Select Use Case

**WHERE:** "What do you want your app to do?" screen  
**WHAT TO SELECT:**

For Teameit, select **"Other"** (unless you want to start specifically with WhatsApp, in which case select "Connect with customers through WhatsApp").

> [!NOTE]
> Selecting "Other" gives you the most flexibility to add multiple products (WhatsApp, Instagram, Messenger, Ads) to the same app later.

**Expected Result:** You proceed to the App Type selection screen.

### 1.3 — Select App Type

**WHERE:** "Select an app type" screen  
**WHAT TO SELECT:** **"Business"**

**Why:** The Business type allows you to access business-level APIs including WhatsApp Business Platform, Instagram Graph API, Facebook Pages API, and Ads API. This is the correct type for Teameit.

### 1.4 — Fill in App Details

**WHERE:** App Details form  
**WHAT TO ENTER:**

| Field | Value | Notes |
|-------|-------|-------|
| App Name | `Teameit` or `Teameit [Your Company]` | Visible to users during OAuth |
| App Contact Email | Your business email | Used for Meta communications |
| Business Portfolio | Select your Meta Business Manager | Must exist; create one first if needed |

**Expected Result:** App is created and you are taken to the App Dashboard with your new **App ID** shown.

---

## Step 2: Collect App Credentials

### 2.1 — Find App ID

**WHERE:** App Dashboard → left sidebar shows App ID at the top, OR: Settings → Basic  
**WHAT TO COPY:** The numeric **App ID** (e.g., `1234567890123456`)

### 2.2 — Find App Secret

**WHERE:** Settings → Basic → App Secret → Click **"Show"**  
**WHAT TO COPY:** The App Secret (a long alphanumeric string)

> [!CAUTION]
> The App Secret is a **server-only secret**. NEVER put this in your React frontend. NEVER commit it to git. Store it only in your server's environment variables.

---

## Step 3: Configure Basic App Settings

**WHERE:** Settings → Basic

Fill in the following fields:

| Field | Value | Required? |
|-------|-------|:---------:|
| Display Name | `Teameit` | ✅ |
| Namespace | (optional, e.g., `teameit`) | ❌ |
| App Domains | `yourdomain.com`, `api.yourdomain.com` | ✅ for production |
| Privacy Policy URL | `https://yourdomain.com/privacy` | ✅ for app review |
| Terms of Service URL | `https://yourdomain.com/terms` | ✅ for app review |
| User Data Deletion URL | `https://yourdomain.com/data-deletion` | ✅ for app review |
| App Icon | 1024×1024 PNG, no alpha channel | ✅ for app review |
| Category | `Business` | ✅ |
| Contact Email | Your admin email | ✅ |

> [!IMPORTANT]
> The Privacy Policy, Terms of Service, and Data Deletion URLs **must be live, publicly accessible HTTPS URLs** before you can submit for App Review. Prepare these pages before production.

---

## Step 4: Configure OAuth Redirect URIs

**WHERE:** Settings → Basic → Website → Site URL  
AND  
**WHERE:** Each product's OAuth settings (added per product, e.g., Facebook Login → Valid OAuth Redirect URIs)

**WHAT TO ENTER:**

For development:
```
http://localhost:3001/api/v1/integrations/meta/oauth/callback
```

For production:
```
https://api.<your-teameit-domain>/api/v1/integrations/meta/oauth/callback
```

> [!WARNING]
> Meta requires HTTPS for production redirect URIs. Localhost is allowed only in Development mode.

---

## Step 5: Add Facebook Login Product

Facebook Login is the OAuth mechanism that powers all Meta integrations.

**WHERE:** App Dashboard → Add Product → Find "Facebook Login" → Click "Set Up"  
**WHAT TO DO:**
1. Select **"Web"** as the platform
2. Enter your Site URL: `https://yourdomain.com`
3. Navigate to: Facebook Login → Settings in the left sidebar
4. Under **Valid OAuth Redirect URIs**, add:
   - `http://localhost:3001/api/v1/integrations/meta/oauth/callback` (development)
   - `https://api.<your-domain>/api/v1/integrations/meta/oauth/callback` (production)
5. Toggle **"Login with the JavaScript SDK"** → OFF (Teameit uses server-side OAuth)
6. Click **Save Changes**

---

## Step 6: Set App Mode

**WHERE:** Top of the App Dashboard — toggle between **"Development"** and **"Live"**

| Mode | Behavior |
|------|---------|
| **Development** | Only users added as Testers/Developers/Admins in the app can authorize. APIs are available with test data. |
| **Live** | Any user can authorize. Requires App Review for advanced permissions. |

**During development:** Keep in Development mode.  
**Before production:** Switch to Live mode AFTER completing App Review.

---

## Step 7: Add App Roles (Testers)

For development mode, only listed users can connect.

**WHERE:** Roles (left sidebar) → Add Testers  
**WHAT TO DO:** Enter the Facebook profiles of developers who need to test the integration.

---

## Teameit Environment Variables

```env
# Server-only — NEVER expose to frontend
META_APP_ID=<your-app-id>
META_APP_SECRET=<your-app-secret>
META_REDIRECT_URI=https://api.<your-domain>/api/v1/integrations/meta/oauth/callback
```

| Variable | Visibility | Required |
|----------|------------|:--------:|
| `META_APP_ID` | Server only | ✅ |
| `META_APP_SECRET` | Server only — SECRET | ✅ |
| `META_REDIRECT_URI` | Server only | ✅ |

---

## Database Mapping

When Teameit connects a Meta integration, the following is stored:

```
integrations table
├── provider: 'facebook' | 'instagram' | 'whatsapp' | 'meta-ads'
├── tenant_id: (UUID)
├── status: 'active' | 'expired' | 'disconnected'
└── created_at

integration_credentials table
├── integration_id: (FK)
├── access_token: (encrypted)
├── refresh_token: (encrypted, if available)
├── external_account_id: (Facebook User ID / Page ID / WABA ID)
└── expires_at
```

---

## Verify App Setup

```
App Creation Checklist
☐ Meta Developer account registered
☐ App created with Business type
☐ App ID collected
☐ App Secret collected and stored securely in .env
☐ Privacy Policy URL configured
☐ Terms of Service URL configured
☐ Data Deletion URL configured
☐ Facebook Login product added
☐ OAuth redirect URIs configured
☐ App in Development mode
☐ Testers added for development testing
```

---

## Products to Add (Per Integration)

The following products will be added to THIS SAME APP as you set up each integration:

| Product | Integration Guide |
|---------|------------------|
| Facebook Login | This guide (already added) |
| Messenger | [`03-facebook-pages.md`](./03-facebook-pages.md) |
| Instagram Graph API | [`04-instagram.md`](./04-instagram.md) |
| WhatsApp Business Platform | [`05-whatsapp.md`](./05-whatsapp.md) |
| Marketing API | [`07-meta-ads.md`](./07-meta-ads.md) |
| Webhooks | [`08-meta-webhooks.md`](./08-meta-webhooks.md) |

---

## Troubleshooting

### Problem: Business Portfolio not appearing in the dropdown
**Cause:** No Meta Business Manager account linked to your Facebook account  
**Resolution:** Create a Business Manager at https://business.facebook.com/ before creating the app.

### Problem: App Secret shows as "••••••••"
**Cause:** Normal — you must click "Show" and may be asked to re-enter your Facebook password  
**Resolution:** Click "Show" and enter your Facebook password to reveal it.

### Problem: Redirect URI mismatch error during OAuth
**Cause:** The URI in Teameit's backend `.env` does not exactly match what is configured in Facebook Login settings  
**Resolution:** Ensure URI is character-for-character identical, including trailing slashes and protocol.

---

## Official Documentation

- Create an App: https://developers.facebook.com/docs/development/create-an-app/
- App Dashboard: https://developers.facebook.com/apps/
- App Types: https://developers.facebook.com/docs/development/create-an-app/app-dashboard/app-types
- Facebook Login Setup: https://developers.facebook.com/docs/facebook-login/web/

---

## Next Steps

After completing this guide, proceed to whichever integration you need:

- Facebook Pages → [`03-facebook-pages.md`](./03-facebook-pages.md)
- Instagram → [`04-instagram.md`](./04-instagram.md)
- WhatsApp → [`05-whatsapp.md`](./05-whatsapp.md)
