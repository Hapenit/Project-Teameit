# Feature: Advanced Reporting (Custom Date Ranges & Export)

### Purpose
To provide tenant admins with the ability to filter their analytics data by custom date ranges and export those reports as CSV or PDF for external stakeholders.

### User stories
- As a Tenant Admin, I want to filter my dashboard metrics (Contacts created, Messages received, Campaigns sent) by a specific date range (e.g., Last 7 days, This Month, Custom).
- As a Tenant Admin, I want to export my filtered analytics data to a CSV file.
- As a Tenant Admin, I want to export my analytics dashboard to a PDF report.

### UI
- **Analytics Dashboard (`/analytics`)**:
  - Add a Date Range Picker component to the top right of the dashboard.
  - Add an "Export" dropdown button (CSV, PDF).
  - Update the metric cards and charts to dynamically reflect the selected date range.

### Frontend
- **Components**: `ReportBuilder.tsx` (wraps the Analytics Dashboard).
- **Libraries**:
  - `papaparse` (already installed) for CSV generation.
  - `html2pdf.js` or `jspdf` + `html2canvas` for PDF generation directly in the browser (simplifies backend).
- **Services**: `GET /api/v1/analytics/metrics?startDate=...&endDate=...`

### Backend
- **Controllers**: `analytics.controller.ts`
  - Modify `getDashboardMetrics` to accept `startDate` and `endDate` query parameters.
  - Apply `gte` and `lte` filters to the Supabase queries based on the provided dates.

### Database
- No schema changes required. We will query existing `contacts`, `messages`, and `campaigns` tables with timestamp filters.

### Security
- **Authentication**: JWT required.
- **RBAC**: Requires `analytics.read`.

### Acceptance criteria
- User can select a start and end date.
- Dashboard numbers update to reflect only the data within that range.
- User can click "Export CSV" and a file downloads containing the raw tabular data.
- User can click "Export PDF" and a PDF of the dashboard is generated and downloaded.
