# TEAMEIT

# Database & API Specification

## Version 1.0 — Development Baseline

---

# 1. Technical Architecture

## 1.1 Stack

### Frontend

* React
* TypeScript
* React Router
* API client
* WebSocket/realtime client
* Form validation
* Workflow builder
* Content editor
* Calendar
* Analytics dashboard

### Backend

* Node.js
* TypeScript
* REST API
* WebSocket/realtime services
* Background workers
* Queue system
* Cron/scheduler
* Webhook processors
* Integration adapters

### Database

* Supabase
* PostgreSQL
* Supabase Auth
* Supabase Storage
* PostgreSQL Row Level Security

---

# 2. High-Level Architecture

```text
                           TEAMEIT
                              │
                         React Frontend
                              │
                         HTTPS / WebSocket
                              │
                        Node.js Backend
                              │
             ┌────────────────┼────────────────┐
             │                │                │
          Core API         Workers         Webhooks
             │                │                │
             └────────────────┼────────────────┘
                              │
                       Service Layer
                              │
        ┌─────────────┬───────┼───────┬─────────────┐
        │             │       │       │             │
       CRM       Campaigns Automation Inbox     Publishing
        │             │       │       │             │
        └─────────────┴───────┼───────┴─────────────┘
                              │
                       Integration Layer
                              │
       ┌──────────┬───────────┼──────────┬──────────┐
       │          │           │          │          │
    Meta       Google       Email       SMS      YouTube
       │          │
       │          ├── Ads
       │          ├── Analytics
       │          ├── Search Console
       │          ├── Business Profile
       │          └── AdSense
       │
       ├── WhatsApp
       ├── Instagram
       ├── Facebook
       └── Meta Ads
                              │
                         PostgreSQL
                              │
                         Supabase
```

---

# 3. Multi-Tenant Architecture

Everything belongs to an organization/tenant.

```text
Platform
   │
   ├── Tenant A
   │    ├── Users
   │    ├── CRM
   │    ├── Campaigns
   │    └── Integrations
   │
   ├── Tenant B
   │    ├── Users
   │    ├── CRM
   │    ├── Campaigns
   │    └── Integrations
   │
   └── Tenant C
```

Tenant data must never cross organization boundaries.

Every tenant-owned table should contain:

```text
tenant_id UUID
```

---

# 4. Database Naming Standards

Use:

* lowercase
* snake_case
* singular concepts for entities where practical
* plural table names
* UUID primary keys
* timestamptz for timestamps

Example:

```sql
id UUID PRIMARY KEY
tenant_id UUID NOT NULL
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
```

---

# 5. Core Tables

## 5.1 tenants

```text
tenants
---------
id
name
slug
logo_url
country
timezone
currency
status
created_at
updated_at
```

Status:

```text
active
suspended
trial
cancelled
```

---

# 6. Users

## users

```text
users
---------
id
email
first_name
last_name
avatar_url
phone
timezone
status
created_at
updated_at
```

Authentication can use Supabase Auth.

Application user profile data should remain separate from authentication credentials.

---

# 7. Tenant Membership

## tenant_members

```text
tenant_members
---------
id
tenant_id
user_id
role_id
status
joined_at
created_at
updated_at
```

Relationship:

```text
users
  │
  └── tenant_members ── tenants
```

This allows one user to potentially belong to multiple organizations.

---

# 8. Teams

## teams

```text
teams
---------
id
tenant_id
name
description
status
created_at
updated_at
```

## team_members

```text
team_members
---------
id
tenant_id
team_id
user_id
created_at
```

---

# 9. Roles

## roles

```text
roles
---------
id
tenant_id
name
description
is_system
created_at
updated_at
```

## permissions

```text
permissions
---------
id
module
action
description
```

Example:

```text
module = campaigns
action = create
```

## role_permissions

```text
role_permissions
---------
id
role_id
permission_id
```

---

# 10. CRM

## contacts

```text
contacts
---------
id
tenant_id
first_name
last_name
display_name
email
phone
company
job_title
country
city
source
owner_user_id
status
notes
created_at
updated_at
```

## contact_identities

Used to connect external channel identities.

```text
contact_identities
---------
id
tenant_id
contact_id
provider
provider_account_id
external_id
external_username
metadata
created_at
updated_at
```

Examples:

```text
provider = whatsapp
provider = instagram
provider = facebook
provider = email
provider = sms
```

---

# 11. Tags

## tags

```text
tags
---------
id
tenant_id
name
color
created_at
```

## contact_tags

```text
contact_tags
---------
id
tenant_id
contact_id
tag_id
created_at
```

---

# 12. Custom Fields

## custom_fields

```text
custom_fields
---------
id
tenant_id
entity_type
name
field_key
field_type
is_required
created_at
updated_at
```

Supported types:

```text
text
number
boolean
date
datetime
select
multi_select
email
phone
url
```

## custom_field_values

```text
custom_field_values
---------
id
tenant_id
custom_field_id
entity_id
value_text
value_number
value_boolean
value_date
value_json
created_at
updated_at
```

---

# 13. Leads

## pipelines

```text
pipelines
---------
id
tenant_id
name
description
is_default
created_at
updated_at
```

## pipeline_stages

```text
pipeline_stages
---------
id
tenant_id
pipeline_id
name
position
probability
created_at
updated_at
```

## leads

```text
leads
---------
id
tenant_id
contact_id
pipeline_id
stage_id
owner_user_id
source
campaign_id
value
currency
priority
status
expected_close_date
created_at
updated_at
```

Status:

```text
open
won
lost
```

---

# 14. Lead Activities

## lead_activities

```text
lead_activities
---------
id
tenant_id
lead_id
user_id
activity_type
title
description
scheduled_at
completed_at
created_at
```

Types:

```text
note
task
follow_up
email
sms
whatsapp
call
meeting
```

---

# 15. Conversations

## conversations

```text
conversations
---------
id
tenant_id
contact_id
channel
external_conversation_id
status
assigned_user_id
assigned_team_id
subject
last_message_at
created_at
updated_at
```

Channels:

```text
whatsapp
instagram
facebook
email
sms
```

Status:

