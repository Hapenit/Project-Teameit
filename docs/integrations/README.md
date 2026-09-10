# Teameit — Integration Documentation Library

> **Last Updated:** 2025-09-01  
> **Status:** CURRENT  
> **Maintained by:** Teameit Engineering Team

This directory contains the complete integration documentation for every external platform connected to Teameit. Each document provides a full implementation guide — from creating a developer account to achieving a tested, production-ready integration.

---

## 📋 How to Use This Documentation

Before connecting any platform, read:

1. [`common/credential-security.md`](./common/credential-security.md) — How to handle secrets safely
2. [`common/oauth-standard.md`](./common/oauth-standard.md) — How Teameit's OAuth flow works
3. [`common/webhook-standard.md`](./common/webhook-standard.md) — How Teameit processes webhooks
4. [`integration-matrix.md`](./integration-matrix.md) — Platform readiness and requirement matrix

---

## 🗂 Documentation Directory

### Meta (Facebook / Instagram / WhatsApp)

| File | Topic | Status |
|------|-------|--------|
| [`meta/01-meta-developer-account.md`](./meta/01-meta-developer-account.md) | Developer account creation | ✅ CURRENT |
| [`meta/02-meta-app-creation.md`](./meta/02-meta-app-creation.md) | App creation & configuration | ✅ CURRENT |
| [`meta/03-facebook-pages.md`](./meta/03-facebook-pages.md) | Facebook Pages connection | ✅ CURRENT |
| [`meta/04-instagram.md`](./meta/04-instagram.md) | Instagram Business connection | ✅ CURRENT |
| [`meta/05-whatsapp.md`](./meta/05-whatsapp.md) | WhatsApp Business Platform | ✅ CURRENT |
| [`meta/06-meta-business-suite.md`](./meta/06-meta-business-suite.md) | Meta Business Suite | ✅ CURRENT |
| [`meta/07-meta-ads.md`](./meta/07-meta-ads.md) | Meta Ads / Ad Accounts | ✅ CURRENT |
| [`meta/08-meta-webhooks.md`](./meta/08-meta-webhooks.md) | Webhook configuration & events | ✅ CURRENT |

### Google

| File | Topic | Status |
|------|-------|--------|
| [`google/01-google-cloud-project.md`](./google/01-google-cloud-project.md) | Google Cloud project setup | ✅ CURRENT |
| [`google/02-google-oauth.md`](./google/02-google-oauth.md) | OAuth 2.0 consent screen & clients | ✅ CURRENT |
| [`google/03-google-ads.md`](./google/03-google-ads.md) | Google Ads API & developer token | ✅ CURRENT |
| [`google/04-google-analytics.md`](./google/04-google-analytics.md) | Google Analytics (GA4) | ✅ CURRENT |
| [`google/05-google-search-console.md`](./google/05-google-search-console.md) | Google Search Console API | ✅ CURRENT |
| [`google/06-google-business-profile.md`](./google/06-google-business-profile.md) | Google Business Profile API | ✅ CURRENT |
| [`google/07-youtube.md`](./google/07-youtube.md) | YouTube Data API | ✅ CURRENT |
| [`google/08-google-adsense.md`](./google/08-google-adsense.md) | Google AdSense API | ✅ CURRENT |
| [`google/09-google-webhooks-and-notifications.md`](./google/09-google-webhooks-and-notifications.md) | Push notifications & webhooks | ✅ CURRENT |

### Email

| File | Topic | Status |
|------|-------|--------|
| [`email/01-email-provider.md`](./email/01-email-provider.md) | Email provider selection | ✅ CURRENT |
| [`email/02-smtp.md`](./email/02-smtp.md) | SMTP configuration | ✅ CURRENT |
| [`email/03-oauth-email.md`](./email/03-oauth-email.md) | Gmail / Outlook OAuth | ✅ CURRENT |
| [`email/04-email-webhooks.md`](./email/04-email-webhooks.md) | Inbound email webhooks | ✅ CURRENT |

### SMS

