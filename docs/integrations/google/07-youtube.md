# YouTube Data API — Setup Guide

> **Last Verified:** 2025-09-01  
> **Verified Against:** https://developers.google.com/youtube/v3/getting-started  
> **Status:** CURRENT  
> **API:** YouTube Data API v3  
> **Prerequisite:** [`02-google-oauth.md`](./02-google-oauth.md)

---

## Purpose

Connect YouTube to Teameit to display channel analytics, manage videos, and upload content through Teameit's Publishing module.

---

## Prerequisites

| Requirement | Description |
|-------------|-------------|
| Google Cloud Project | ✅ |
| YouTube Data API v3 enabled | ✅ |
| YouTube Channel | ✅ Must have a YouTube channel on the account |
| OAuth verification | ⚠️ Required for `youtube.upload` scope |

---

## Step 1: Enable YouTube Data API v3

**WHERE:** Cloud Console → APIs & Services → Library → "YouTube Data API v3"  
**WHAT TO DO:** Click Enable

---

## Step 2: OAuth Scopes

| Scope | Purpose | Sensitive? |
|-------|---------|:----------:|
| `youtube.readonly` | Read channel, video, analytics data | ❌ |
| `youtube.upload` | Upload videos | ✅ Requires verification |
| `youtube.force-ssl` | All write operations | ✅ |
| `youtubepartner` | Content ID (not needed for Teameit) | ❌ |

For **read-only analytics**: `youtube.readonly` (no review needed)  
For **video upload**: `youtube.upload` (OAuth verification required)

---

## Step 3: Fetch Channel Information

```typescript
GET https://www.googleapis.com/youtube/v3/channels
  ?part=snippet,statistics,contentDetails
  &mine=true
Authorization: Bearer <access_token>
```

Returns:
- `snippet.title` — Channel name
- `snippet.description` — Channel description
- `snippet.thumbnails.default.url` — Channel icon
- `statistics.subscriberCount`
- `statistics.viewCount`
- `statistics.videoCount`

---

## Step 4: Fetch Video Analytics

```typescript
// List recent videos
GET https://www.googleapis.com/youtube/v3/videos
  ?part=snippet,statistics,contentDetails
  &chart=mostPopular
  &mine=true
  &maxResults=25
Authorization: Bearer <access_token>
```

Statistics available per video:
- `viewCount`
- `likeCount`
- `commentCount`
- `favoriteCount`

---

## Step 5: Upload a Video (Optional)

```typescript
POST https://www.googleapis.com/upload/youtube/v3/videos
  ?part=snippet,status
  &uploadType=resumable
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "snippet": {
    "title": "Video Title",
    "description": "Video description",
    "tags": ["tag1", "tag2"],
    "categoryId": "22"
  },
  "status": {
    "privacyStatus": "public"
  }
}
```

> [!NOTE]
> Use **resumable upload** for files > 5MB. This is a two-step process: initiate the upload session, then upload the file in chunks.

---

## Teameit Environment Variables

```env
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>
GOOGLE_REDIRECT_URI=https://api.<your-domain>/api/v1/integrations/google/oauth/callback
```

---

## Database Mapping

```
integrations
├── provider: 'youtube'
├── tenant_id

integration_credentials
├── access_token / refresh_token
├── external_account_id: <CHANNEL_ID>
```

---

## Production Requirements

| Feature | Requirement |
|---------|-------------|
| Read analytics | ✅ No special approval |
| Upload videos | ⚠️ OAuth verification required for `youtube.upload` |
| Comment management | ❌ No special requirement |

---

## Official Documentation

- YouTube Data API: https://developers.google.com/youtube/v3/getting-started
- Channels API: https://developers.google.com/youtube/v3/docs/channels
- Videos API: https://developers.google.com/youtube/v3/docs/videos
- Resumable Upload: https://developers.google.com/youtube/v3/guides/using_resumable_upload_protocol

---

## Next Step

→ [`08-google-adsense.md`](./08-google-adsense.md) — Google AdSense integration
