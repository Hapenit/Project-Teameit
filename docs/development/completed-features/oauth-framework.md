# Feature: Full OAuth Integration Framework UI & Storage

### Purpose
To allow tenants to securely connect third-party platforms (Meta, Google, etc.) to Teameit. The framework manages the OAuth 2.0 flow, securely stores the resulting access/refresh tokens in the database, and provides a UI for users to manage these connections.

### User stories
- As a Tenant Admin, I want to connect my Facebook Page so that Teameit can publish posts to it.
- As a Tenant Admin, I want to connect my WhatsApp Business account so I can receive and reply to messages in the Unified Inbox.
- As a Tenant Admin, I want to see the status of my integrations (Connected, Disconnected, Error).
- As a Tenant Admin, I want to disconnect an integration and revoke its access.

### UI
- **Integrations Dashboard (`/integrations`)**: A grid of available integration cards (Meta, Google Ads, Stripe, etc.). Each card shows connection status and a "Connect" or "Disconnect" button.
- **OAuth Callback Loading State**: A simple spinner screen shown when returning from the provider (e.g., `/integrations/callback`) while the backend exchanges the code for a token.

### Frontend
- **Components**: `IntegrationCard`, `IntegrationsDashboard`
- **Pages**: `CallbackPage.tsx`
- **Hooks**: `useIntegrations`
- **State**: List of connected provider IDs.
- **Services**: API calls to `GET /api/v1/integrations`, `POST /api/v1/integrations/connect`, `DELETE /api/v1/integrations/:id`.

### Backend
- **Routes**: `integrations.routes.ts`
- **Controllers**: `integrations.controller.ts`
- **Services**: `oauth.service.ts` (Handles state generation, URL generation, code exchange).
- **Repositories**: Direct Supabase client calls.

### Database
- **Tables**: `integrations` (Already exists from previous foundations, but we need to ensure it has `access_token`, `refresh_token`, `expires_at`, `scopes`, and `provider_account_id` fields).
- **Security**: RLS ensuring a tenant can only view/modify their own integrations.

### Security
- **Authentication**: JWT required.
- **RBAC**: Requires `integrations.connect` permission to initiate OAuth or disconnect.
- **OAuth Security**: Use securely generated `state` parameter to prevent CSRF attacks during the OAuth flow. Never expose tokens to the frontend; store them encrypted/securely in the backend.

### Integrations
- Mock OAuth flow for MVP to simulate external providers, allowing us to build the architecture without registering real Meta/Google Apps just yet.

### Background processing
- A cron job could be implemented later to refresh tokens that are close to expiry.

### Validation
- Validate OAuth `state` parameter upon callback.

### Error handling
- Handle provider denial (user clicked "Cancel" on provider consent screen).
- Handle token exchange failure.

### Testing
- Unit: Test `oauth.service.ts` state generation and validation.
- Integration: Test `GET /api/v1/integrations` returns only the tenant's integrations.

### Acceptance criteria
- Tenant can click "Connect Meta".
- Tenant is redirected to a simulated OAuth consent screen.
- Tenant is redirected back to Teameit with a code.
- Backend exchanges code and saves credentials in `integrations` table.
- UI updates to show Meta is "Connected".
- Tenant can click "Disconnect" to remove the integration.