| File | Topic | Status |
|------|-------|--------|
| [`sms/01-sms-provider.md`](./sms/01-sms-provider.md) | Provider selection & abstraction | ✅ CURRENT |
| [`sms/02-sender-setup.md`](./sms/02-sender-setup.md) | Sender ID & number setup | ✅ CURRENT |
| [`sms/03-api-credentials.md`](./sms/03-api-credentials.md) | API key configuration | ✅ CURRENT |
| [`sms/04-webhooks.md`](./sms/04-webhooks.md) | Delivery report webhooks | ✅ CURRENT |

### Common References

| File | Topic |
|------|-------|
| [`common/oauth-standard.md`](./common/oauth-standard.md) | Teameit OAuth implementation standard |
| [`common/webhook-standard.md`](./common/webhook-standard.md) | Teameit webhook processing standard |
| [`common/credential-security.md`](./common/credential-security.md) | Secrets, encryption, and env var rules |
| [`common/integration-testing.md`](./common/integration-testing.md) | Testing checklists for all integrations |
| [`common/production-checklist.md`](./common/production-checklist.md) | Pre-production requirements |
| [`common/troubleshooting.md`](./common/troubleshooting.md) | Common errors and resolutions |

---

## 🗺 Quick Navigation by Feature

### To connect the Unified Inbox
→ Start with [`meta/05-whatsapp.md`](./meta/05-whatsapp.md), then [`meta/04-instagram.md`](./meta/04-instagram.md), then [`meta/03-facebook-pages.md`](./meta/03-facebook-pages.md), then [`email/02-smtp.md`](./email/02-smtp.md)

### To connect Ads
→ Start with [`meta/07-meta-ads.md`](./meta/07-meta-ads.md) and [`google/03-google-ads.md`](./google/03-google-ads.md)

### To connect Analytics
→ Start with [`google/01-google-cloud-project.md`](./google/01-google-cloud-project.md), then [`google/04-google-analytics.md`](./google/04-google-analytics.md)

### To connect Google Business Profile
→ Read [`google/06-google-business-profile.md`](./google/06-google-business-profile.md) — requires API access approval

### To send Email / SMS Campaigns
→ See [`email/02-smtp.md`](./email/02-smtp.md) and [`sms/01-sms-provider.md`](./sms/01-sms-provider.md)

---

## ⚠️ Important Notes

> [!CAUTION]
> Never place API credentials, client secrets, or access tokens in frontend code (React). All secrets must reside in server-side environment variables only.

> [!IMPORTANT]
> Several platforms (Google Business Profile, Meta WhatsApp) require app review and business verification before production access. Plan for 5–30 business days for these approvals.

> [!WARNING]
> Platform dashboards change frequently. Always verify steps against the official documentation link provided in each guide. If a UI element has moved, check the official docs first.

---

## 📊 Platform Readiness Overview

See [`integration-matrix.md`](./integration-matrix.md) for a full status table.

## Runtime provider configuration

The API fails closed when provider credentials are missing. Configure the
server-side variables in `apps/api/.env.example`; secrets must never be sent
to the frontend. Meta reconnects discover and map Page, Instagram business,
and WhatsApp account IDs. LinkedIn publishing and Twilio SMS are enabled only
when their environment variables and active integration credentials exist.
Google connections are tenant-scoped and use least-privilege scopes for Ads,
GA4, Search Console, Business Profile, AdSense, and YouTube. Resource/report
calls are server-side only; Google Ads scheduled sync additionally requires
`GOOGLE_ADS_DEVELOPER_TOKEN` and `GOOGLE_ADS_CUSTOMER_ID`. Google API access,
Business Profile approval, and OAuth consent verification remain deployment
requirements and cannot be bypassed by the application.

Meta Ads uses the tenant's Meta OAuth connection with `ads_read`, `ads_management`,
and `business_management`. Ad accounts are discovered from `/me/adaccounts` and
stored tenant-scoped; campaign, ad set, ad, creative, budget/status, and insights
requests are proxied server-side through `/api/v1/advertising/meta-ads/*`.
Production use requires a Meta app, business verification, approved Marketing API
permissions, and a real redirect URI configured in the Meta developer console.