```text
open
pending
closed
archived
```

---

# 16. Conversation Participants

## conversation_participants

```text
conversation_participants
---------
id
tenant_id
conversation_id
contact_id
external_id
role
created_at
```

---

# 17. Messages

## messages

```text
messages
---------
id
tenant_id
conversation_id
contact_id
sender_type
sender_user_id
channel
external_message_id
message_type
body
status
sent_at
delivered_at
read_at
failed_at
failure_reason
metadata
created_at
```

Sender types:

```text
contact
user
automation
system
```

Message types:

```text
text
image
video
audio
document
location
contact
interactive
template
product
```

---

# 18. Message Attachments

## message_attachments

```text
message_attachments
---------
id
tenant_id
message_id
file_name
file_type
mime_type
storage_path
external_url
file_size
metadata
created_at
```

---

# 19. Message Events

## message_events

```text
message_events
---------
id
tenant_id
message_id
event_type
external_event_id
event_time
metadata
created_at
```

Events:

```text
queued
sent
delivered
read
failed
```

---

# 20. Campaigns

## campaigns

```text
campaigns
---------
id
tenant_id
name
description
objective
owner_user_id
status
start_at
end_at
budget
currency
created_at
updated_at
```

Status:

```text
draft
scheduled
running
paused
completed
cancelled
failed
```

---

# 21. Campaign Channels

## campaign_channels

```text
campaign_channels
---------
id
tenant_id
campaign_id
channel
integration_account_id
status
configuration
created_at
updated_at
```

Channels:

```text
whatsapp
sms
email
instagram
facebook
meta_ads
google_ads
youtube
google_business
```

This allows one campaign to contain multiple channels.

---

# 22. Campaign Audiences

## campaign_audiences

```text
campaign_audiences
---------
id
tenant_id
campaign_id
name
audience_type
definition
created_at
updated_at
```

Audience types:

```text
contacts
tags
segment
leads
custom
```

---

# 23. Campaign Recipients

## campaign_recipients

```text
campaign_recipients
---------
id
tenant_id
campaign_id
contact_id
channel
status
queued_at
sent_at
delivered_at
read_at
failed_at
failure_reason
metadata
created_at
```

Status:

```text
pending
queued
processing
sent
delivered
read
failed
skipped
cancelled
```

---

# 24. Campaign Events

## campaign_events

```text
campaign_events
---------
id
tenant_id
campaign_id
contact_id
channel
event_type
external_event_id
event_time
metadata
created_at
```

Examples:

```text
sent
delivered
opened
clicked
replied
converted
failed
```

---

# 25. Automation

## automations

```text
automations
---------
id
tenant_id
name
description
status
trigger_type
created_by
created_at
updated_at
```

Status:

```text
draft
active
paused
archived
```

---

# 26. Automation Versions

Workflows should be versioned.

## automation_versions

```text
automation_versions
---------
id
tenant_id
automation_id
version
status
published_at
created_at
```

This prevents editing an active workflow from breaking executions already in progress.

---

# 27. Automation Nodes

## automation_nodes

```text
automation_nodes
---------
id
tenant_id
automation_version_id
node_key
node_type
position_x
position_y
configuration
created_at
updated_at
```

Node types:

```text
trigger
condition
action
delay
branch
end
```

---

# 28. Automation Edges

## automation_edges

```text
automation_edges
---------
id
tenant_id
automation_version_id
source_node_id
target_node_id
condition_key
created_at
```

---

# 29. Automation Executions

## automation_executions

```text
automation_executions
---------
id
tenant_id
automation_id
automation_version_id
contact_id
lead_id
campaign_id
trigger_event_id
status
started_at
completed_at
failed_at
error_message
created_at
```

Status:

```text
running
waiting
completed
failed
cancelled
```

---

# 30. Automation Execution Steps

## automation_execution_steps

```text
automation_execution_steps
---------
id
tenant_id
execution_id
node_id
status
started_at
completed_at
scheduled_at
attempts
input_data
output_data
error_message
created_at
```

---

# 31. Integrations

## integrations

```text
integrations
---------
id
provider
name
category
description
created_at
```

Examples:

```text
meta
google
youtube
email
sms
```

---

# 32. Integration Accounts

## integration_accounts

```text
integration_accounts
---------
id
tenant_id
integration_id
external_account_id
account_name
account_type
status
metadata
connected_at
last_synced_at
created_at
updated_at
```

---

# 33. Integration Credentials

## integration_credentials

```text
integration_credentials
---------
id
tenant_id
integration_account_id
credential_type
encrypted_value
expires_at
created_at
updated_at
```

Examples:

```text
access_token
refresh_token
api_key
client_secret
```

Credentials must never be returned to the frontend.

---

# 34. Integration Permissions

## integration_permissions

```text
integration_permissions
---------
id
tenant_id
integration_account_id
permission
status
created_at
updated_at
```

---

# 35. Integration Webhooks

## integration_webhooks

```text
integration_webhooks
---------
id
tenant_id
integration_account_id
provider
webhook_type
external_id
status
last_received_at
created_at
updated_at
```

---

# 36. Webhook Events

## webhook_events

```text
webhook_events
---------
id
tenant_id
provider
integration_account_id
external_event_id
event_type
payload
signature_valid
processing_status
received_at
processed_at
error_message
created_at
```

Processing status:

```text
received
processing
processed
failed
ignored
```

This table is important for idempotency and debugging.

---

# 37. Content Publishing

## content

```text
content
---------
id
tenant_id
title
content_type
created_by
status
scheduled_at
created_at
updated_at
```

Types:

```text
post
reel
video
story
business_post
email
```

---

# 38. Content Variants

Different platforms may need different versions of the same content.

## content_variants

```text
content_variants
---------
id
tenant_id
content_id
channel
integration_account_id
caption
title
description
metadata
created_at
updated_at
```

---

# 39. Publishing Jobs

## publishing_jobs

```text
publishing_jobs
---------
id
tenant_id
content_id
channel
integration_account_id
scheduled_at
status
attempts
published_at
failed_at
error_message
external_post_id
created_at
updated_at
```

Status:

```text
draft
scheduled
processing
published
failed
cancelled
```

