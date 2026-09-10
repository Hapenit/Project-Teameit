# Google Webhooks & Push Notifications — Setup Guide

> **Last Verified:** 2025-09-01  
> **Verified Against:** https://developers.google.com/drive/api/guides/push  
> **Status:** CURRENT

---

## Purpose

Unlike Meta, Google APIs **do not use traditional push webhooks** for most services. Instead, Google uses **Channel-based Push Notifications** for certain APIs and **polling** for others.

---

## Google Notification Methods by Service

| Service | Notification Method | Notes |
|---------|-------------------|-------|
| Google Analytics | Polling (no push) | Schedule hourly/daily sync |
| Google Ads | Polling (no push) | Schedule sync via offline reports |
| Search Console | Polling (no push) | Data delayed 2-3 days |
| Google Business Profile | GBP Notifications API | Limited events |
| YouTube | Pub/Sub (optional) | For new video notifications |
| AdSense | Polling (no push) | Daily sync recommended |

---

## Teameit Sync Strategy

Since most Google APIs require polling, Teameit implements scheduled sync jobs:

```typescript
// Scheduled via node-cron or Supabase Edge Functions
// Runs every 24 hours for each Google integration

async function syncGoogleIntegrations() {
  const tenants = await getTenantsWithGoogleIntegrations();
  
  for (const tenant of tenants) {
    await syncGoogleAnalytics(tenant.id);
    await syncSearchConsole(tenant.id);
    await syncGoogleAds(tenant.id);
    await syncAdSense(tenant.id);
    await syncYouTube(tenant.id);
    await syncGoogleBusinessProfile(tenant.id);
  }
}
```

---

## Google Business Profile Notifications

For GBP, you can subscribe to notifications for:
- New reviews
- Review replies
- Location updates

```typescript
// Subscribe to notifications
PUT https://mybusinessnotifications.googleapis.com/v1/{name=accounts/*/notificationSetting}
Authorization: Bearer <access_token>

{
  "notifyTopic": "projects/<YOUR_PROJECT_ID>/topics/<YOUR_PUBSUB_TOPIC>",
  "notificationTypes": ["NEW_REVIEW", "UPDATED_REVIEW", "NEW_CUSTOMER_MEDIA"]
}
```

**Requires:** Google Cloud Pub/Sub topic

---

## YouTube Push Notifications via Pub/Sub

For new video upload notifications:

```
POST https://pubsubhubbub.appspot.com/subscribe
  hub.callback=<your-webhook-url>
  hub.topic=https://www.youtube.com/xml/feeds/videos.xml?channel_id=<CHANNEL_ID>
  hub.verify=sync
  hub.mode=subscribe
```

Your endpoint receives an Atom feed entry when a new video is uploaded.

---

## Recommended Teameit Sync Schedule

| Service | Sync Frequency | Rationale |
|---------|---------------|-----------|
| Google Analytics | Every 24 hours | Data delayed 24-48hrs anyway |
| Search Console | Every 24 hours | Data delayed 2-3 days |
| Google Ads | Every 6 hours | Near real-time campaign data |
| AdSense | Every 24 hours | Revenue data daily |
| GBP Reviews | Every 4 hours | Reviews can be time-sensitive |
| GBP Posts | On-demand (user action) | Only when user creates/edits |
| YouTube | Every 24 hours | For analytics; real-time via Pub/Sub for new uploads |

---

## Official Documentation

- Google Push Notifications: https://developers.google.com/drive/api/guides/push
- GBP Notifications API: https://developers.google.com/my-business/reference/notifications/rest
- YouTube Pub/Sub: https://developers.google.com/youtube/v3/guides/push_notifications
