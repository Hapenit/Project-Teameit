# SMS API Credentials — Configuration Guide

> **Last Verified:** 2025-09-01  
> **Status:** CURRENT

---

## Twilio API Credentials

**WHERE:** https://console.twilio.com/

| Credential | Location in Twilio Console | Teameit Env Variable |
|-----------|---------------------------|---------------------|
| Account SID | Dashboard → Account Info | `TWILIO_ACCOUNT_SID` |
| Auth Token | Dashboard → Account Info → Show | `TWILIO_AUTH_TOKEN` |
| Phone Number | Phone Numbers → Active Numbers | `TWILIO_PHONE_NUMBER` |

---

## Kaleyra API Credentials

**WHERE:** https://in.kaleyra.com/dashboard

| Credential | Location | Teameit Env Variable |
|-----------|----------|---------------------|
| API Key | Account → API Keys | `KALEYRA_API_KEY` |
| SID (Account ID) | Account → Profile | `KALEYRA_SID` |
| Sender ID | SMS → Sender IDs | `KALEYRA_SENDER_ID` |

---

## MSG91 API Credentials

**WHERE:** https://control.msg91.com/

| Credential | Location | Teameit Env Variable |
|-----------|----------|---------------------|
| Auth Key | API → Auth Key | `MSG91_AUTH_KEY` |
| Sender ID | Sender IDs → View | `MSG91_SENDER_ID` |
| Route | 1=Promotional, 4=Transactional | `MSG91_ROUTE` |

---

## Security Rules

```env
# Server-only — NEVER expose to frontend
TWILIO_ACCOUNT_SID=AC...        # Server only
TWILIO_AUTH_TOKEN=...           # Server only — SECRET
KALEYRA_API_KEY=...             # Server only — SECRET
MSG91_AUTH_KEY=...              # Server only — SECRET
```

> [!CAUTION]
> SMS API keys give full access to send messages (incurring costs) and read account data. Treat them as passwords. Never expose in frontend code.
