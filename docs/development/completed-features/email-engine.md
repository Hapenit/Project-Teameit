# Feature: Email Engine

### Purpose
To lay the foundation for sending and receiving emails directly within Teameit. This will eventually power email marketing in the Campaigns module and direct email threading in the Unified Inbox. 

### User stories
- As a Tenant Admin, I want to connect my SMTP/IMAP credentials so I can send/receive emails from my business domain.
- As a Marketer, I want to create an Email Campaign and have it blast out to my contacts.

### UI
- **Integrations Dashboard (`/integrations`)**: Add an "Email Connection" card that opens a modal to collect SMTP/IMAP details (Host, Port, User, Password, TLS).

### Frontend
- **Components**: `EmailConfigModal` (in Integrations).
- **Services**: API calls to `POST /api/v1/integrations/email`.

### Backend
- **Routes**: `integrations.routes.ts` (Already exists).
- **Controllers**: `integrations.controller.ts` (Add `connectEmail` method).
- **Service**: `EmailEngine` (Uses `nodemailer` to verify the SMTP connection).

### Database
- **Tables**:
  - Extend `tenant_integrations` to store email credentials securely (for MVP, we'll store them as JSON in the `credentials` column. Note: In production, passwords MUST be encrypted via KMS, but for this local MVP, JSON storage is acceptable for architecture proving).
  - Migration: `018_email_engine.sql` (if new tables needed, but `tenant_integrations` is sufficient. We will create a `campaign_emails` table to track individual send statuses).

### Security
- **Authentication**: JWT required.
- **Encryption**: As noted, production requires encrypting SMTP passwords.

### Integrations
- Connects to external SMTP servers via `nodemailer`.

### Background processing
- N/A for MVP connection testing.

### Validation
- Validate SMTP connection via `nodemailer.verify()` before saving to database.

### Error handling
- Display clear SMTP connection error messages to the user if credentials fail.

### Acceptance criteria
- User can enter SMTP credentials into a modal.
- The backend verifies the credentials using `nodemailer`.
- If successful, it saves to `tenant_integrations` with provider `email`.
- The UI shows Email as "Connected".