---

# 40. Media Library

## media_assets

```text
media_assets
---------
id
tenant_id
uploaded_by
file_name
mime_type
file_size
storage_path
public_url
width
height
duration
metadata
created_at
updated_at
```

Store files in Supabase Storage.

---

# 41. Meta Ads

## ad_accounts

```text
ad_accounts
---------
id
tenant_id
integration_account_id
provider
external_account_id
name
status
currency
timezone
created_at
updated_at
```

## ad_campaigns

```text
ad_campaigns
---------
id
tenant_id
ad_account_id
external_campaign_id
name
objective
status
budget
start_at
end_at
metadata
created_at
updated_at
```

## ad_sets

```text
ad_sets
---------
id
tenant_id
ad_campaign_id
external_ad_set_id
name
status
budget
targeting
placements
optimization
created_at
updated_at
```

## ads

```text
ads
---------
id
tenant_id
ad_set_id
external_ad_id
name
status
creative_id
metadata
created_at
updated_at
```

---

# 42. Ad Creatives

## ad_creatives

```text
ad_creatives
---------
id
tenant_id
external_creative_id
name
headline
body
call_to_action
media_asset_id
metadata
created_at
updated_at
```

---

# 43. Analytics Sources

## analytics_sources

```text
analytics_sources
---------
id
tenant_id
integration_account_id
provider
source_type
name
status
created_at
updated_at
```

---

# 44. Analytics Metrics

## analytics_metrics

```text
analytics_metrics
---------
id
tenant_id
source_id
metric_date
metric_name
metric_value
dimension_data
created_at
```

Examples:

```text
impressions
clicks
reach
users
sessions
conversions
revenue
spend
```

Provider-specific metric definitions should be retained instead of pretending that similarly named metrics always mean exactly the same thing.

---

# 45. Analytics Events

## analytics_events

```text
analytics_events
---------
id
tenant_id
source_id
event_name
external_event_id
event_time
contact_id
campaign_id
metadata
created_at
```

---

# 46. SEO

## seo_properties

```text
seo_properties
---------
id
tenant_id
integration_account_id
property_url
property_type
status
created_at
updated_at
```

## seo_queries

```text
seo_queries
---------
id
tenant_id
property_id
query
date
clicks
impressions
ctr
position
created_at
```

## seo_pages

```text
seo_pages
---------
id
tenant_id
property_id
url
date
clicks
impressions
ctr
position
created_at
```

## seo_issues

```text
seo_issues
---------
id
tenant_id
property_id
url
issue_type
severity
description
status
created_at
updated_at
```

---

# 47. Catalog

## catalogs

```text
catalogs
---------
id
tenant_id
integration_account_id
name
external_catalog_id
status
created_at
updated_at
```

## products

```text
products
---------
id
tenant_id
catalog_id
external_product_id
name
description
sku
price
currency
inventory
image_url
status
metadata
created_at
updated_at
```

## product_categories

```text
product_categories
---------
id
tenant_id
catalog_id
name
external_category_id
created_at
updated_at
```

---

# 48. Notifications

## notifications

```text
notifications
---------
id
tenant_id
user_id
type
title
body
data
read_at
created_at
```

## notification_preferences

```text
notification_preferences
---------
id
tenant_id
user_id
notification_type
channel
enabled
created_at
updated_at
```

---

# 49. Reports

## reports

```text
reports
---------
id
tenant_id
name
description
report_type
configuration
created_by
created_at
updated_at
```

## report_runs

```text
report_runs
---------
id
tenant_id
report_id
status
started_at
completed_at
file_path
error_message
created_at
```

---

# 50. Audit Logs

## audit_logs

```text
audit_logs
---------
id
tenant_id
user_id
action
entity_type
entity_id
before_data
after_data
ip_address
user_agent
created_at
```

Examples:

```text
campaign.created
campaign.updated
campaign.published
automation.updated
integration.connected
user.invited
permission.changed
contact.deleted
```

---

# 51. Usage

## usage_records

```text
usage_records
---------
id
tenant_id
usage_type
quantity
unit
period_start
period_end
metadata
created_at
```

Examples:

```text
whatsapp_messages
sms_messages
emails
automation_executions
api_requests
storage
```

---

# 52. Billing

## subscriptions

```text
subscriptions
---------
id
tenant_id
provider
external_subscription_id
plan
status
current_period_start
current_period_end
created_at
updated_at
```

## billing_records

```text
billing_records
---------
id
tenant_id
subscription_id
external_invoice_id
amount
currency
status
invoice_url
issued_at
created_at
```

---

# 53. System Health

## system_events

```text
system_events
---------
id
service
event_type
severity
message
metadata
created_at
```

Examples:

```text
worker.failed
webhook.failed
provider.rate_limited
database.error
integration.error
```

---

# 54. Important Relationships

Core relationship:

```text
TENANT
 │
 ├── USERS
 │     └── TEAMS
 │
 ├── CONTACTS
 │     └── IDENTITIES
 │
 ├── LEADS
 │     └── PIPELINES
 │
 ├── CONVERSATIONS
 │     └── MESSAGES
 │
 ├── CAMPAIGNS
 │     ├── CHANNELS
 │     ├── AUDIENCES
 │     ├── RECIPIENTS
 │     └── EVENTS
 │
 ├── AUTOMATIONS
 │     ├── VERSIONS
 │     ├── NODES
 │     ├── EDGES
 │     └── EXECUTIONS
 │
 ├── CONTENT
 │     ├── VARIANTS
 │     └── PUBLISHING JOBS
 │
 ├── INTEGRATIONS
 │     └── ACCOUNTS
 │
 └── ANALYTICS
```

---

# 55. REST API Architecture

Base URL:

```text
/api/v1
```

All authenticated requests should resolve:

```text
user
 ↓
tenant
 ↓
permissions
 ↓
service
 ↓
database/provider
```

---

# 56. Authentication APIs

```text
POST   /auth/login
POST   /auth/logout
POST   /auth/refresh
GET    /auth/me
POST   /auth/forgot-password
POST   /auth/reset-password
```

