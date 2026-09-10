# Integration Matrix — Teameit Platform Requirements

> **Last Verified:** 2025-09-01  
> **Status:** CURRENT

This matrix summarizes the setup requirements, review processes, and current readiness level for every integration in Teameit.

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Required / Present / Yes |
| ❌ | Not required / Not present |
| ⚠️ | Required in some cases |
| 🔒 | Required for production, not development |
| VERIFY REQUIRED | Cannot confirm without live account check |

---

## Platform Requirements Matrix

| Platform | Developer Account | App / Project | OAuth | Webhook | API Review Required | Business Verification Required | Teameit Features |
|----------|:-----------------:|:-------------:|:-----:|:-------:|:-------------------:|:------------------------------:|-----------------|
| **Meta (Developer)** | ✅ Personal Facebook | ✅ Meta App | ✅ | ✅ | ✅ for advanced | ⚠️ recommended | Foundation for all Meta |
| **Facebook Pages** | ✅ | ✅ Meta App | ✅ `pages_messaging` | ✅ | 🔒 Production | 🔒 Production | Messenger Inbox, Publishing |
| **Instagram** | ✅ | ✅ Meta App | ✅ `instagram_basic` | ✅ | 🔒 Production | 🔒 Production | DM Inbox, Publishing, Comments |
| **WhatsApp Business** | ✅ | ✅ Meta App | ✅ `whatsapp_business_messaging` | ✅ | ✅ Always | ✅ Required | WhatsApp Inbox, Campaigns, Templates |
| **Meta Business Suite** | ✅ | ✅ Meta App | ✅ `business_management` | ❌ | ✅ | ✅ Required | Asset management, Unified view |
| **Meta Ads** | ✅ | ✅ Meta App | ✅ `ads_management` | ❌ | 🔒 Production | ✅ Required | Ads Dashboard, Campaign Sync |
| **Google Cloud** | ✅ Google Account | ✅ GCP Project | ❌ (enables OAuth) | ❌ | ❌ | ❌ | Foundation for all Google |
| **Google OAuth** | ✅ | ✅ GCP Project | ✅ | ❌ | ⚠️ Sensitive scopes | ❌ | Foundation for all Google auth |
| **Google Ads** | ✅ Google Account | ✅ GCP Project | ✅ | ❌ | ✅ Developer Token | ❌ | Ads Dashboard, Campaign Sync |
| **Google Analytics (GA4)** | ✅ | ✅ GCP Project | ✅ `analytics.readonly` | ❌ | ❌ | ❌ | Analytics Dashboard |
| **Google Search Console** | ✅ | ✅ GCP Project | ✅ `webmasters.readonly` | ❌ | ❌ | ❌ | SEO Dashboard |
| **Google Business Profile** | ✅ | ✅ GCP Project | ✅ `business.manage` | VERIFY REQUIRED | ✅ API Access Request | ❌ | GBP Posts, Reviews, Analytics |
| **YouTube Data API** | ✅ | ✅ GCP Project | ✅ `youtube.readonly` | ❌ | ❌ | ❌ | Channel Analytics, Publishing |
| **Google AdSense** | ✅ AdSense account | ✅ GCP Project | ✅ `adsense.readonly` | ❌ | ❌ | ❌ | Revenue Dashboard |
| **Email (SMTP/IMAP)** | ❌ | ❌ | ⚠️ Gmail/Outlook | ❌ (IMAP polling) | ❌ | ❌ | Email Campaigns, Inbox |
| **SMS Provider (Twilio)** | ✅ Twilio account | ✅ env configured | ❌ | ✅ Delivery webhooks | ⚠️ Provider-specific | ⚠️ DLT (India) | SMS Campaigns, Automation |

---

## Permission / Scope Summary

### Meta Permissions Required

