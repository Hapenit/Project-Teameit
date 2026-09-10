# Feature: Agent Assignment

### Purpose
To allow a Workspace Owner/Admin to assign specific team members (agents) to incoming conversations in the Unified Inbox. This enables collaboration, prevents multiple agents from replying to the same customer simultaneously, and allows filtering the inbox by "Assigned to Me".

### User stories
- As an Agent, I want to see which conversations are assigned to me so I can focus on my workload.
- As a Manager, I want to assign a conversation to a specific agent so they take ownership.
- As an Agent, I want to filter the Unified Inbox to show only my assigned conversations.
- As an Agent, I want to see the avatar/name of the agent assigned to a conversation in the list view.

### UI
- **Unified Inbox List View**: 
  - Add an avatar icon to each conversation row showing who it is assigned to.
  - Add a "Filter by Agent" dropdown at the top of the list.
- **Conversation Thread View**: 
  - Add an "Assignee" dropdown in the header of the active conversation to select a team member.

### Frontend
- **Components**: `AssigneeDropdown`, `InboxFilter`
- **Pages**: `InboxDashboard.tsx`
- **Services**: API calls to `PUT /api/v1/inbox/conversations/:id/assign`

### Backend
- **Routes**: `inbox.routes.ts` (Existing)
- **Controllers**: `inbox.controller.ts` (Update to include an `assignAgent` method and update `getConversations` to return assignee details and support an `assigned_to` query parameter).

### Database
- **Tables**: Ensure the `conversations` table (from `008_inbox_foundation.sql`) has an `assigned_to` column (uuid referencing `auth.users` or `tenant_members`). If not, create a migration `014_agent_assignment.sql`.

### Security
- **Authentication**: JWT required.
- **RBAC**: Requires `inbox.write` permission to reassign conversations.

### Integrations
- N/A

### Background processing
- Automation Engine could later automatically assign agents based on keywords (e.g., "sales" -> Sales Team).

### Validation
- Ensure the assigned `user_id` is actually a member of the current `tenant_id`.

### Error handling
- Return 404 if the assigned user doesn't exist in the tenant.

### Testing
- Unit: N/A
- Integration: Test `PUT /api/v1/inbox/conversations/:id/assign` successfully updates the `assigned_to` column. Test filtering `GET /api/v1/inbox/conversations?assignee_id=X`.

### Acceptance criteria
- User can open the Inbox and click an unassigned conversation.
- User can click the "Assignee" dropdown and select themselves.
- The DB updates and the UI reflects the new assignee instantly.
- User can filter the inbox list to "Assigned to Me" and see only that conversation.
