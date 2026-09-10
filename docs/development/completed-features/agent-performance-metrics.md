# Feature: Agent Performance Metrics

### Purpose
To provide tenant admins with insights into the performance of their human agents. Specifically, tracking how quickly agents respond to inbound messages in the Unified Inbox, and how many conversations they resolve.

### User stories
- As a Tenant Admin, I want to see a leaderboard of my agents and their key performance metrics.
- As a Tenant Admin, I want to track the Average Response Time (ART) for each agent.
- As a Tenant Admin, I want to see the total number of conversations resolved by each agent over a specific time period.

### UI
- **Analytics Dashboard (`/analytics`)**:
  - Add a new "Agent Performance" tab or section below the main KPIs.
  - Display a data table containing:
    - Agent Name
    - Conversations Assigned
    - Conversations Resolved
    - Average Response Time (minutes)
    - Messages Sent

### Frontend
- **Components**: `AgentPerformanceTable.tsx` (nested in AnalyticsDashboard).
- **Services**: `GET /api/v1/analytics/agents?startDate=...&endDate=...`

### Backend
- **Controllers**: `analytics.controller.ts`
  - Implement `getAgentPerformance` which executes a complex Supabase query (or RPC) to calculate:
    - Total conversations where `assignee_id = user_id`.
    - Total conversations where `status = 'resolved'` and `assignee_id = user_id`.
    - Total outbound messages sent by the agent (`sender_id = user_id`).
    - *Average Response Time*: We'll approximate this MVP by looking at the time difference between inbound messages and the subsequent outbound message from the agent in the same conversation.

### Database
- No new tables required. We will query `conversations`, `messages`, and `tenant_members`.
- We may need a Supabase RPC (Stored Procedure) to calculate Average Response Time efficiently across the database, as doing this purely in Node.js would require fetching all messages. Or, for MVP, we can calculate simpler metrics like Total Assigned, Total Resolved, and Total Messages Sent.

### Security
- **Authentication**: JWT required.
- **RBAC**: Requires `analytics.read`.

### Acceptance criteria
- Admin can view a table listing their agents.
- The table displays accurate counts of assigned and resolved conversations per agent.
- The table displays the number of messages sent by the agent.
