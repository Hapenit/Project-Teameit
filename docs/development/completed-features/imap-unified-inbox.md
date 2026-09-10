# Feature: IMAP Unified Inbox Sync

### Purpose
To complete the Email Engine by allowing Teameit to read incoming emails via IMAP and ingest them directly into the Unified Inbox module. This allows agents to read and reply to emails seamlessly alongside WhatsApp and Facebook messages.

### User stories
- As an Agent, I want to receive emails from clients directly inside the Teameit inbox.
- As a Tenant Admin, I want to configure my IMAP server settings alongside my SMTP settings.

### UI
- **Integrations Dashboard (`/integrations`)**:
  - Update the existing SMTP config modal to also collect IMAP details (Host, Port, Secure, Username, Password).
- **Unified Inbox (`/inbox`)**:
  - No major UI changes needed here, as the engine will normalize incoming emails into standard `conversations` and `messages` rows. (Provider = 'email').

### Frontend
- **Components**: `IntegrationsDashboard.tsx`.
- **Services**: Modifying the payload to `POST /api/v1/integrations/email` to support `imapConfig`.

### Backend
- **Dependencies**: `node-imap` (or `imap-simple` / `imapflow`).
- **Controllers**: 
  - `integrations.controller.ts` (Modify `connectEmail` to verify IMAP).
- **Service**: 
  - `ImapService.ts` (Connects to IMAP, listens for `mail` events on the INBOX).
  - Normalizes the email into a `message` and inserts it into the `messages` table under a new or existing `conversation` (where `provider_id` is the sender's email).

### Database
- **Tables**: `tenant_integrations` (will store IMAP alongside SMTP credentials).
- No new tables required for MVP.

### Security
- **Authentication**: JWT required.
- **Data**: Passwords stored as JSON text (for MVP).

### Background processing
- For the MVP, we will instantiate IMAP connections in the background for active tenants when the Node server starts, or polling via Cron. Since this is an MVP without a worker process, we will implement a basic `ImapSyncEngine` that polls active email integrations every X minutes, fetches UNSEEN messages, and saves them.

### Acceptance criteria
- User can configure IMAP settings.
- Backend successfully polls an IMAP inbox, detects a new email, and converts it into a `message` inside a `conversation`.
