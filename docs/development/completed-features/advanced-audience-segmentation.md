# Feature: Advanced Audience Segmentation

### Purpose
To allow tenant users to send targeted marketing campaigns to specific subsets of their CRM contacts based on tags or source attributes, rather than broadcasting to the entire contact list.

### User stories
- As a Marketer, I want to filter my campaign audience by specific tags (e.g., "VIP", "Interested").
- As a Marketer, I want to filter my campaign audience by their source (e.g., "Facebook", "Import").
- As a Marketer, I want to see an estimated audience count before I launch the campaign.

### UI
- **Create Campaign Page (`/campaigns/new`)**:
  - Replace the "MVP: target everyone" notice with an Audience Configuration section.
  - Add multi-select dropdowns or tag inputs for:
    - **Included Tags** (Contacts must have at least one of these tags)
    - **Source** (Filter by contact source)
  - Add an "Calculate Audience Size" button to show how many contacts match the criteria.

### Frontend
- **Components**: `CreateCampaign.tsx`
- **Services**: `POST /api/v1/campaigns/estimate-audience` (New endpoint to fetch count based on criteria).

### Backend
- **Controllers**: `campaign.controller.ts`
  - Implement `estimateAudience` endpoint.
- **Engine**: `campaign.engine.ts`
  - Update `executeCampaign` to apply the `targetCriteria` filters (tags, source) when querying the `contacts` table, instead of just `.eq('tenant_id', tenantId)`.

### Database
- No schema changes required. `targetCriteria` is already a JSONB column in `campaigns`. We just need to populate it properly and parse it in the engine.
- We will rely on the existing `tags` (text[]) and `source` (text) columns on the `contacts` table.

### Security
- **Authentication**: JWT required.
- **RBAC**: Requires `campaigns.write`.

### Acceptance criteria
- User can select tags while creating a campaign.
- Clicking "Estimate" shows the correct number of matching contacts.
- Launching the campaign successfully limits the created `campaign_jobs` to only those matching contacts.
