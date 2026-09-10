# Feature: Lead Pipelines (Kanban)

### Purpose
To provide a visual Kanban board for tenants to track the progression of leads (Contacts) through their sales or customer journey.

### User stories
- As a Sales Rep, I want to see a visual pipeline of all my leads so I know what stage they are in.
- As a Sales Rep, I want to define custom stages (e.g., "New", "Contacted", "Demo", "Won", "Lost").
- As a Sales Rep, I want to drag and drop a contact from one stage to another to update their status.

### UI
- **Pipelines Dashboard (`/crm/pipelines`)**: A Kanban board interface. Columns represent Stages. Cards represent Contacts.
- **Drag & Drop**: Utilize HTML5 drag and drop or a library to move cards between columns.

### Frontend
- **Components**: `PipelineBoard`, `PipelineColumn`, `LeadCard`
- **Pages**: `LeadPipelines.tsx`
- **Services**: API calls to `GET /api/v1/crm/pipelines`, `POST /api/v1/crm/pipelines/stages`, `PUT /api/v1/crm/contacts/:id/stage`.

### Backend
- **Routes**: `crm.routes.ts`
- **Controllers**: `crm.controller.ts` (Update to handle pipelines and stages).

### Database
- **Tables**:
  - `pipelines` (id, tenant_id, name)
  - `pipeline_stages` (id, pipeline_id, name, order)
  - Modifying `contacts` to reference `pipeline_stage_id`.
  - Migration: `015_lead_pipelines.sql`.

### Security
- **Authentication**: JWT required.
- **RBAC**: Requires `crm.read` and `crm.write`.

### Integrations
- N/A

### Background processing
- N/A

### Validation
- Ensure stages being assigned belong to the correct tenant.

### Error handling
- Handle missing pipelines gracefully.

### Testing
- Unit: N/A
- Integration: Test `PUT /api/v1/crm/contacts/:id/stage` successfully moves a contact.

### Acceptance criteria
- User can view a default pipeline with stages.
- User can see contacts populating the stages based on their assignment.
- User can click a button to change a contact's stage (simulating drag and drop for MVP, or actual drag and drop).
- The database updates the contact's `pipeline_stage_id`.