If Supabase Auth is used, avoid duplicating authentication unnecessarily in Node.js.

---

# 57. Tenant APIs

```text
GET    /tenants
GET    /tenants/:tenantId
POST   /tenants
PATCH  /tenants/:tenantId
DELETE /tenants/:tenantId
```

---

# 58. User APIs

```text
GET    /users
GET    /users/:id
POST   /users/invite
PATCH  /users/:id
DELETE /users/:id
```

---

# 59. Team APIs

```text
GET    /teams
POST   /teams
GET    /teams/:id
PATCH  /teams/:id
DELETE /teams/:id

POST   /teams/:id/members
DELETE /teams/:id/members/:userId
```

---

# 60. Contact APIs

```text
GET    /contacts
POST   /contacts
GET    /contacts/:id
PATCH  /contacts/:id
DELETE /contacts/:id

POST   /contacts/import
GET    /contacts/export

POST   /contacts/:id/tags
DELETE /contacts/:id/tags/:tagId
```

---

# 61. Lead APIs

```text
GET    /leads
POST   /leads
GET    /leads/:id
PATCH  /leads/:id
DELETE /leads/:id

POST   /leads/:id/activities
GET    /leads/:id/activities

PATCH  /leads/:id/stage
```

---

# 62. Inbox APIs

```text
GET    /conversations
GET    /conversations/:id
PATCH  /conversations/:id
POST   /conversations/:id/assign
POST   /conversations/:id/close
POST   /conversations/:id/archive

GET    /conversations/:id/messages
POST   /conversations/:id/messages
```

---

# 63. Campaign APIs

```text
GET    /campaigns
POST   /campaigns
GET    /campaigns/:id
PATCH  /campaigns/:id
DELETE /campaigns/:id

POST   /campaigns/:id/start
POST   /campaigns/:id/pause
POST   /campaigns/:id/resume
POST   /campaigns/:id/cancel
POST   /campaigns/:id/duplicate

GET    /campaigns/:id/analytics
GET    /campaigns/:id/recipients
```

---

# 64. Automation APIs

```text
GET    /automations
POST   /automations
GET    /automations/:id
PATCH  /automations/:id
DELETE /automations/:id

POST   /automations/:id/publish
POST   /automations/:id/pause

GET    /automations/:id/versions
GET    /automations/:id/executions
GET    /automations/:id/logs
```

---

# 65. Workflow APIs

```text
GET    /automations/:id/workflow
PUT    /automations/:id/workflow

POST   /automations/:id/nodes
PATCH  /automations/:id/nodes/:nodeId
DELETE /automations/:id/nodes/:nodeId

POST   /automations/:id/edges
DELETE /automations/:id/edges/:edgeId
```

---

# 66. Publishing APIs

```text
GET    /content
POST   /content
GET    /content/:id
PATCH  /content/:id
DELETE /content/:id

POST   /content/:id/publish
POST   /content/:id/schedule
POST   /content/:id/cancel

GET    /publishing/jobs
```

---

# 67. Integration APIs

Generic integration layer:

```text
GET    /integrations
GET    /integrations/:provider

POST   /integrations/:provider/connect
GET    /integrations/:provider/callback

GET    /integration-accounts
GET    /integration-accounts/:id

POST   /integration-accounts/:id/sync
POST   /integration-accounts/:id/reconnect
POST   /integration-accounts/:id/disconnect

GET    /integration-accounts/:id/health
```

---

# 68. WhatsApp APIs

Provider-specific service internally:

```text
POST   /channels/whatsapp/send
POST   /channels/whatsapp/template
GET    /channels/whatsapp/templates
GET    /channels/whatsapp/catalog
```

Webhook:

```text
POST   /webhooks/whatsapp
```

The frontend should generally use Teameit APIs rather than directly calling Meta APIs.

---

# 69. Email APIs

```text
POST   /channels/email/send
GET    /channels/email/templates
POST   /channels/email/templates
PATCH  /channels/email/templates/:id

POST   /channels/email/test
```

Webhook/provider event endpoint:

```text
POST   /webhooks/email/:provider
```

---

# 70. SMS APIs

```text
POST   /channels/sms/send
GET    /channels/sms/templates
POST   /channels/sms/campaigns
```

Webhook:

```text
POST   /webhooks/sms/:provider
```

---

# 71. Analytics APIs

```text
GET /analytics/overview
GET /analytics/social
GET /analytics/messaging
GET /analytics/advertising
GET /analytics/website
GET /analytics/seo
GET /analytics/revenue

GET /analytics/campaigns/:id
```

Parameters:

```text
start_date
end_date
channel
campaign_id
account_id
```

---

# 72. SEO APIs

```text
GET  /seo/properties
POST /seo/properties/connect

GET /seo/overview
GET /seo/queries
GET /seo/pages
GET /seo/issues
GET /seo/opportunities
```

---

# 73. Reports APIs

```text
GET    /reports
POST   /reports
GET    /reports/:id
PATCH  /reports/:id
DELETE /reports/:id

POST   /reports/:id/run
GET    /reports/:id/runs
```

---

# 74. Notification APIs

```text
GET   /notifications
PATCH /notifications/:id/read
POST  /notifications/read-all

GET   /notification-preferences
PATCH /notification-preferences
```

---

# 75. Media APIs

```text
GET    /media
POST   /media/upload
GET    /media/:id
DELETE /media/:id
```

Upload flow:

```text
React
 ↓
Node API
 ↓
Signed upload / Storage
 ↓
Supabase Storage
 ↓
media_assets
```

---

# 76. Webhook Architecture

Every webhook should follow:

```text
Provider
 ↓
POST /webhooks/:provider
 ↓
Verify signature
 ↓
Create webhook_events record
 ↓
Check idempotency
 ↓
Return HTTP 200/appropriate acknowledgement
 ↓
Queue event
 ↓
Worker
 ↓
Normalize event
 ↓
Update domain tables
 ↓
Trigger automation
 ↓
Update analytics
```

Never perform long-running processing directly inside the webhook HTTP request.

---

# 77. Idempotency

Every provider event should have an external event identifier whenever available.

Before processing:

