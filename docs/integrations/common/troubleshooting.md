# Troubleshooting Guide — Common Integration Errors

> **Last Verified:** 2025-09-01  
> **Status:** CURRENT

---

## Purpose

Quick-reference troubleshooting for the most common errors encountered when setting up and maintaining Teameit integrations.

---

## Meta / Facebook / WhatsApp / Instagram

### Error: OAuth redirect mismatch
**Message:** `The redirect_uri does not match the allowed redirect URIs`  
**Cause:** URI in Teameit's `.env` (`META_REDIRECT_URI`) doesn't exactly match what's in Facebook Login settings  
**Fix:**
1. Open Meta App Dashboard → Facebook Login → Settings → Valid OAuth Redirect URIs
2. Copy the exact URI listed there
3. Update `META_REDIRECT_URI` in `.env` to match exactly (including trailing slash if present)

---

### Error: App in Development mode
**Message:** Users outside the app get "App Not Accessible"  
**Cause:** App is in Development mode; only testers/developers/admins can use it  
**Fix:**
- For development: Add the user's Facebook account under Roles → Testers
- For production: Switch to Live mode (requires App Review)

---

### Error: `(#100) No permissions are associated with this access token`
**Cause:** The requested permission was not granted during OAuth, or App Review not completed  
**Fix:**
1. Check what permissions the token has: `GET /me/permissions?access_token=<token>`
2. Ensure the permission is included in your OAuth scope request
3. Ensure App Review is approved for production use

---

### Error: WhatsApp webhook not receiving messages
**Cause 1:** Webhook URL not verified  
**Cause 2:** Page/WABA not subscribed  
**Cause 3:** Webhook fields not selected  
**Fix:**
1. Re-verify the webhook in Meta App Dashboard → WhatsApp → Configuration
2. Call `POST /<WABA_ID>/subscribed_apps` to re-subscribe
3. Check that `messages` field is subscribed

---

### Error: Meta App Secret invalid (webhook signature fails)
**Cause:** `META_APP_SECRET` in environment doesn't match the actual App Secret in Meta dashboard  
**Fix:** Go to Settings → Basic → App Secret → Show. Copy the exact value.

---

## Google Integrations

### Error: `Error 400: redirect_uri_mismatch`
**Cause:** The redirect URI in Teameit doesn't match what's in Google Cloud Console → Credentials  
**Fix:**
1. Open Cloud Console → APIs & Services → Credentials → Your OAuth Client
2. Check Authorized Redirect URIs
3. Add the exact URI your backend uses (must include path, no trailing slash unless intentional)

---

### Error: `Error 403: access_denied` - App not verified
**Cause:** App is in Testing mode and the user is not in the Test Users list  
**Fix:** Add the user's Google email to OAuth consent screen → Test Users

---

### Error: No refresh token received
**Cause:** `prompt=consent` or `access_type=offline` missing from OAuth request, OR user previously authorized  
**Fix:** Include both `access_type: 'offline'` and `prompt: 'consent'` in auth URL generation. User may need to revoke existing access at https://myaccount.google.com/permissions first.

---

### Error: `Google Ads API - USER_PERMISSION_DENIED`
**Cause:** Developer token is in Test Account access level but you're querying a real account  
**Fix:** Use a test Google Ads account, OR apply for Basic Access at API Center

---

### Error: Google Business Profile API returns 403 even after enabling
**Cause:** API access approval from Google not yet received  
**Fix:** Check the prerequisites page, ensure access request was submitted and approved. This is a gating requirement.

---

## Email / SMTP

### Error: `SMTP authentication failed`
**Cause 1:** Wrong password (use App Password for Gmail, not regular password)  
**Cause 2:** 2FA not enabled on Gmail (required for App Passwords)  
**Fix:**
1. Enable 2-Step Verification at https://myaccount.google.com/security
2. Generate App Password at https://myaccount.google.com/apppasswords
3. Use that 16-character password in Teameit

---

### Error: `IMAP connection refused`
**Cause:** IMAP access is disabled on the email account  
**Fix:**
- Gmail: Settings → See all settings → Forwarding and POP/IMAP → Enable IMAP
- Other providers: Check their IMAP settings in account preferences

---

### Error: Inbound emails not appearing in Teameit
**Cause 1:** IMAP sync job not running  
**Cause 2:** Emails already marked as Read before Teameit polls  
**Fix:**
1. Verify the IMAP sync cron job is active in your server
2. Check that the mailbox being polled has UNSEEN (unread) messages
3. Mark emails as unread manually to test

---

## SMS

### Error: SMS not delivered in India
**Cause:** DLT registration missing, or template not registered  
**Fix:**
1. Verify your PE is registered on DLT platform
2. Verify your Sender ID is approved
3. Verify the template matches exactly what was registered (including variable placeholders)
4. Check telecom operator's reason code in delivery webhook

---

### Error: `Twilio - 21610: The message From/To pair violates a blacklist rule`
**Cause:** Number is on the Do-Not-Call registry or has opted out  
**Fix:** Honor opt-outs. Remove the number from your campaign list. Do not attempt to re-send.

---

## General Errors

### Error: Integration shows "Expired" immediately after connecting
**Cause:** Token storage failing, or `expires_at` computed incorrectly  
**Fix:** Check database insert for `integration_credentials`. Verify `expires_at` is a future timestamp.

### Error: Webhook returns 200 but event not processed
**Cause:** Deduplication triggered (duplicate external_id) OR processor threw error but was caught  
**Fix:** Check `webhook_events` table for the event. Look at `status` and `error_log` columns.

### Error: Rate limit (429) from provider
**Cause:** Too many API calls in a short period  
**Fix:** Implement exponential backoff. Cache API responses. Reduce sync frequency.
