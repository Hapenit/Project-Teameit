# Google Business Profile API — Setup Guide

> **Last Verified:** 2025-09-01  
> **Verified Against:** https://developers.google.com/my-business/reference/rest  
> **Status:** CURRENT  
> **⚠️ SPECIAL REQUIREMENT: API Access is NOT automatically available**

---

## Purpose

This guide explains how to connect Google Business Profile (GBP) to Teameit, enabling:
- Reading and managing business location information
- Creating and scheduling Google Posts
- Reading and replying to customer reviews
- Viewing performance metrics (searches, views, calls, direction requests)
- Receiving notifications for new reviews and messages

---

## ⚠️ Critical Warning — API Access Requirement

> [!CAUTION]
> **Google Business Profile APIs are NOT open to all developers.**
>
> As of current documentation, accessing the My Business APIs requires:
> 1. A Google Cloud project
> 2. Enabling the specific My Business APIs
> 3. **An approved API access request submitted through Google**
>
> Without approval, API calls will fail even with valid OAuth tokens.

---

## Account Hierarchy

```
Google Account (business owner)
         ↓
    Google Business Profile Account
    (accounts.google.com/BusinessProfile or business.google.com)
         ↓
    Business Location(s)
    (each location has an accountId and locationId)
         ↓
    Google Cloud Project (API credentials)
         ↓
    Teameit Integration
```

---

## Prerequisites

| Requirement | Description |
|-------------|-------------|
| Google Account | ✅ |
| Google Business Profile | ✅ Must be verified by Google |
| Verified Business Location | ✅ Location must pass Google verification (postcard or phone) |
| Google Cloud Project | ✅ See `01-google-cloud-project.md` |
| GBP API Access Approval | ✅ Required — see Step 2 |

---

## Step 1: Verify Your Business on Google

Before using the API, the business location must be verified.

**WHERE:** https://business.google.com/  
OR search your business on Google → Claim this business

**Verification methods:**
- Postcard by mail (most common)
- Phone call to the business number
- Email (for some business types)
- Video recording (for some regions)
- Instant verification (if linked to Google Search Console)

**Expected Result:** Business shows as "Verified" in Google Business Profile dashboard.

---

## Step 2: Apply for GBP API Access

**WHERE:** https://developers.google.com/my-business/content/prereqs

**IMPORTANT:** The exact process may change. Visit the official prerequisites page and follow current instructions.

**General process (VERIFY REQUIRED — check official docs for current form):**
1. Visit the prerequisites page above
2. Complete the application form
3. Describe your use case (Teameit: multi-tenant platform for local business management)
4. Wait for approval response (typically 1–4 weeks)

> [!WARNING]
> Do not attempt to enable the My Business APIs and make API calls without approval. Requests will be rejected. Mark this integration as **BLOCKED BY API APPROVAL** until confirmation is received.

---

## Step 3: Enable My Business APIs in Cloud Console

After receiving API access approval:

**WHERE:** Google Cloud Console → APIs & Services → Library

Enable each of the following:

| API Name | Purpose |
|----------|---------|
| My Business Account Management API | Discover and manage business accounts |
| My Business Business Information API | Read/update business info, hours |
| My Business Q&A API | Manage Q&A (if needed) |
| My Business Verifications API | Verification status |
| My Business Notifications API | Review/message notifications |
| My Business Place Actions API | Post actions (if needed) |
| My Business Lodging API | (Only for hotels/lodging) |

---

## Step 4: OAuth Scope

```typescript
scope: [
  'openid',
  'email', 
  'profile',
  'https://www.googleapis.com/auth/business.manage'
]
```

> [!IMPORTANT]
> `business.manage` is a **sensitive scope** and requires OAuth app verification by Google before it can be used by users outside your test users list.

---

## Step 5: Fetch Business Accounts

After OAuth:

```typescript
// List accounts
GET https://mybusinessaccountmanagement.googleapis.com/v1/accounts
Authorization: Bearer <access_token>
```

Response:
```json
{
  "accounts": [
    {
      "name": "accounts/XXXXXXXXXXXXXXXXX",
      "accountName": "Your Business Name",
      "type": "LOCATION_GROUP"
    }
  ]
}
```

---

## Step 6: Fetch Locations (Stores/Branches)

```typescript
GET https://mybusinessbusinessinformation.googleapis.com/v1/{parent=accounts/*}/locations
  ?readMask=name,title,phoneNumbers,categories,websiteUri,regularHours,latlng,profile,storefrontAddress,metadata
Authorization: Bearer <access_token>
```

Response includes:
- `name` (location resource name, e.g., `accounts/XXX/locations/YYY`)
- `title` (business name)
- `phoneNumbers`
- `categories` (primary and additional categories)
- `regularHours` (opening hours)
- `websiteUri`
- `storefrontAddress`
- `metadata.mapsUri` (Google Maps link)
- `metadata.newReviewUri` (link to review page)

---

## Step 7: Create Google Posts

