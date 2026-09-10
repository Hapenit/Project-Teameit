# Feature: Google Business Profile Integration

### Purpose
To allow tenant users to connect their Google Business Profile (GBP) so that customer messages initiated from Google Search or Google Maps flow directly into the Teameit Unified Inbox.

### User stories
- As a Tenant Admin, I want to connect my Google Business Profile account from the Integrations dashboard.
- As a Support Agent, I want to receive and reply to messages from Google Maps directly in my Unified Inbox, without logging into Google.

### UI
- **Integrations Dashboard (`/integrations`)**:
  - Add a "Google Business" card to the grid.
  - Clicking "Connect" simulates the OAuth flow (reusing the Google OAuth callback we built for Google Ads).
  - Status updates to "Active" when connected.

### Frontend
- **Components**: `IntegrationsDashboard.tsx`
- **Logic**: Use the same `handleOAuth` simulation we used for Google Ads, but pass a different `provider` name (`google-business`).

### Backend
- **Providers**: `googleBusiness.provider.ts` (Implement the `ProviderAdapter` interface).
- **Engine**: Update `IntegrationEngine.ts` to recognize `google-business`.
- **Logic**: For MVP, we will simulate receiving an inbound webhook from GBP and allow the agent to send an outbound reply via the `sendMessage` adapter (which will just log a success message for MVP since we don't have real GBP API keys).

### Database
- No new tables required. The `integrations` table handles OAuth credentials, and the `conversations` / `messages` tables handle the chat thread with a `channel = 'google-business'`.

### Security
- Standard OAuth token storage in the `integrations` table.
- Standard tenant isolation for webhook processing.

### Acceptance criteria
- Admin can connect GBP in the Integrations dashboard.
- Admin can simulate an incoming GBP message via a webhook (or Postman).
- The message appears in the Unified Inbox with a "Google Business" badge.
- The agent can type a reply and click send, which triggers the GBP adapter.
