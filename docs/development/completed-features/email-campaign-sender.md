# Feature: Email Campaign Sender Engine

### Purpose
To allow users to select "Email" as a channel in the Campaigns module and send a blast to their contacts using the SMTP connection established in the Email Engine step.

### User stories
- As a Marketer, I want to create an Email Campaign, write a subject line and body, select an audience, and hit Send.
- As a Marketer, I want the system to route those emails through my configured SMTP provider.

### UI
- **Create Campaign (`/campaigns/new`)**: 
  - Add "Email" to the channel selector.
  - If "Email" is selected, reveal a "Subject Line" input in addition to the message body.

### Frontend
- **Components**: `CreateCampaign.tsx`.
- **Services**: Modifying the payload to `POST /api/v1/campaigns` to support `subject`.

### Backend
- **Routes**: `campaign.routes.ts` (Already exists).
- **Controllers**: `campaign.controller.ts` (Modify `executeCampaign` to detect channel='email' and invoke the `EmailSenderService`).
- **Service**: `EmailSenderService` (Queries the `integrations` table for the tenant's `email` provider credentials, configures `nodemailer`, loops through contacts, and sends the emails).

### Database
- **Tables**: `campaigns` (Needs an `email_subject` nullable column).
- **Migration**: `019_campaign_email_subject.sql` to add `email_subject` to `campaigns` table.

### Security
- **Authentication**: JWT required.
- **RBAC**: Requires `campaigns.write`.

### Integrations
- Utilizes the `email` provider credentials stored in `integrations`.

### Background processing
- For the MVP, we will send synchronously in the controller loop (with a small timeout between sends). In production, this must be pushed to a Redis queue.

### Error handling
- If no email integration is connected, throw an error preventing the campaign launch.
- Handle individual contact send failures gracefully without crashing the loop.

### Acceptance criteria
- User can create a campaign with channel='email' and provide a subject.
- Clicking "Send" correctly loads the SMTP configuration and sends the emails.
- If no SMTP config exists, the UI clearly states they need to connect an email provider first.