```typescript
POST https://mybusiness.googleapis.com/v4/{parent=accounts/*/locations/*}/localPosts
Authorization: Bearer <access_token>

{
  "languageCode": "en",
  "summary": "Your post content here",
  "callToAction": {
    "actionType": "LEARN_MORE",
    "url": "https://yourbusiness.com"
  },
  "media": [
    {
      "mediaFormat": "PHOTO",
      "sourceUrl": "https://your-public-image-url.com/image.jpg"
    }
  ],
  "topicType": "STANDARD"
}
```

Post topic types:
- `STANDARD` — General update
- `EVENT` — Event post (requires start/end time)
- `OFFER` — Promotional offer
- `PRODUCT` — Product post

---

## Step 8: Read and Reply to Reviews

```typescript
// List reviews
GET https://mybusiness.googleapis.com/v4/{parent=accounts/*/locations/*}/reviews
Authorization: Bearer <access_token>

// Reply to a review
PUT https://mybusiness.googleapis.com/v4/{name=accounts/*/locations/*/reviews/*}/reply
Authorization: Bearer <access_token>

{
  "comment": "Thank you for your feedback!"
}
```

---

## Step 9: Performance Metrics

```typescript
POST https://mybusiness.googleapis.com/v4/{name=accounts/*/locations/*}:reportInsights
Authorization: Bearer <access_token>

{
  "locationNames": ["accounts/XXX/locations/YYY"],
  "basicRequest": {
    "metricRequests": [
      { "metric": "QUERIES_DIRECT" },
      { "metric": "QUERIES_INDIRECT" },
      { "metric": "VIEWS_MAPS" },
      { "metric": "VIEWS_SEARCH" },
      { "metric": "ACTIONS_WEBSITE" },
      { "metric": "ACTIONS_PHONE" },
      { "metric": "ACTIONS_DRIVING_DIRECTIONS" }
    ],
    "timeRange": {
      "startTime": "2025-08-01T00:00:00Z",
      "endTime": "2025-09-01T00:00:00Z"
    }
  }
}
```

---

## Teameit Environment Variables

```env
# Same Google OAuth credentials used for all Google integrations
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>
GOOGLE_REDIRECT_URI=https://api.<your-domain>/api/v1/integrations/google/oauth/callback
```

*No additional variables required specifically for GBP beyond OAuth credentials.*

---

## Database Mapping

```
integrations
├── provider: 'google-business'
├── tenant_id

integration_credentials
├── access_token
├── refresh_token
├── external_account_id: <GBP_ACCOUNT_NAME> (e.g., "accounts/1234567890")

metadata (JSONB)
├── account_name
├── locations: [
│   {
│     location_id: "accounts/XXX/locations/YYY",
│     title: "Business Name",
│     address: {...},
│     phone: "...",
│     maps_uri: "..."
│   }
│ ]
├── selected_location_id
```

---

## Teameit Backend Routes

```
GET  /api/v1/integrations/gbp/auth-url
GET  /api/v1/integrations/gbp/oauth/callback
GET  /api/v1/integrations/gbp/accounts
GET  /api/v1/integrations/gbp/locations
POST /api/v1/integrations/gbp/posts
GET  /api/v1/integrations/gbp/reviews
POST /api/v1/integrations/gbp/reviews/:reviewId/reply
GET  /api/v1/integrations/gbp/metrics
DELETE /api/v1/integrations/gbp
```

---

## Production Readiness

| Requirement | Status |
|-------------|--------|
| API Access Approval | ⚠️ Must be applied for separately |
| OAuth Verification (`business.manage` is sensitive) | ⚠️ Required for public access |
| Verified business location | ✅ Required before API has data |

**Overall Production Status: BLOCKED until API access is approved.**

---

## Testing Checklist

```
GBP Integration Test
☐ API access approval received
☐ My Business APIs enabled in Cloud Console
☐ OAuth flow completes with business.manage scope
☐ Business accounts listed successfully
☐ Locations fetched
☐ Location info displayed in Teameit dashboard
☐ Test post created
☐ Reviews listed
☐ Review reply submitted
☐ Performance metrics fetched
☐ Token refresh works
☐ Disconnect works
```

---

## Troubleshooting

### Problem: `403 Forbidden` on My Business API calls
**Cause:** API access not approved, or APIs not enabled in Cloud Console  
**Resolution:** Verify API access approval status. Enable all required My Business APIs.

### Problem: `400 Bad Request` on location post
**Cause:** Image URL is not publicly accessible, or post content violates GBP policies  
**Resolution:** Ensure media is hosted at a public HTTPS URL (use Supabase Storage)

### Problem: Reviews not appearing
**Cause:** Location has no reviews, or location is not selected  
**Resolution:** Confirm the correct location ID is being queried

---

## Official Documentation

- My Business API Overview: https://developers.google.com/my-business/reference/rest
- API Prerequisites: https://developers.google.com/my-business/content/prereqs
- Account Management API: https://developers.google.com/my-business/reference/accountmanagement/rest
- Business Information API: https://developers.google.com/my-business/reference/businessinformation/rest
- Local Posts API: https://developers.google.com/my-business/reference/rest/v4/accounts.locations.localPosts
- Reviews API: https://developers.google.com/my-business/reference/rest/v4/accounts.locations.reviews

---

## Next Step

→ [`07-youtube.md`](./07-youtube.md) — YouTube Data API integration
