# Meta Developer Account — Setup Guide

> **Last Verified:** 2025-09-01  
> **Verified Against:** https://developers.facebook.com/docs/  
> **Status:** CURRENT  
> **API Version:** Meta Graph API v21.0+

---

## Purpose

A Meta Developer Account is the foundation for all Meta integrations in Teameit. Without it, you cannot create a Meta App, access the Graph API, configure webhooks, or connect Facebook Pages, Instagram, WhatsApp, or Meta Ads.

**This account must be created FIRST before any Meta integration.**

---

## What Teameit Uses This For

- Creating and managing the Meta App
- Accessing the Meta Graph API
- Managing app credentials (App ID / App Secret)
- Configuring webhooks for all Meta platforms
- Submitting apps for review (required for production)
- Managing development vs. production mode

---

## Account Prerequisites

| Requirement | Details |
|-------------|---------|
| Personal Facebook Account | Required — a real, verified Facebook account |
| Age | Must be 18+ |
| Identity Verification | Meta may require phone/identity verification |
| Valid Email | Must be on the Facebook account |
| Two-Factor Authentication | Strongly recommended; may be required for advanced features |
| Business Manager | Recommended — required for Business Verification |

> [!IMPORTANT]
> The Meta Developer account is tied to your **personal Facebook account**. Do NOT create a fake Facebook account for this purpose. Use a legitimate business administrator's personal account.

---

## Step 1: Register as a Meta Developer

### 1.1 — Access the Meta Developer Portal

**WHERE:** https://developers.facebook.com/  
**WHAT TO DO:** Click **"Get Started"** in the top-right corner.

**Expected Result:** You are prompted to log in with your Facebook account or confirm your existing login.

### 1.2 — Accept Developer Terms

**WHERE:** Registration page  
**WHAT TO DO:**
1. Review the **Meta Platform Terms**
2. Review the **Developer Policies**
3. Tick the acceptance checkbox
4. Click **"Continue"**

**Expected Result:** Terms are accepted and you proceed to profile setup.

### 1.3 — Verify Your Phone Number

**WHERE:** Verification screen  
**WHAT TO DO:**
1. Enter your phone number (must not already be a WhatsApp number on the account, if using a different one)
2. Receive the OTP via SMS
3. Enter the OTP

**Expected Result:** Phone number is verified. You are taken to the Developer Dashboard.

### 1.4 — Complete Developer Profile

**WHERE:** Developer registration completion screen  
**WHAT TO DO:**
1. Select your **occupation** from the dropdown (e.g., "Software Developer", "Business Owner")
2. Click **"Complete Registration"**

**Expected Result:** Your Meta Developer account is active. You now have access to the **App Dashboard**.

---

## Step 2: Enable Two-Factor Authentication (Strongly Recommended)

### 2.1 — Enable 2FA on Facebook

**WHERE:** https://www.facebook.com/settings/?tab=security → Security and Login → Two-Factor Authentication  
**WHAT TO DO:**
1. Click **"Edit"** next to Two-Factor Authentication
2. Select your preferred method (Authentication App recommended)
3. Follow the prompts to complete setup

**Why:** Meta may block certain developer operations from accounts without 2FA. It also protects your app credentials.

---

## Step 3: Verify Developer Account Setup

✅ Verify Checklist:

```
Developer Account Ready
☐ Personal Facebook account logged in
☐ Meta Developer registration completed
☐ Phone number verified
☐ Developer profile occupation selected
☐ App Dashboard accessible at https://developers.facebook.com/apps/
☐ Two-Factor Authentication enabled on Facebook account
```

---

## Step 4: Access the Meta App Dashboard

**WHERE:** https://developers.facebook.com/apps/  
**WHAT TO SEE:** A dashboard showing your apps (empty if this is new). You should see a **"Create App"** button.

---

## Environment Variables

No environment variables are required at this stage. App ID and App Secret are collected during App Creation (see `02-meta-app-creation.md`).

---

## Important Account Concepts

Understand these before proceeding:

| Concept | Description |
|---------|-------------|
| **Meta Developer Account** | The developer-level identity (your personal Facebook account with developer access) |
| **Meta App** | A software application registered with Meta that gets its own App ID/Secret |
| **Meta Business Manager** | A separate business entity that owns business assets (Pages, Instagram, WhatsApp, Ad Accounts) |
| **App Mode** | Development vs. Live — in development mode, only testers added to the app can use it |

---

## Troubleshooting

### Problem: Cannot access developers.facebook.com
**Cause:** Facebook account may be restricted or flagged  
**Resolution:** Ensure your Facebook account is in good standing. Try a different browser. Verify you are not behind a VPN that Meta blocks.

### Problem: Phone verification is failing
**Cause:** The number may already be registered or in a restricted region  
**Resolution:** Use a different phone number. Try voice call OTP instead of SMS.

### Problem: Developer registration shows error
**Cause:** Facebook account does not meet age or identity requirements  
**Resolution:** Ensure the Facebook account is real, age-verified, and has been active for some time.

---

## Official Documentation

- Meta for Developers Portal: https://developers.facebook.com/
- Meta Platform Terms: https://developers.facebook.com/terms/
- Meta Developer Policies: https://developers.facebook.com/devpolicy/
- Getting Started with Meta APIs: https://developers.facebook.com/docs/development/

---

## Next Step

After completing this guide, proceed to:  
→ [`02-meta-app-creation.md`](./02-meta-app-creation.md)
