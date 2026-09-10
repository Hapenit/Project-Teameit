# Feature: Advanced Report Builder

### Purpose
To allow tenants to build custom reports in the Analytics module by specifying custom date ranges, and to enable the export of these reports (e.g., as CSV or printing to PDF).

### User stories
- As a Tenant Admin, I want to filter my analytics dashboard by a specific date range (e.g., "Last 30 Days", "This Quarter", or custom start/end dates) so I can measure performance over a specific period.
- As a Tenant Admin, I want to export my analytics data as a CSV file to share with stakeholders or do custom analysis in Excel.
- As a Tenant Admin, I want a print-friendly view of the dashboard so I can save it as a PDF report.

### UI
- **Analytics Dashboard (`/analytics`)**: 
  - Add a Date Range Picker component to the header (Presets: 7D, 30D, 90D, Custom).
  - Add an "Export CSV" button.
  - Add a "Print Report" button (which triggers `window.print()` with `@media print` CSS for clean formatting).

### Frontend
- **Components**: `DateRangePicker`
- **Pages**: Modify `AnalyticsDashboard.tsx`.
- **Services**: Pass `startDate` and `endDate` query parameters to `GET /api/v1/analytics/overview`.

### Backend
- **Routes**: `analytics.routes.ts` (Existing)
- **Controllers**: `analytics.controller.ts` (Update `getOverview` to accept and process `startDate` and `endDate` queries to filter the database aggregations).

### Database
- **Tables**: Utilizing existing tables (`conversations`, `messages`, `contacts`). No schema changes needed!
- **Queries**: Update backend logic to add `.gte('created_at', startDate)` and `.lte('created_at', endDate)` to the Supabase queries.

### Security
- **Authentication**: JWT required.
- **RBAC**: Requires `analytics.read`.

### Integrations
- N/A

### Background processing
- N/A

### Validation
- Ensure `startDate` is before `endDate`.

### Error handling
- Handle missing or invalid date formats gracefully by falling back to a default (e.g., Last 30 Days).

### Testing
- Integration: Test `GET /api/v1/analytics/overview?startDate=X&endDate=Y` properly filters results.

### Acceptance criteria
- User can select "Last 7 Days" and the charts/metrics update to reflect only that data.
- User can select a custom start and end date and the data updates.
- User can click "Export CSV" and a formatted CSV of the raw metric data is downloaded.
- User can click "Print Report" and the browser's print dialog opens, with the sidebar hidden via CSS for a clean PDF layout.