```text
Does external_event_id already exist?
        │
    ┌───┴───┐
   YES      NO
    │        │
Ignore     Process
```

This prevents duplicate messages, leads, campaign events and automation executions.

---

# 78. Queue Architecture

Recommended logical queues:

```text
webhook_queue
message_queue
campaign_queue
email_queue
sms_queue
publishing_queue
analytics_queue
automation_queue
sync_queue
report_queue
```

Workers:

```text
Webhook Worker
Message Worker
Campaign Worker
Email Worker
SMS Worker
Publishing Worker
Analytics Worker
Automation Worker
Sync Worker
Report Worker
```

---

# 79. Scheduled Jobs

Examples:

```text
Every minute
 ├── scheduled messages
 ├── scheduled publishing
 ├── scheduled automation steps
 └── scheduled campaigns

Every 5-15 minutes
 ├── integration synchronization
 └── provider health checks

Daily
 ├── analytics aggregation
 ├── cleanup
 └── reports
```

Exact frequencies should be determined from provider rate limits and business requirements.

---

# 80. Automation Execution Example

User creates:

```text
WHEN
Instagram comment contains "price"

THEN
Create Lead
 ↓
Add Tag "Instagram Lead"
 ↓
Send WhatsApp
 ↓
Wait 1 Day
 ↓
Send Email
```

Backend flow:

```text
Instagram webhook
 ↓
webhook_events
 ↓
Webhook Worker
 ↓
Normalize event
 ↓
Find matching automation
 ↓
Create automation_execution
 ↓
Create execution_step
 ↓
Automation Worker
 ↓
Create lead
 ↓
Tag contact
 ↓
Send WhatsApp
 ↓
Schedule next step
```

---

# 81. Campaign Execution Example

```text
Campaign
 ↓
Audience
 ↓
Generate recipients
 ↓
Validate consent
 ↓
Create campaign_recipients
 ↓
Queue recipients
 ↓
Worker
 ↓
Provider
 ↓
Webhook
 ↓
Update recipient
 ↓
Campaign event
 ↓
Analytics
```

---

# 82. Multi-Channel Campaign Example

```text
CAMPAIGN
"Diwali Sale"

       │
       ├── Instagram Post
       │
       ├── Facebook Post
       │
       ├── Meta Ad
       │
       ├── Google Ad
       │
       ├── WhatsApp
       │
       ├── Email
       │
       └── SMS
```

All share:

```text
campaign_id
tenant_id
```

This enables cross-channel reporting.

---

# 83. API Response Standard

Success:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "CAMPAIGN_NOT_FOUND",
    "message": "Campaign was not found"
  }
}
```

Never expose stack traces or provider secrets to clients.

---

# 84. Pagination

List APIs should use pagination.

Example:

```text
GET /contacts?page=1&limit=25
```

Response:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 25,
    "total": 250,
    "total_pages": 10
  }
}
```

Cursor pagination should be considered for very large message/event tables.

---

# 85. Filtering

Example:

```text
GET /contacts?
status=lead
&tag=customer
&owner_id=123
&page=1
```

Filtering logic must always remain tenant-scoped.

---

# 86. RLS / Tenant Security

Supabase RLS must enforce tenant isolation.

Concept:

```text
authenticated user
       ↓
tenant membership
       ↓
tenant_id
       ↓
RLS policy
       ↓
tenant data
```

Never rely solely on:

```text
WHERE tenant_id = ...
```

from frontend-supplied values.

The server must determine the authorized tenant from authenticated identity/membership.

---

# 87. API Authorization

Every protected endpoint should verify:

```text
Authentication
      ↓
Tenant membership
      ↓
Role
      ↓
Permission
      ↓
Resource ownership
```

Example:

```text
campaigns.update
```

is different from:

```text
campaigns.publish
```

Publishing should generally require an explicit permission.

---

# 88. Integration Credential Security

Credentials should:

* Never be stored in plain text
* Never be returned to React
* Be encrypted at rest
* Have expiry tracking
* Support refresh
* Support revocation
* Be auditable

Frontend receives:

```json
{
  "status": "connected",
  "account_name": "My Business"
}
```

Not:

```json
{
  "access_token": "..."
}
```

---

# 89. External API Adapter Pattern

Recommended structure:

```text
IntegrationManager
       │
       ├── MetaAdapter
       │     ├── WhatsApp
       │     ├── Instagram
       │     ├── Facebook
       │     └── Ads
       │
       ├── GoogleAdapter
       │     ├── Ads
       │     ├── Analytics
       │     ├── Search Console
       │     └── Business Profile
       │
       ├── YouTubeAdapter
       │
       ├── EmailAdapter
       │
       └── SMSAdapter
```

The rest of the application should communicate through service interfaces rather than directly depending on provider SDKs everywhere.

---

# 90. Recommended Backend Folder Structure

```text
src/
│
├── app/
│   ├── routes/
│   ├── middleware/
│   ├── validators/
│   └── errors/
│
├── modules/
│   ├── auth/
│   ├── tenants/
│   ├── users/
│   ├── teams/
│   ├── crm/
│   ├── contacts/
│   ├── leads/
│   ├── conversations/
│   ├── messages/
│   ├── campaigns/
│   ├── automations/
│   ├── publishing/
│   ├── analytics/
│   ├── seo/
│   ├── reports/
│   ├── notifications/
│   └── media/
│
├── integrations/
│   ├── meta/
│   ├── google/
│   ├── youtube/
│   ├── email/
│   └── sms/
│
├── workers/
│   ├── webhook.worker.ts
│   ├── campaign.worker.ts
│   ├── message.worker.ts
│   ├── automation.worker.ts
│   ├── publishing.worker.ts
│   └── analytics.worker.ts
│
├── database/
│   ├── migrations/
│   ├── queries/
│   └── repositories/
│
├── services/
│
├── queues/
│
├── config/
│
└── server.ts
```

---

# 91. Recommended Frontend Structure

