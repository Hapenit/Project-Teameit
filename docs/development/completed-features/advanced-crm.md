# Feature: Advanced CRM

### Purpose
To mature the CRM module by introducing core sales functionalities: internal notes, task reminders (to-dos), and a CSV import utility to rapidly onboard contacts.

### User stories
- As an Agent, I want to leave internal notes on a contact profile so my team has context on the relationship.
- As an Agent, I want to assign a task (e.g., "Follow up next Tuesday") to a contact so I remember to reach out.
- As a Tenant Admin, I want to import a CSV list of my existing contacts so I don't have to enter them manually.

### UI
- **Contact Profile (`/crm/:id`)**:
  - Add a "Notes" tab to append timestamped text notes.
  - Add a "Tasks" tab to add and complete simple to-do items.
- **CRM Dashboard (`/crm`)**:
  - Add an "Import CSV" button that opens a modal.
  - The modal accepts a CSV file upload, parses it, and sends the payload to the backend.

### Frontend
- **Components**: `ContactNotes.tsx`, `ContactTasks.tsx`, `CsvImportModal.tsx`.
- **Services**: API calls to `POST /api/v1/crm/contacts/:id/notes`, `POST /api/v1/crm/contacts/:id/tasks`, `POST /api/v1/crm/contacts/import`.

### Backend
- **Routes**: `crm.routes.ts`
- **Controllers**: `crm.controller.ts` (Implement notes/tasks CRUD and CSV batch import).

### Database
- **Tables**:
  - `contact_notes` (id, tenant_id, contact_id, author_id, content, created_at)
  - `contact_tasks` (id, tenant_id, contact_id, assignee_id, title, due_date, status, created_at)
- **Migration**: `020_advanced_crm.sql`.

### Security
- **Authentication**: JWT required.
- **RBAC**: Requires `crm.read` and `crm.write`.

### Integrations
- N/A

### Background processing
- Optional: Future cron job to send email notifications for due tasks.

### Validation
- Validate CSV headers (`first_name`, `last_name`, `email`, `phone`).
- Prevent importing empty files.

### Error handling
- Display partial success if some CSV rows fail (e.g. duplicate email).

### Acceptance criteria
- User can add a note to a contact and view it instantly.
- User can create a task on a contact and mark it as 'completed'.
- User can upload a valid CSV and the contacts appear in the CRM list.