| Scope | Platform | Required For | Review Required? |
|-------|----------|--------------|:----------------:|
| `pages_messaging` | Facebook | Send/receive Messenger messages | 🔒 Production |
| `pages_read_engagement` | Facebook | Read page comments | 🔒 Production |
| `pages_manage_posts` | Facebook | Create/schedule page posts | 🔒 Production |
| `instagram_basic` | Instagram | Connect Instagram account | 🔒 Production |
| `instagram_manage_messages` | Instagram | Send/receive DMs | 🔒 Production |
| `instagram_manage_comments` | Instagram | Reply to comments | 🔒 Production |
| `instagram_content_publish` | Instagram | Publish posts/Reels | 🔒 Production |
| `whatsapp_business_messaging` | WhatsApp | Send/receive WA messages | ✅ Always |
| `whatsapp_business_management` | WhatsApp | Manage templates, numbers | ✅ Always |
| `ads_management` | Meta Ads | Create/manage ad campaigns | 🔒 Production |
| `ads_read` | Meta Ads | Read ad metrics | 🔒 Production |
| `business_management` | Business Suite | Manage business assets | ✅ |
| `catalog_management` | Catalog | Product catalog sync | 🔒 Production |

### Google Scopes Required

| Scope | Platform | Required For | Sensitive? |
|-------|----------|--------------|:---------:|
| `https://www.googleapis.com/auth/adwords` | Google Ads | Campaigns, metrics | ✅ Yes |
| `https://www.googleapis.com/auth/analytics.readonly` | GA4 | Read analytics data | ❌ No |
| `https://www.googleapis.com/auth/webmasters.readonly` | Search Console | Search performance | ❌ No |
| `https://www.googleapis.com/auth/business.manage` | Business Profile | Manage locations, posts, reviews | ✅ Yes |
| `https://www.googleapis.com/auth/youtube.readonly` | YouTube | Read channel data | ❌ No |
| `https://www.googleapis.com/auth/youtube.upload` | YouTube | Upload videos | ✅ Yes |
| `https://www.googleapis.com/auth/adsense.readonly` | AdSense | Read revenue data | ❌ No |

---

## Production Approval Requirements

| Platform | Requirement | Estimated Timeline |
|----------|-------------|:-----------------:|
| WhatsApp Business | Meta Business Verification + App Review | 2–14 business days |
| Facebook Pages (Messenger) | Meta App Review (`pages_messaging`) | 5–30 business days |
| Instagram DM | Meta App Review (`instagram_manage_messages`) | 5–30 business days |
| Instagram Publishing | Meta App Review (`instagram_content_publish`) | 5–30 business days |
| Meta Ads | Business Verification + ads_management review | 1–5 business days |
| Google Business Profile API | API Access Request via official form | 1–4 weeks |
| Google Ads API | Developer token standard/basic access | 1–5 business days |
| Google OAuth (sensitive scopes) | Google OAuth Verification | 4–6 weeks |
| YouTube Upload | Google OAuth Verification | 4–6 weeks |

---

## Platform Readiness Status

| Platform | Config Ready | Dev Connected | Tested | Production Approved | Notes |
|----------|:-----------:|:-------------:|:------:|:-------------------:|-------|
| Meta Developer Account | ✅ | VERIFY REQUIRED | — | — | Must create manually |
| Facebook Pages | ✅ | VERIFY REQUIRED | — | ❌ Needs review | |
| Instagram | ✅ | VERIFY REQUIRED | — | ❌ Needs review | |
| WhatsApp Business | ✅ | VERIFY REQUIRED | — | ❌ Needs review | Simulated in MVP |
| Meta Business Suite | ✅ | VERIFY REQUIRED | — | ❌ | |
| Meta Ads | ✅ | VERIFY REQUIRED | — | ❌ | Simulated in MVP |
| Google Cloud Project | ✅ | VERIFY REQUIRED | — | ❌ | Must create manually |
| Google OAuth | ✅ | VERIFY REQUIRED | — | ⚠️ | Verification for sensitive scopes |
| Google Ads | ✅ | VERIFY REQUIRED | — | ❌ | Developer token required |
| Google Analytics | ✅ | VERIFY REQUIRED | — | ✅ | No special approval |
| Search Console | ✅ | VERIFY REQUIRED | — | ✅ | No special approval |
| Google Business Profile | ✅ | VERIFY REQUIRED | — | ❌ BLOCKED | API access request needed |
| YouTube | ✅ | VERIFY REQUIRED | — | ⚠️ | Upload scope needs verification |
| AdSense | ✅ | VERIFY REQUIRED | — | ✅ | Read-only, no special approval |
| Email (SMTP) | ✅ | ✅ (Implemented) | ✅ | ✅ | Fully working in MVP |
| SMS Provider (Twilio) | ✅ | ✅ when env configured | — | — | Uses server-side Twilio adapter |