```text
src/
│
├── app/
│   ├── router/
│   ├── providers/
│   └── layouts/
│
├── components/
│   ├── ui/
│   ├── forms/
│   ├── tables/
│   ├── charts/
│   └── dialogs/
│
├── modules/
│   ├── dashboard/
│   ├── crm/
│   ├── inbox/
│   ├── campaigns/
│   ├── automations/
│   ├── publishing/
│   ├── advertising/
│   ├── analytics/
│   ├── seo/
│   ├── reports/
│   └── integrations/
│
├── hooks/
├── services/
├── api/
├── types/
├── utils/
└── assets/
```

---

# 92. Environment Variables

Example:

```text
NODE_ENV
PORT

SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

DATABASE_URL

APP_URL
API_URL

ENCRYPTION_KEY

META_CLIENT_ID
META_CLIENT_SECRET

GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET

YOUTUBE_CLIENT_ID
YOUTUBE_CLIENT_SECRET

EMAIL_PROVIDER_API_KEY
SMS_PROVIDER_API_KEY

QUEUE_URL
REDIS_URL
```

Secrets must exist only in secure server-side configuration.

---

# 93. Testing Strategy

## Unit Tests

Test:

* Services
* Validators
* Workflow conditions
* Campaign logic
* Permission logic
* Provider adapters

## Integration Tests

Test:

```text
API → Database
API → Queue
Webhook → Database
Webhook → Automation
Campaign → Queue
```

## End-to-End Tests

Example:

```text
Connect integration
 ↓
Create contact
 ↓
Create campaign
 ↓
Launch campaign
 ↓
Provider event
 ↓
Analytics
```

---

# 94. Provider Sandbox Testing

Every integration should have a development/test strategy where the provider offers suitable testing capabilities.

Never develop against production customer accounts as the primary testing method.

Test:

* Authentication
* Token expiry
* Permission errors
* Rate limits
* Invalid payloads
* Webhooks
* Retries
* Duplicate events
* Failed messages
* Publishing failures

---

# 95. Observability

Production should include:

* Application logs
* Worker logs
* API latency
* Queue latency
* Failed jobs
* Webhook failures
* Integration errors
* Database errors
* Provider errors

Track correlation IDs:

```text
request_id
tenant_id
user_id
integration_account_id
external_event_id
```

This makes debugging significantly easier.

---

# 96. Development Sequence

## Sprint Group 1

```text
Project setup
Authentication
Multi-tenancy
Users
Teams
Roles
Permissions
Supabase
RLS
```

## Sprint Group 2

```text
CRM
Contacts
Tags
Custom fields
Leads
Pipelines
Tasks
Notes
```

## Sprint Group 3

```text
Integration framework
OAuth
Credential management
Webhook infrastructure
Queue infrastructure
```

## Sprint Group 4

```text
WhatsApp
Inbox
Messages
Templates
Campaigns
Webhooks
Analytics
```

## Sprint Group 5

```text
Instagram
Facebook
Meta Business
Unified Inbox
Publishing
```

## Sprint Group 6

```text
Email
SMS
Campaign delivery
Consent
Automation
```

## Sprint Group 7

```text
Workflow builder
Automation engine
Execution engine
Retries
Logs
```

## Sprint Group 8

```text
Meta Ads
Google Ads
Advertising analytics
```

## Sprint Group 9

```text
Google Analytics
Search Console
Google Business
SEO
YouTube
AdSense
```

## Sprint Group 10

```text
Unified analytics
Reports
Export
Admin
Usage
Billing
System health
```

---

# 97. Critical Development Rules

### Rule 1

Every tenant-owned table must be tenant isolated.

### Rule 2

Never expose external API credentials to React.

### Rule 3

Never process large campaigns synchronously.

### Rule 4

All provider webhooks must support idempotency.

### Rule 5

All external API calls must have error handling.

### Rule 6

All asynchronous operations need retry handling.

### Rule 7

Automation workflows must be versioned.

### Rule 8

Provider-specific code should remain inside integration adapters.

### Rule 9

CRM should remain channel-independent.

### Rule 10

Campaigns should support multiple channels.

### Rule 11

Analytics must preserve provider-specific metric definitions.

### Rule 12

Consent/opt-out must be channel-specific.

---

# 98. Final Backend Architecture

```text
                         NODE.JS
                            │
             ┌──────────────┼──────────────┐
             │              │              │
           REST          WEBHOOKS       WEBSOCKET
             │              │              │
             └──────────────┼──────────────┘
                            │
                      SERVICE LAYER
                            │
       ┌───────────┬────────┼────────┬───────────┐
       │           │        │        │           │
      CRM      Campaign  Automation Inbox   Publishing
       │           │        │        │           │
       └───────────┴────────┼────────┴───────────┘
                            │
                     QUEUE / WORKERS
                            │
                  INTEGRATION ADAPTERS
                            │
       ┌────────┬───────────┼──────────┬─────────┐
       │        │           │          │         │
      META    GOOGLE      EMAIL       SMS     YOUTUBE
       │        │
       │        ├── Ads
       │        ├── Analytics
       │        ├── Search Console
       │        ├── Business Profile
       │        └── AdSense
       │
       ├── WhatsApp
       ├── Instagram
       ├── Facebook
       └── Meta Ads
                            │
                       SUPABASE
                            │
                     PostgreSQL + RLS
                            │
                       Supabase Storage
```

---

# 99. Final Development Principle

The most important architectural decision for Teameit is:

```text
                    TEAMEIT CORE
                         │
        ┌────────────────┼────────────────┐
        │                │                │
       CRM          COMMUNICATION      CAMPAIGNS
        │                │                │
        └────────────────┼────────────────┘
                         │
                     AUTOMATION
                         │
                     PUBLISHING
                         │
                  INTEGRATION LAYER
                         │
              EXTERNAL PLATFORMS
                         │
                    ANALYTICS
                         │
                     REPORTING
```

External platforms are **channels and data sources**.

Teameit owns the:

* Customer
* Lead
* Conversation
* Campaign
* Automation
* Content
* Workflow
* Analytics
* Reporting
* Tenant
* User
* Permission

This separation is what makes the platform scalable.

---

# 100. Pre-Development Gate

Before developers start implementation, the following should be frozen:

