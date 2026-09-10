# Feature: Google Ads Sync

### Purpose
To pull external ad spend, impressions, clicks, and ROAS data from connected Google Ads accounts into the Teameit platform. This allows tenants to view their advertising ROI directly alongside their CRM and Campaign metrics.

### User stories
- As a Marketer, I want to connect my Google Ads account to Teameit so the platform can automatically sync my daily ad spend.
- As a Tenant Admin, I want to view a dashboard showing my total Ad Spend, Clicks, and Cost-Per-Click (CPC) so I can measure my marketing efficiency.

### UI
- **Ads Dashboard (`/analytics/ads`)**: 
  - A summary KPI row (Spend, Clicks, Impressions, CPC).
  - A table or chart displaying daily performance.
- **Integrations Dashboard (`/integrations`)**:
  - Add "Google Ads" as an available integration card. 
  - Clicking "Connect" triggers the OAuth flow (re-using our existing OAuth framework).

### Frontend
- **Components**: `AdsDashboard.tsx`
- **Pages**: Add nested routing under `/analytics/ads` or a dedicated `/advertising` route. We will use a dedicated `/advertising` route for clarity.
- **Services**: API calls to `GET /api/v1/advertising/google-ads/metrics`.

### Backend
- **Routes**: `advertising.routes.ts`
- **Controllers**: `advertising.controller.ts` (Handles fetching the cached metrics from the DB or triggering a manual sync).
- **Services**: `GoogleAdsService` (Simulates fetching data from Google Ads API using the connected OAuth token).

### Database
- **Tables**:
  - `ad_metrics` (id, tenant_id, provider, campaign_id, date, spend, impressions, clicks, conversions, created_at, updated_at)
  - Migration: `017_advertising_metrics.sql`.

### Security
- **Authentication**: JWT required.
- **RBAC**: Requires `analytics.read`.

### Integrations
- Relies on the `tenant_integrations` table created in the OAuth Framework feature. We will mock the Google Ads API response.

### Background processing
- Optional: Future cron job to run `GoogleAdsService.syncDailyMetrics()` every night.

### Validation
- Ensure the tenant has a valid "google" integration connected before attempting to fetch data.

### Error handling
- Display "Google Ads not connected" state gracefully.

### Testing
- Integration: Test `GET /api/v1/advertising/google-ads/metrics` returns the data or a 404 if not connected.

### Acceptance criteria
- User can connect "Google Ads" via the Integrations page.
- Once connected, navigating to the Advertising dashboard fetches and displays (mocked) ad metrics for that tenant.
- If not connected, the Advertising dashboard prompts the user to connect their account.
