# Integration Testing Guide

> **Last Verified:** 2025-09-01  
> **Status:** CURRENT

---

## Purpose

Defines the testing protocol for all Teameit integrations, covering happy path, negative test cases, and regression testing.

---

## Universal Integration Test Checklist

For every integration, run through all of these:

### Connection Tests
```
☐ OAuth URL is generated correctly
☐ User is redirected to correct provider login page
☐ User can grant permissions
☐ Callback receives authorization code
☐ State is validated (reject tampered state)
☐ Authorization code is exchanged for tokens
☐ Tokens are stored in database
☐ Integration appears as "Connected" in Teameit UI
☐ Connected account name/ID is shown correctly
```

### Data Sync Tests
```
☐ Account/asset list is fetched correctly
☐ User can select the correct account
☐ Initial sync completes without error
☐ Data appears in Teameit dashboard
☐ Date range filtering works
☐ Data is accurate (compare with provider's own dashboard)
```

### Token Management Tests
```
☐ Token refresh works (simulate by manually expiring token in DB)
☐ Expired integration shows "Reconnect" prompt
☐ Reconnecting restores full functionality
```

### Webhook Tests
```
☐ Webhook verification handshake succeeds
☐ Inbound test event arrives at Teameit endpoint
☐ Event is parsed and stored correctly
☐ Duplicate event is ignored (test by sending same payload twice)
☐ Invalid signature returns 400 (not 200)
☐ Business logic executes correctly (e.g., message appears in Inbox)
```

### Disconnect Tests
```
☐ Disconnect button removes integration from UI
☐ Historical data is preserved after disconnect
☐ Reconnecting works after disconnect
```

---

## Negative Test Cases (All Integrations)

| Scenario | Test Method | Expected Behavior |
|----------|------------|-----------------|
| User denies OAuth | Click "Cancel" on provider consent | Redirect with `?error=denied`, show user-friendly message |
| Tampered state | Modify state parameter in callback URL | Return 400, do not process |
| Expired auth code | Wait 10+ minutes after OAuth redirect, then submit | Exchange fails gracefully, show retry message |
| Expired access token | Set `expires_at` to past time in DB | Auto-refresh token, retry API call |
| Revoked refresh token | Revoke token in provider dashboard | Mark integration expired, prompt reconnect |
| Webhook with invalid signature | Send webhook without valid signature | Return 400, do not process |
| Duplicate webhook | Send same webhook event ID twice | Process once, return 200 for duplicate |
| API rate limit hit | Make many rapid API calls | Queue requests, handle 429 gracefully |
| Provider outage | Simulate by using wrong API URL | Error is caught, logged, user notified |
| Invalid credentials (email) | Enter wrong password | Show clear error: "Could not verify SMTP credentials" |

---

## Meta-Specific Tests

```
☐ WhatsApp test message received in Teameit Inbox
☐ Reply from Teameit delivered to WhatsApp
☐ Delivery receipt received (webhook)
☐ Read receipt received (webhook)
☐ Instagram DM received in Teameit Inbox
☐ Facebook Messenger message received in Inbox
☐ Meta App in Development mode correctly blocks non-test users
☐ Template message sent successfully
☐ Failed template message shows error reason
```

---

## Google-Specific Tests

```
☐ Google Analytics data loads for correct GA4 property
☐ Date range comparison works
☐ Search Console keywords load with correct metrics
☐ Google Ads campaigns show correct spend (compare with Ads UI)
☐ Token refresh works without re-login (test after 1 hour)
```

---

## Email-Specific Tests

```
☐ Test SMTP: Send email via Teameit → received in inbox
☐ Test IMAP: Send email to business inbox → appears in Teameit Inbox
☐ Email with attachment → handled gracefully (or attachment ignored)
☐ Email with HTML body → content extracted correctly
☐ Large email body → truncated or stored correctly
☐ Reply to Teameit's email → appears as new message in conversation
```

---

## SMS-Specific Tests

```
☐ Send SMS to your own phone → received successfully
☐ Delivery webhook received → message status updated to 'delivered'
☐ Invalid phone number → error handled, stored as 'failed'
☐ DLT template mismatch (India) → error handled with clear reason
```

---

## Regression Testing After Updates

Whenever a provider updates their API or Teameit's integration code changes:

```
☐ Run full connection flow (OAuth end-to-end)
☐ Verify all API endpoints still return expected data format
☐ Check webhook payload structure hasn't changed
☐ Verify token refresh still works
☐ Confirm UI displays data correctly
```