```text
☐ Product feature specification
☐ Database specification
☐ API specification
☐ Authentication model
☐ Tenant model
☐ Permission model
☐ Integration architecture
☐ Webhook architecture
☐ Queue architecture
☐ Automation architecture
☐ Campaign architecture
☐ Frontend navigation
☐ API naming conventions
☐ Database naming conventions
☐ Error conventions
☐ Logging conventions
☐ Testing strategy
```

After this gate, development can begin with:

**Phase 1 → Supabase schema + RLS + Node.js foundation + authentication + multi-tenancy.**

The next technical document should therefore be the **actual Supabase SQL schema/migrations**, followed by the **Node.js API implementation contract**.


# TEAMEIT — TENANT ONBOARDING SPECIFICATION

## Version 1.0 — Final

---

# 101. Tenant Onboarding

Tenant onboarding is the process of taking an authenticated user and creating/configuring their Teameit organization.

The onboarding system belongs to **Teameit**, while user authentication remains owned by **Supabase Auth**.

```text
USER
 ↓
SUPABASE AUTH
 ↓
AUTHENTICATED USER
 ↓
TEAMEIT ONBOARDING
 ↓
CREATE / JOIN TENANT
 ↓
BUSINESS PROFILE
 ↓
TEAM SETUP
 ↓
CHANNEL CONNECTION
 ↓
PREFERENCES
 ↓
DASHBOARD
```

---

# 102. First-Time User Onboarding

When a user signs up for Teameit:

```text
Signup
 ↓
Supabase Auth
 ↓
Email Verification
 ↓
Teameit User Profile
 ↓
"Create Your Business"
 ↓
Tenant Onboarding
 ↓
Create Tenant
 ↓
Assign Owner
 ↓
Business Setup
 ↓
Dashboard
```

---

# 103. Tenant Onboarding Steps

Recommended onboarding wizard:

```text
Step 1 → Welcome
Step 2 → Business Information
Step 3 → Business Preferences
Step 4 → Team Setup
Step 5 → Connect Channels
Step 6 → CRM Setup
Step 7 → Notification Preferences
Step 8 → Complete
```

Users should be able to **skip optional integration steps** and complete them later.

---

# 104. Step 1 — Welcome

Display:

```text
Welcome to Teameit

Let's set up your workspace.
This will only take a few minutes.
```

Actions:

```text
Get Started
```

---

# 105. Step 2 — Business Information

Collect:

* Business name
* Business logo
* Website
* Business email
* Business phone
* Country
* State/region
* City
* Industry
* Business type
* Timezone
* Currency

Example:

```text
Business Name:
ABC Marketing

Website:
example.com

Industry:
Marketing Agency

Country:
India

Timezone:
Asia/Kolkata

Currency:
INR
```

---

# 106. Tenant Creation

After business information is submitted:

```text
Create Tenant
```

Database:

```text
tenants
---------
id
name
slug
logo_url
website
business_email
business_phone
country
state
city
industry
business_type
timezone
currency
status
onboarding_status
created_at
updated_at
```

Recommended onboarding statuses:

```text
not_started
in_progress
completed
skipped
```

---

# 107. Step 3 — Business Preferences

Configure:

* Timezone
* Currency
* Date format
* Time format
* Language
* Default country
* Default communication preferences

These become tenant-level defaults.

---

# 108. Step 4 — Team Setup

Owner can immediately invite team members.

Example:

```text
Your Team

Mohammed
Owner

Sarah
Marketing Manager

Ahmed
Agent
```

Invitation fields:

```text
email
role
team
```

Users can also:

```text
Skip for now
```

and invite team members later.

---

# 109. Step 5 — Connect Channels

Onboarding should present integrations in categories.

## Communication

```text
☐ WhatsApp
☐ Instagram
☐ Facebook Messenger
☐ Email
☐ SMS
```

## Marketing

```text
☐ Meta Ads
☐ Google Ads
☐ YouTube
```

## Analytics

```text
☐ Google Analytics
☐ Google Search Console
☐ Google Business Profile
☐ Google AdSense
```

The user can:

```text
Connect
```

or:

```text
Skip
```

for each integration.

---

# 110. Integration Connection Flow

Example: WhatsApp

```text
Tenant Onboarding
      ↓
Connect WhatsApp
      ↓
Meta Authorization
      ↓
Select Business
      ↓
Select WhatsApp Business Account
      ↓
Select Phone Number
      ↓
Verify Permissions
      ↓
Save Integration Account
      ↓
Sync
      ↓
Connected
```

The external OAuth credentials belong to the **tenant's integration account**, not the user's normal Teameit authentication identity.

---

# 111. Step 6 — CRM Setup

Allow the tenant to configure:

### Lead Pipeline

Default:

```text
New
 ↓
Contacted
 ↓
Qualified
 ↓
Proposal
 ↓
Negotiation
 ↓
Won
```

Tenant can later customize:

* Pipeline name
* Stages
* Stage order
* Probability
* Colors
* Default pipeline

### Contact Fields

Default fields:

* Name
* Phone
* Email
* Company
* Source

Custom fields can be created later.

---

# 112. Step 7 — Notification Preferences

Configure:

### Inbox

```text
☐ New message
☐ New conversation
☐ Assigned conversation
```

### Leads

```text
☐ New lead
☐ Lead assigned
☐ Lead status changed
```

### Campaigns

```text
☐ Campaign started
☐ Campaign completed
☐ Campaign failed
```

### Automations

```text
☐ Automation failed
☐ Workflow completed
```

Notification settings can be changed later.

---

# 113. Step 8 — Onboarding Complete

When required onboarding information is complete:

```text
onboarding_status = completed
```

Then:

```text
Onboarding
    ↓
Dashboard
```

Dashboard should immediately show:

```text
Welcome to Teameit

Business: ABC Marketing

Connected Channels
├── WhatsApp     Connected
├── Instagram    Not connected
├── Facebook     Not connected
├── Email        Connected
└── SMS          Not connected

Complete Setup
████████░░ 80%
```

---

# 114. Onboarding Progress

Track progress in the tenant.

Recommended fields:

```text
onboarding_status
onboarding_step
onboarding_completed_at
```

Example:

```text
onboarding_status = in_progress
onboarding_step = 5
```

