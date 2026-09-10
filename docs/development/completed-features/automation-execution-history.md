# Feature: Automation Execution History & Logs

### Purpose
To give users complete visibility into their automated workflows. When a trigger fires and a workflow executes, users need to see a log of what happened (successes, skipped nodes, and errors) to debug and monitor their automations.

### User stories
- As a Tenant Admin, I want to see a list of every time a workflow ran.
- As a Tenant Admin, I want to click into a specific execution and see exactly which nodes passed and which failed, along with error messages.

### UI
- **Workflow Builder (`/automation/builder?id=...`)**:
  - Add an "Execution History" tab or side panel to the canvas view.
  - Display a table of recent executions (Date, Status: Success/Failed).
  - Clicking a row expands or opens a modal showing the step-by-step logs.

### Frontend
- **Components**: `ExecutionHistoryPanel.tsx`.
- **Services**: `GET /api/v1/automation/workflows/:id/executions`.
- Workflows can be saved/loaded with `POST /api/v1/automation/workflows` and
  `GET /api/v1/automation/workflows/:id`; the builder also exposes an explicit
  execute action.

### Backend
- **Routes**: `automation.routes.ts` (Add `GET /workflows/:id/executions`).
- `POST /workflows/:id/execute` starts an execution and
  `POST /executions/:executionId/resume` resumes persisted delays/retries.
- **Controllers**: `automation.controller.ts` (Fetch executions from DB).
- **Service**: `AutomationEngine.ts` (Must be updated to write execution logs to the database as it parses nodes).

### Database
- **Tables**:
  - `workflow_executions` (id, tenant_id, workflow_id, status, started_at, completed_at, error_log)
  - `workflow_execution_steps` (id, execution_id, node_id, status, logs, executed_at)
- **Migration**: `021_automation_execution_logs.sql`.
- **Migration**: `024_automation_execution_state.sql` adds durable resume/retry state.
- Execution rows persist `next_node_id`, `resume_at`, retry counters, and context.
  A background poller resumes due executions; unsupported provider sends are
  recorded as failures rather than reported as success.

### Security
- **Authentication**: JWT required.
- **RBAC**: Requires `automations.read`.

### Integration
- Hooks into the existing `AutomationEngine` trigger/action loop.

### Acceptance criteria
- When the `AutomationEngine` runs a workflow, it inserts a record into `workflow_executions` and records each node in `workflow_execution_steps`.
- The user can open the Workflow Builder and view a chronological list of these executions.
- The UI correctly surfaces errors if a node fails.
