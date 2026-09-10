# Production Checklist — Integration Go-Live Requirements

> **Last Verified:** 2025-09-01  
> **Status:** CURRENT

---

## Purpose

This checklist must be completed for every integration before switching to production/live mode. Incomplete items are common causes of production failures.

---

## Universal Pre-Production Checklist

### Security
```
☐ All secrets in server-only environment variables (no VITE_ prefix)
☐ All credentials encrypted at rest in database
☐ .env file is in .gitignore (no secrets in git history)
☐ Webhook endpoints validate signatures before processing
☐ OAuth state is signed and validated for CSRF protection
☐ HTTPS enforced on all endpoints (no HTTP in production)
☐ Production Supabase Service Role Key rotated from development
```

### Infrastructure
```
☐ Production domain configured and HTTPS working
☐ API server deployed and reachable at api.<domain>
☐ Frontend deployed and reachable at <domain>
☐ Database has production data (not development/test data)
☐ Environment variables set in production deployment platform
☐ Logging and error monitoring configured (Sentry, etc.)
☐ Scheduled jobs (IMAP sync, analytics sync) running in production
```

### Legal & Compliance
```
☐ Privacy Policy page live at public HTTPS URL
☐ Terms of Service page live at public HTTPS URL
☐ Data Deletion instructions page live (required by Meta)
☐ Cookie Policy if applicable
☐ GDPR/data processing compliance reviewed
```

---

## Meta Integrations — Production Checklist

```
Meta App
☐ App switched from Development to Live mode
☐ App Review submitted and approved for all required permissions
☐ Business Verification completed in Meta Business Manager
☐ Privacy Policy URL added to app settings
☐ Terms of Service URL added to app settings
☐ App icon uploaded (1024x1024 PNG)
☐ Production redirect URIs added to Facebook Login settings

WhatsApp
☐ Display name approved by Meta
☐ Business Verification completed
☐ Phone number quality rating is GREEN
☐ Message templates approved
☐ Webhook URL is production URL (not ngrok)
☐ System User token generated (non-expiring)
☐ Messaging limits noted (start at Tier 1: 250/day)

Facebook/Instagram
☐ pages_messaging permission approved in App Review
☐ instagram_manage_messages permission approved
☐ instagram_content_publish permission approved
☐ Page subscribed to production webhook
☐ Long-lived Page Access Tokens generated
```

---

## Google Integrations — Production Checklist

```
Google Cloud
☐ OAuth consent screen app published (not Testing mode)
☐ App domain verified
☐ Support email configured
☐ Logo uploaded

Google OAuth
☐ Production redirect URI added to authorized URIs
☐ Sensitive scopes submitted for Google verification (if applicable)
☐ App verification completed (if required)

Google Ads
☐ Developer token Basic Access approved (not test access)
☐ Live customer accounts accessible via API

Google Business Profile
☐ API access approval received from Google
☐ All My Business APIs enabled in Cloud Console
☐ Business locations verified on Google Business Profile
☐ OAuth verification completed for business.manage scope
```

---

## Email Checklist

```
Email
☐ SPF record configured for sending domain
☐ DKIM record configured
☐ DMARC record configured
☐ Email not blacklisted (check: https://mxtoolbox.com/blacklists.aspx)
☐ Production email credentials in production environment
☐ Credentials encrypted in database (not plain text)
☐ IMAP sync scheduled job running
☐ Unsubscribe mechanism implemented for marketing emails
☐ CAN-SPAM / GDPR unsubscribe compliance reviewed
```

---

## SMS Checklist

```
SMS
☐ Provider account verified
☐ Production API keys in production environment
☐ DLT registration complete (India mandatory)
☐ Sender ID approved (India)
☐ SMS templates registered and approved (India)
☐ Delivery webhook URL is production URL
☐ Opt-out / STOP handling implemented
☐ TRAI/NDNC scrubbing implemented (India)
```

---

## Post-Launch Monitoring

```
☐ Set up alert for webhook failure rate > 5%
☐ Set up alert for failed message count spike
☐ Monitor Meta rate limits daily
☐ Monitor Google API quota usage
☐ Set up token expiry alerts (30 days before)
☐ Review Supabase database performance
☐ Enable Supabase Point-in-Time Recovery (PITR)
```