This allows the user to leave and return later.

---

# 115. Onboarding Sessions

For more detailed tracking, create:

## tenant_onboarding

```text
tenant_onboarding
---------
id
tenant_id
current_step
status
business_setup_completed
team_setup_completed
crm_setup_completed
integration_setup_completed
notification_setup_completed
started_at
completed_at
updated_at
```

This should be separate from the tenant's core business information.

---

# 116. Onboarding Events

Track important onboarding events:

```text
tenant.created
onboarding.started
business.profile.completed
team.setup.completed
crm.setup.completed
integration.connected
integration.skipped
notifications.configured
onboarding.completed
```

These can be stored in the existing audit/event system.

---

# 117. Existing User Joining an Existing Tenant

Onboarding is different when a user receives an invitation.

Flow:

```text
Invitation
 ↓
Supabase Authentication
 ↓
Accept Invitation
 ↓
Create / Link Teameit User
 ↓
Create tenant_members record
 ↓
Assign invited role
 ↓
Assign team
 ↓
User Dashboard
```

The invited user should **not create a new tenant automatically**.

---

# 118. Multiple Tenant Support

A user may belong to multiple organizations.

Example:

```text
Mohammed
│
├── ABC Marketing
│    └── Owner
│
├── XYZ Agency
│    └── Admin
│
└── Demo Company
     └── Analyst
```

After login:

```text
Select Workspace

ABC Marketing
XYZ Agency
Demo Company
```

Then:

```text
Active Tenant
      ↓
Tenant Context
      ↓
Application
```

---

# 119. Tenant Switcher

The main application should have a tenant/workspace switcher.

Example:

```text
┌───────────────────────┐
│ ABC Marketing      ▼  │
├───────────────────────┤
│ ABC Marketing         │
│ XYZ Agency            │
│ Demo Company          │
├───────────────────────┤
│ + Create Workspace    │
└───────────────────────┘
```

Switching tenants must refresh the authorized application context.

---

# 120. Tenant Creation API

```text
POST /tenants
```

Request:

```json
{
  "name": "ABC Marketing",
  "website": "https://example.com",
  "country": "IN",
  "timezone": "Asia/Kolkata",
  "currency": "INR",
  "industry": "Marketing"
}
```

Backend performs:

```text
Authenticate user
 ↓
Validate request
 ↓
Create tenant
 ↓
Create owner membership
 ↓
Assign Owner role
 ↓
Create default pipeline
 ↓
Create default stages
 ↓
Create onboarding record
 ↓
Return tenant
```

This should be performed transactionally wherever possible.

---

# 121. Onboarding APIs

```text
GET  /onboarding
PATCH /onboarding

POST /onboarding/business
POST /onboarding/team
POST /onboarding/crm
POST /onboarding/integrations
POST /onboarding/notifications

POST /onboarding/complete
POST /onboarding/skip
```

---

# 122. Onboarding Middleware

The application should determine:

```text
Is authenticated?
        ↓
Does user have tenant?
        ↓
Does tenant onboarding exist?
        ↓
Is onboarding complete?
```

If the user has not completed required onboarding:

```text
/authenticated
       ↓
/onboarding
```

After completion:

```text
/onboarding
       ↓
/dashboard
```

---

# 123. Onboarding Security

Important:

The frontend must NOT be allowed to choose:

```text
tenant.owner_id
tenant_id
role = owner
```

The backend determines ownership.

For the initial tenant creator:

```text
Authenticated Supabase User
        ↓
Backend
        ↓
Create Tenant
        ↓
Create Owner Membership
```

For invited users:

```text
Invitation
        ↓
Backend validates invitation
        ↓
Create Membership
        ↓
Apply predefined role
```

---

# 124. Final Authentication + Tenant Architecture

This is now the complete flow:

```text
                    USER
                      │
                      ▼
                SUPABASE AUTH
                      │
                 Authenticated
                      │
                      ▼
                TEAMEIT USER
                      │
             ┌────────┴────────┐
             │                 │
        Create Tenant      Accept Invite
             │                 │
             ▼                 ▼
          TENANT          TENANT MEMBER
             │                 │
             └────────┬────────┘
                      │
                   ROLE
                      │
                PERMISSIONS
                      │
                 ONBOARDING
                      │
       ┌──────────────┼──────────────┐
       │              │              │
    Business        Team           CRM
       │              │              │
       └──────────────┼──────────────┘
                      │
                 INTEGRATIONS
                      │
                      ▼
                  DASHBOARD
```

---

# 125. Updated Main Module List

Add **Tenant Onboarding** to the official Teameit modules.

```text
1. Dashboard
2. Authentication
3. Tenant Management
4. Tenant Onboarding
5. Users
6. Teams
7. Roles & Permissions
8. CRM
9. Contacts
10. Leads
11. Unified Inbox
12. WhatsApp Business
13. Instagram
14. Facebook
15. Meta Business Suite
16. Meta Ads
17. Email Marketing
18. SMS
19. Campaigns
20. Automation Engine
21. Workflow Builder
22. Universal Publishing
23. Content Calendar
24. Catalog
25. Google Ads
26. Google Analytics
27. Google Search Console
28. Google SEO
29. Google Business Profile
30. YouTube
31. Google AdSense
32. Unified Analytics
33. Reports
34. Notifications
35. Integrations
36. Media Library
37. Audit Logs
38. Usage
39. Billing
40. System Health
41. Administration
```

---

# 126. Final Ownership

The final architecture is:

```text
SUPABASE AUTH
    │
    │ Authentication
    ▼
TEAMEIT USER
    │
    │ Membership
    ▼
TENANT
    │
    │ Onboarding
    ▼
BUSINESS WORKSPACE
    │
    ├── Team
    ├── CRM
    ├── Channels
    ├── Campaigns
    ├── Automations
    ├── Publishing
    ├── Analytics
    └── Reports
```

### Final rule

**Authentication creates/identifies the person.**

**Tenant onboarding creates/configures the business workspace.**

**Tenant membership determines which workspace the person belongs to.**

**Roles and permissions determine what that person can do inside the workspace.**

This should now be considered part of the **final Teameit architecture and development specification**.
