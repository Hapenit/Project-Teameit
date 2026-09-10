# TEAMEIT

## Master Development Specification

### Version 1.0 — Product & Engineering Baseline

---

# 1. Product Vision

Teameit is a **multi-tenant marketing, communication, automation, CRM, publishing, advertising and analytics platform**.

The core concept is:

> **One platform → multiple channels → one customer → one campaign → one automation → one analytics layer.**

Teameit should connect and manage:

* WhatsApp Business
* Instagram
* Facebook
* Meta Business Suite
* Meta Ads
* Google Ads
* Google Analytics
* Google Search Console
* Google Business Profile
* Google SEO intelligence
* YouTube
* Google AdSense
* Email
* SMS

The external platforms should be treated as **integrations/providers**, while Teameit's CRM, Campaign, Automation, Communication, Publishing and Analytics engines remain the central product.

---

# 2. Recommended Technology Stack

## Frontend

* React
* TypeScript
* React Router
* API client layer
* State management
* Form validation
* Component/design system
* Responsive dashboard
* Rich text/content editor
* Workflow builder
* Charts/analytics components
* Calendar
* File/media management

## Backend

* Node.js
* TypeScript
* REST API
* WebSocket/realtime layer where required
* Background workers
* Queue system
* Scheduled jobs
* Webhook processing
* Integration adapters
* Authentication/authorization service

## Database

* Supabase
* PostgreSQL
* Row Level Security
* Supabase Auth where appropriate
* Supabase Storage
* Realtime where useful

## Architecture

Use:

```text
React Frontend
       ↓
Node.js API
       ↓
Core Services
       ↓
PostgreSQL / Supabase
       ↓
Integration Layer
       ↓
External APIs
```

Background processing:

```text
API
 ↓
Queue
 ↓
Worker
 ↓
External Provider
 ↓
Webhook
 ↓
Event Processor
 ↓
Database
 ↓
Analytics
```

---

# 3. Core Architecture Principle

Do NOT build Teameit as completely independent applications:

```text
WhatsApp App
Instagram App
Facebook App
Google App
Email App
SMS App
```

Instead:

```text
                         TEAMEIT
                            │
                     MULTI-TENANT CORE
                            │
       ┌────────────────────┼────────────────────┐
       │                    │                    │
      CRM              COMMUNICATION        CAMPAIGNS
       │                    │                    │
       └────────────────────┼────────────────────┘
                            │
                       AUTOMATION
                            │
                       PUBLISHING
                            │
                     INTEGRATION LAYER
                            │
       ┌─────────┬──────────┼──────────┬─────────┐
       │         │          │          │         │
   WhatsApp  Instagram  Facebook    Google   YouTube
       │         │          │          │         │
       └─────────┴──────────┼──────────┴─────────┘
                            │
                       ANALYTICS
                            │
                       REPORTING
```

Every integration should implement a common provider interface wherever practical.

---

# 4. Multi-Tenant Core

## 4.1 Organizations/Tenants

Each business using Teameit is a tenant.

Tenant data must be isolated.

Core fields:

* id
* name
* slug
* logo
* timezone
* currency
* country
* status
* subscription
* created_at
* updated_at

Every tenant-owned table should contain:

```text
tenant_id
```

---

# 5. Users, Teams and Permissions

## Users

* Create user
* Invite user
* Accept invitation
* Activate/deactivate
* Profile
* Avatar
* Timezone
* Notification preferences

## Teams

* Create team
* Edit team
* Delete team
* Team members
* Team leader
* Team permissions

## Roles

Recommended default roles:

* Super Admin
* Tenant Owner
* Admin
* Manager
* Marketing Manager
* Sales Manager
* Agent
* Content Manager
* Analyst
* Custom Role

## Permission Categories

* Dashboard
* CRM
* Contacts
* Leads
* Inbox
* Campaigns
* Automations
* Publishing
* Advertising
* Analytics
* SEO
* Integrations
* Reports
* Settings
* Billing
* Users
* Teams
* Audit Logs

Permissions:

```text
view
create
edit
delete
publish
send
manage
export
```

---

# 6. CRM

## 6.1 Contacts

Fields:

* First name
* Last name
* Phone
* Email
* Company
* Job title
* Country
* City
* Source
* Owner
* Status
* Tags
* Custom fields
* Created date
* Updated date

## 6.2 Contact Identity

Support external identities:

```text
Contact
 ├── WhatsApp identity
 ├── Instagram identity
 ├── Facebook identity
 ├── Email identity
 └── SMS identity
```

Identity matching must be conservative. Do not automatically merge people solely because two channels contain similar names.

## 6.3 Customer Timeline

Display:

* Messages
* Emails
* SMS
* Leads
* Campaign interactions
* Automation events
* Notes
* Tasks
* Calls/events where later integrated
* Website events where available
* Conversions

---

# 7. Lead Management

## Pipeline

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
Won / Lost
```

Features:

* Lead creation
* Lead source
* Campaign
* Owner
* Team
* Value
* Stage
* Priority
* Notes
* Tasks
* Follow-up
* Tags
* Conversion tracking
* Activity history

---

# 8. Unified Inbox

Primary channels:

* WhatsApp
* Instagram
* Facebook Messenger
* Email
* SMS

Interface:

```text
┌─────────────────────────────────────┐
│ Search / Filters                    │
├──────────────┬──────────────────────┤
│ Conversations│ Conversation         │
│              │                      │
│ Ahmed        │ Customer details     │
│ Priya        │ Message history      │
│ John         │                      │
│              │ Reply composer       │
└──────────────┴──────────────────────┘
```

Features:

* Unified conversations
* Search
* Unread
* Assigned
* Unassigned
* Starred
* Archived
* Labels
* Tags
* Internal notes
* Assignment
* Team assignment
* Agent assignment
* Customer profile
* Conversation history

---

# 9. WhatsApp Business

## Connection

* Business Portfolio
* WABA
* Phone number
* Access credentials
* Webhooks
* Connection status
* Permission status
* API health
* Reconnect
* Disconnect
* Synchronization

## Messaging

* Text
* Images
* Videos
* Documents
* Audio
* Location
* Contacts
* Interactive messages
* Buttons
* Lists
* CTA messages
* Product messages
* Catalog messages
* Templates

## Message Status

* Sending
* Sent
* Delivered
* Read
* Failed
* Failure reason

## Templates

* Create
* Edit
* Delete
* Sync
* Category
* Language
* Variables
* Header
* Body
* Footer
* Buttons
* Approval status
* Rejection status

## Campaigns

* Audience
* Segmentation
* Template
* Personalization
* Media
* Scheduling
* Start
* Pause
* Resume
* Cancel
* Duplicate
* History

## Automation

Triggers:

* Incoming message
* Keyword
* Button
* List selection
* New contact
* Campaign response
* Product enquiry
* Business hours

Actions:

* Reply
* Send template
* Create lead
* Add tag
* Assign agent
* Follow-up
* Wait
* Branch
* Human handoff

## Catalog

* Products
* Categories
* Images
* Price
* Currency
* SKU
* Description
* Inventory
* Search
* Product sharing

## Analytics

* Sent
* Delivered
* Read
* Failed
* Replies
* Response rate
* Delivery rate
* Read rate
* Campaign performance
* Agent performance
* Automation performance

---

# 10. Instagram

## Account

* Professional account
* Facebook Page relationship
* Connection
* Permissions
* Synchronization

## Messaging

* DMs
* Conversation history
* Assignment
* Labels
* Notes
* Customer profile

## Comments

* Monitor comments
* Reply
* Keyword detection
* Automation where supported
* Lead creation

## Publishing

* Image
* Video
* Carousel
* Reel
* Caption
* Hashtags
* Scheduling
* Drafts
* Publishing status
* Post history

## Analytics

* Reach
* Impressions
* Engagement
* Likes
* Comments
* Shares
* Saves
* Followers
* Reel performance

---

# 11. Facebook

## Pages

* Connect pages
* Page information
* Posts
* Media
* Notifications
* Analytics

## Messenger

* Messages
* Conversations
* Assignment
* Customer profile
* Labels
* Notes
* Automation

## Comments

* Monitor
* Reply
* Keyword automation
* Lead creation

## Publishing

* Text
* Image
* Video
* Link
* Scheduling
* Drafts
* Publishing status

## Analytics

* Reach
* Impressions
* Engagement
* Reactions
* Comments
* Shares
* Followers
* Content performance

---

# 12. Meta Business Suite

Meta Business Suite becomes the central Meta integration layer.

## Business Portfolio

* Connect Business
* Business ID
* Business information
* Business status
* Permissions

## Assets

* Facebook Pages
* Instagram accounts
* WhatsApp Business Accounts
* WhatsApp phone numbers
* Meta Ad Accounts
* Catalogs
* Datasets/pixels where supported

## Unified Meta Inbox

```text
WhatsApp
Instagram
Facebook Messenger
       ↓
   Meta Inbox
       ↓
      CRM
```

## Publishing

One composer for:

* Facebook
* Instagram
* Reels
* Stories where supported

Features:

* Media
* Captions
* Hashtags
* Scheduling
* Drafts
* Preview
* Publish
* Failure handling
* History

---

# 13. Meta Ads

## Ad Accounts

* Connect
* Account status
* Spend limits where available
* Billing-related status where available

## Campaign

* Create
* Edit
* Duplicate
* Pause
* Resume
* Budget
* Objective
* Status

## Ad Sets

* Audience
* Budget
* Schedule
* Placements
* Optimization
* Targeting

## Ads

* Creative
* Copy
* Headline
* Media
* CTA
* Preview
* Status

## Analytics

* Spend
* Impressions
* Reach
* Clicks
* CTR
* CPC
* CPM
* Leads
* Conversions
* Cost per result
* ROAS where available

---

# 14. Email Marketing

## Providers

Build a provider abstraction:

```text
Teameit Email
       ↓
Email Provider Adapter
       ↓
Provider
```

Features:

* SMTP
* Marketing provider
* Transactional provider
* Sender identities
* Domain verification
* SPF
* DKIM
* DMARC
* Sending health

## Campaigns

* Create
* Subject
* Preview text
* Sender
* Reply-to
* HTML
* Plain text
* Templates
* Personalization
* Schedule
* Send
* Pause
* Cancel
* Duplicate

## Email Builder

Blocks:

* Text
* Image
* Button
* Divider
* Columns
* Header
* Footer
* Social links
* Dynamic content

Variables:

```text
{{first_name}}
{{last_name}}
{{company}}
{{custom_field}}
```

## Email Analytics

* Sent
* Delivered
* Bounced
* Opened
* Clicked
* Unsubscribed
* Failed
* Open rate
* Click rate
* Bounce rate
* Conversion rate

---

# 15. SMS

Use a provider abstraction.

```text
Teameit SMS
     ↓
SMS Provider Layer
     ↓
Provider
```

## Messaging

* One-to-one
* Bulk
* Scheduled
* Transactional
* Marketing where permitted
* Personalization
* Delivery tracking

## Campaign

* Audience
* Segmentation
* Template
* Schedule
* Send
* Pause
* Cancel
* Retry

## Automation

Triggers:

* New lead
* New contact
* Purchase
* Appointment
* Form submission
* Campaign event
* Webhook
* Schedule
* Inactivity

Actions:

* Send SMS
* Add tag
* Create lead
* Assign agent
* Update contact
* Wait
* Branch
* Trigger automation

## India SMS Requirements

The architecture must be capable of supporting applicable:

* TRAI requirements
* DLT
* Sender IDs
* Template registration

Do not assume generic SMS delivery.

---

# 16. Google Ads

## Account

* OAuth
* Customer account
* Manager account where applicable
* Account status

## Campaigns

Support relevant campaign types according to the current API:

* Search
* Display
* Video
* Shopping
* Performance Max
* Other supported types

## Management

* Campaigns
* Ad groups
* Ads
* Keywords
* Budgets
* Bidding
* Locations
* Audiences
* Pause/resume

## Analytics

* Impressions
* Clicks
* CTR
* CPC
* Spend
* Conversions
* Conversion rate
* CPA
* ROAS where available

---

# 17. Google Analytics

## Connection

* Google OAuth
* Account
* Property
* Data stream

## Metrics

* Users
* New users
* Sessions
* Engagement
* Events
* Conversions
* Revenue where available

## Acquisition

* Organic
* Paid
* Social
* Direct
* Referral
* Campaign

## Reports

* Traffic
* Campaign
* Conversion
* Channel
* Landing page
* Page performance
* Date comparison

---

# 18. Google Search Console

## Properties

* Connect website
* Select property
* Property status
* Synchronization

## Search Performance

* Clicks
* Impressions
* CTR
* Average position

## Queries

* Keyword
* Clicks
* Impressions
* CTR
* Position

## Pages

* Top pages
* Page performance
* Growing pages
* Declining pages

## SEO Intelligence

* High-impression/low-CTR keywords
* Near-page-one keywords
* Declining keywords
* Content opportunities

## Technical

Where supported:

* Indexing information
* Sitemaps
* URL inspection
* Search status

---

# 19. Google SEO Intelligence

SEO should be Teameit's intelligence layer.

## Audit

* Missing titles
* Missing descriptions
* Duplicate metadata
* Broken links
* Indexing problems
* Sitemap issues
* Canonical issues
* Structured data checks
* Page-speed integrations where implemented

## Opportunities

* Keyword opportunities
* CTR opportunities
* Position opportunities
* Content opportunities
* Internal-link opportunities

## Optional Third-Party SEO Provider Layer

Future integrations may provide:

* Keyword volume
* Keyword difficulty
* Competitor keywords
* Competitor rankings
* Backlinks
* SERP data

---

# 20. Google Business Profile

## Locations

* Multiple locations
* Business information
* Opening hours
* Special hours
* Location management

## Posts

* Updates
* Offers
* Events
* Images
* Scheduling where supported

## Reviews

* Monitor reviews
* Reply where supported
* Review history
* Review analytics

## Performance

* Searches
* Views
* Calls
* Website visits
* Direction requests
* Other available metrics

---

# 21. YouTube

## Channel

* Connect channel
* Channel information
* Subscribers
* Videos
* Playlists

## Content

* Upload
* Metadata
* Title
* Description
* Thumbnail
* Tags where supported
* Playlist assignment
* Scheduling where supported

## Comments

* View
* Reply
* Management

## Analytics

* Views
* Watch time
* Subscribers
* Likes
* Comments
* Shares
* Traffic sources
* Audience data where available
* Video performance

## Content Types

* Videos
* Shorts
* Playlists
* Live-related features where supported

---

# 22. Google AdSense

## Account

* Connect
* Account status
* Sites/properties

## Revenue

* Earnings
* Estimated earnings
* Impressions
* Clicks
* CTR
* RPM
* Page views where available

## Reports

* Daily
* Monthly
* Site-level
* Revenue trends
* Period comparison

---

# 23. Universal Publishing Engine

Create one Teameit Content Composer.

```text
CREATE CONTENT
      ↓
SELECT CHANNELS
      ↓
CUSTOMIZE PER CHANNEL
      ↓
PREVIEW
      ↓
SCHEDULE / PUBLISH
```

Supported channels:

* Instagram
* Facebook
* YouTube
* Google Business Profile
* Other supported providers

Features:

* Drafts
* Media upload
* Caption
* Platform-specific customization
* Preview
* Schedule
* Publish
* Publishing status
* Failed publishing
* Retry
* History

---

# 24. Content Calendar

Calendar items:

* Social posts
* Reels
* YouTube videos
* Google Business posts
* WhatsApp campaigns
* Email campaigns
* SMS campaigns
* Ad campaigns
* Automation activities

Views:

* Day
* Week
* Month
* List

Filters:

* Platform
* Campaign
* Team member
* Status
* Account

---

# 25. Campaign Engine

Campaigns are first-class Teameit objects.

Example:

```text
Campaign
   │
   ├── WhatsApp
   ├── SMS
   ├── Email
   ├── Instagram
   ├── Facebook
   ├── Meta Ads
   ├── Google Ads
   ├── YouTube
   └── Google Business
```

## Campaign Fields

* Campaign ID
* Tenant ID
* Name
* Description
* Objective
* Owner
* Budget
* Start date
* End date
* Status
* Tags
* Created date

## Campaign Status

```text
Draft
Scheduled
Running
Paused
Completed
Cancelled
Failed
```

## Campaign Analytics

Connect:

```text
Campaign ID
    ↓
Channel Events
    ↓
Leads
    ↓
Conversions
    ↓
Revenue
```

---

# 26. Automation Engine

This is one of Teameit's core systems.

## Trigger Types

* Message received
* Keyword
* Comment
* DM
* New contact
* New lead
* Campaign response
* Form submission
* Purchase
* Appointment
* Webhook
* API event
* Schedule
* Inactivity
* Tag added
* Tag removed

## Conditions

* Keyword
* Tag
* Contact field
* Lead status
* Campaign
* Platform
* Time
* Business hours
* Previous interaction
* Product
* Custom condition

## Actions

* Send message
* Send template
* Send email
* Send SMS
* Reply
* Add tag
* Remove tag
* Create lead
* Assign user
* Assign team
* Update contact
* Wait
* Branch
* Trigger automation
* Notify team
* End workflow

---

# 27. Workflow Builder

Frontend should provide a visual workflow builder.

Example:

```text
        NEW LEAD
           │
           ▼
    SEND WHATSAPP
           │
           ▼
       WAIT 2 HOURS
           │
           ▼
     REPLIED?
      /      \
    YES       NO
    │          │
    ▼          ▼
ASSIGN       SEND EMAIL
AGENT           │
                ▼
             WAIT 1 DAY
                │
                ▼
             SEND SMS
```

Each node should have:

* Node ID
* Type
* Configuration
* Position
* Connections
* Validation status

Workflow versions should be stored so active executions are not unexpectedly changed when a user edits a workflow.

---

# 28. Automation Execution Engine

Required backend concepts:

* Workflow definition
* Workflow version
* Execution
* Execution step
* Trigger event
* Queue job
* Retry
* Error
* Execution log

Example:

```text
Webhook
   ↓
Event Processor
   ↓
Find Matching Workflow
   ↓
Create Execution
   ↓
Queue Step
   ↓
Worker
   ↓
Execute Action
   ↓
Save Result
   ↓
Next Step
```

---

# 29. Notification System

Notify users about:

* New message
* New lead
* Campaign started
* Campaign completed
* Campaign failed
* Automation failed
* Integration expired
* Token needs reconnection
* Publishing failed
* Ad rejected
* Synchronization failed

Notification channels can later include:

* In-app
* Email
* Push
* SMS where appropriate

---

# 30. Analytics Architecture

All integrations should feed a normalized analytics layer.

```text
External Platforms
        ↓
Provider Adapters
        ↓
Event / Metrics Normalization
        ↓
Teameit Analytics
        ↓
Dashboard
        ↓
Reports
```

Do not force every provider into identical metrics where the underlying definitions differ.

Store:

* Provider
* Account
* Metric
* Metric definition
* Value
* Date/time
* Campaign
* Content
* Source
* Tenant

---

# 31. Unified Dashboard

## Marketing

* Campaigns
* Leads
* Conversions
* Spend

## Social

* Instagram
* Facebook
* YouTube

## Messaging

* WhatsApp
* Instagram DM
* Messenger
* Email
* SMS

## Advertising

* Meta Ads
* Google Ads

## Website

* Google Analytics

## SEO

* Search Console
* SEO analysis

## Business

* Google Business Profile

## Revenue

* AdSense
* Campaign revenue where integrated

---

# 32. Report Builder

Users should be able to create reports from available datasets.

Example:

```text
CAMPAIGN REPORT

Campaign
↓
Spend
↓
Impressions
↓
Clicks
↓
Leads
↓
Messages
↓
Website Visits
↓
Conversions
↓
Revenue
↓
ROI
```

Report features:

* Date range
* Filters
* Grouping
* Metrics
* Charts
* Tables
* Export
* Saved reports

---

# 33. Integration Framework

Every external integration should have:

```text
Integration
 ├── Provider
 ├── Account
 ├── Credentials
 ├── Permissions
 ├── Status
 ├── Webhooks
 ├── Sync
 ├── Errors
 └── Health
```

Common states:

```text
Connected
Connecting
Expired
Permission Required
Disconnected
Error
Rate Limited
```

## Integration Security

Never expose provider secrets to React.

```text
React
 ↓
Node API
 ↓
Encrypted credentials
 ↓
Provider API
```

Use encryption/secrets management appropriate to deployment.

---

# 34. Webhook Architecture

Webhook endpoint pattern:

```text
POST /webhooks/:provider
```

Process:

```text
External Provider
       ↓
Webhook Endpoint
       ↓
Validate Signature
       ↓
Store Raw Event
       ↓
Return Success Quickly
       ↓
Queue Processing
       ↓
Normalize Event
       ↓
Update Database
       ↓
Trigger Automation
       ↓
Update Analytics
```

Important:

* Signature validation
* Idempotency
* Event IDs
* Retry handling
* Dead-letter handling
* Logging
* Provider-specific payload storage

---

# 35. Background Jobs

Use workers for operations that should not block API requests.

Examples:

* Bulk messaging
* Campaign delivery
* Analytics synchronization
* Token refresh
* Webhook processing
* Scheduled publishing
* Email sending
* SMS sending
* Report generation
* Data imports
* Retry jobs

---

# 36. Database Core Tables

Recommended initial database model:

```text
tenants
users
teams
team_members
roles
permissions
role_permissions
user_roles

contacts
contact_identities
contact_tags
tags
custom_fields
contact_custom_values

leads
pipelines
pipeline_stages
lead_activities
tasks
notes

conversations
conversation_participants
messages
message_attachments
message_events
conversation_labels

integrations
integration_accounts
integration_credentials
integration_permissions
integration_webhooks
integration_sync_logs
integration_errors

campaigns
campaign_channels
campaign_audiences
campaign_recipients
campaign_events

automations
automation_versions
automation_nodes
automation_edges
automation_executions
automation_execution_steps
automation_logs

content
content_assets
content_variants
publishing_jobs
publishing_results

ad_accounts
ad_campaigns
ad_sets
ads
ad_creatives

analytics_sources
analytics_metrics
analytics_events
analytics_daily_metrics

seo_properties
seo_queries
seo_pages
seo_metrics
seo_issues

catalogs
products
product_categories

notifications
notification_preferences

reports
report_definitions
report_runs

audit_logs
usage_records
subscriptions
billing_records
```

---

# 37. Database Rules

Every tenant-owned table should be tenant-isolated.

Example:

```text
contacts
---------
id
tenant_id
first_name
last_name
...
```

Supabase Row Level Security should ensure:

```text
User A / Tenant A
        ↓
Can only access Tenant A data
```

Never depend only on frontend filtering for tenant security.

---

# 38. API Structure

Recommended structure:

```text
/api/v1/auth
/api/v1/tenants
/api/v1/users
/api/v1/teams
/api/v1/contacts
/api/v1/leads
/api/v1/conversations
/api/v1/messages
/api/v1/campaigns
/api/v1/automations
/api/v1/content
/api/v1/publishing
/api/v1/ads
/api/v1/analytics
/api/v1/seo
/api/v1/reports
/api/v1/integrations
/api/v1/notifications
/api/v1/admin
```

Provider-specific endpoints can sit behind the integration service rather than leaking provider-specific implementation throughout the application.

---

# 39. Frontend Main Navigation

```text
Dashboard

CRM
 ├── Contacts
 ├── Leads
 ├── Pipelines
 └── Customer Timeline

Inbox
 ├── All
 ├── WhatsApp
 ├── Instagram
 ├── Facebook
 ├── Email
 └── SMS

Campaigns
 ├── All Campaigns
 ├── Create Campaign
 └── Campaign Analytics

Automations
 ├── Workflows
 ├── Templates
 ├── Executions
 └── Logs

Publishing
 ├── Composer
 ├── Calendar
 ├── Drafts
 └── Published

Advertising
 ├── Meta Ads
 └── Google Ads

Analytics
 ├── Overview
 ├── Social
 ├── Messaging
 ├── Advertising
 ├── Website
 ├── SEO
 └── Revenue

SEO

Catalog

Reports

Integrations

Settings
 ├── Organization
 ├── Users
 ├── Teams
 ├── Roles
 ├── Notifications
 ├── Billing
 └── Security
```

---

# 40. Media Management

Central media library:

* Images
* Videos
* Documents
* Audio
* Thumbnails
* Email assets
* Campaign assets

Features:

* Upload
* Preview
* Search
* Tags
* Folder/category
* Metadata
* Delete
* Reuse
* Tenant isolation

Use Supabase Storage or equivalent object storage.

---

# 41. Audit Logs

Track sensitive actions:

```text
Who
What
When
Where
Target
Before
After
Result
```

Examples:

* User created
* User deleted
* Permission changed
* Integration connected
* Integration disconnected
* Campaign published
* Campaign paused
* Automation modified
* Contact deleted
* Message sent
* Ad changed

---

# 42. Error Management

Every integration needs standardized errors.

```text
Integration Error
       ↓
Provider Error Code
       ↓
Teameit Error Code
       ↓
User-Friendly Message
       ↓
Retry / Reconnect / Contact Admin
```

Store:

* Provider
* Error code
* HTTP status
* Request ID where available
* Event ID
* Timestamp
* Tenant
* User
* Resolution status

Never expose raw provider credentials or sensitive payloads in frontend error messages.

---

# 43. Rate Limits & Reliability

External APIs have different limits.

The integration framework should support:

* Rate limiting
* Queues
* Exponential backoff
* Retry
* Idempotency
* Circuit breaking where useful
* Provider-specific limits
* Dead-letter queue
* Failed job inspection

Bulk messaging must never simply run thousands of synchronous API calls from one HTTP request.

---

# 44. Campaign Recipient Engine

For bulk communication:

```text
Campaign
 ↓
Audience
 ↓
Audience validation
 ↓
Recipient creation
 ↓
Queue
 ↓
Worker
 ↓
Provider
 ↓
Delivery event
 ↓
Analytics
```

Recipient states:

```text
Pending
Queued
Processing
Sent
Delivered
Read
Failed
Skipped
Cancelled
```

---

# 45. Compliance & Consent

The system should support:

* Marketing consent
* Channel-specific consent
* Opt-out
* Unsubscribe
* Suppression lists
* Consent timestamp
* Consent source
* Privacy settings

Example:

```text
Contact
 ├── WhatsApp marketing: allowed
 ├── Email marketing: allowed
 └── SMS marketing: opted out
```

Do not assume consent on one channel automatically means consent on every channel.

---

# 46. Security Requirements

Minimum requirements:

* HTTPS
* Secure authentication
* Role-based access
* Tenant isolation
* RLS
* Encrypted credentials
* Secure cookies/token handling
* Input validation
* Rate limiting
* Audit logging
* Webhook signature validation
* Secret rotation
* Backup/recovery strategy
* Error monitoring

---

# 47. Development Phases

## Phase 1 — Core Platform

Build:

* Multi-tenancy
* Authentication
* Users
* Teams
* Roles
* Permissions
* CRM
* Contacts
* Leads
* Dashboard
* Audit logs
* Integration framework

---

## Phase 2 — WhatsApp

Build:

* Connection
* Inbox
* Messaging
* Templates
* Webhooks
* Campaigns
* Bulk sending
* Delivery tracking
* Automation
* Catalog
* Analytics

---

## Phase 3 — Meta

Build:

* Meta Business connection
* Facebook
* Instagram
* Messenger
* Instagram DMs
* Comments
* Unified Meta Inbox
* Publishing
* Calendar
* Meta analytics

---

## Phase 4 — Email + SMS

Build:

* Email provider layer
* Email campaigns
* Email templates
* Email automation
* Email analytics
* SMS provider layer
* SMS campaigns
* SMS automation
* SMS analytics
* Consent/opt-out

---

## Phase 5 — Automation Engine

Build the reusable workflow engine:

* Trigger
* Condition
* Action
* Wait
* Branch
* Execution
* Retry
* Logs
* Templates
* Cross-channel workflows

---

## Phase 6 — Advertising

Build:

* Meta Ads
* Google Ads
* Campaign synchronization
* Ad management
* Performance metrics
* Campaign attribution

---

## Phase 7 — Google Ecosystem

Build:

* Google Analytics
* Search Console
* Google Business Profile
* SEO intelligence
* YouTube
* AdSense

---

## Phase 8 — Universal Analytics & Reports

Build:

* Unified dashboard
* Cross-channel analytics
* Campaign attribution
* Report builder
* Scheduled reports
* Export
* Advanced dashboards

---

# 48. MVP Recommendation

Do not attempt every feature in the specification in the first production release.

The strongest MVP should be:

```text
Multi-Tenant Core
        ↓
CRM
        ↓
WhatsApp
        ↓
Instagram
        ↓
Facebook
        ↓
Unified Inbox
        ↓
Campaigns
        ↓
Automation
        ↓
Email
        ↓
SMS
        ↓
Meta Ads
```

Then expand into the Google ecosystem.

---

# 49. Definition of Done for Each Integration

An integration should not be considered complete merely because "Connect Account" works.

Each integration should have:

```text
□ OAuth / authentication
□ Account discovery
□ Permission validation
□ Credential storage
□ Connection health
□ Reconnect
□ Disconnect
□ Initial synchronization
□ Webhooks where applicable
□ Event processing
□ API error handling
□ Rate-limit handling
□ Retry handling
□ UI
□ Backend API
□ Database model
□ Logging
□ Analytics
□ Audit trail
□ Automated tests
□ Documentation
```

---

# 50. Final Teameit Architecture

```text
                           TEAMEIT
                              │
                 ┌────────────┴────────────┐
                 │     MULTI-TENANT CORE   │
                 └────────────┬────────────┘
                              │
       ┌──────────┬───────────┼───────────┬──────────┐
       │          │           │           │          │
      CRM     COMMUNICATION CAMPAIGNS AUTOMATION PUBLISHING
       │          │           │           │          │
       └──────────┴───────────┼───────────┴──────────┘
                              │
                     INTEGRATION LAYER
                              │
       ┌──────────┬───────────┼──────────┬──────────┐
       │          │           │          │          │
    META       GOOGLE       EMAIL       SMS      YOUTUBE
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
                       ANALYTICS LAYER
                              │
                   ┌──────────┴──────────┐
                   │                     │
               DASHBOARDS             REPORTS
```

---

# 51. Core Product Relationship

The final product should revolve around this relationship:

```text
                    CUSTOMER
                       │
                       ▼
                      CRM
                       │
             ┌─────────┴─────────┐
             │                   │
          MESSAGE             LEAD
             │                   │
             └─────────┬─────────┘
                       │
                    CAMPAIGN
                       │
                    AUTOMATION
                       │
          ┌────────────┼────────────┐
          │            │            │
       WhatsApp      Email         SMS
          │            │            │
       Instagram    Facebook      Google
          │            │            │
          └────────────┼────────────┘
                       │
                   CONVERSION
                       │
                    REVENUE
                       │
                   ANALYTICS
```

This is the central engineering principle for Teameit.

---

# 52. Final Product Modules

The development backlog should ultimately contain these top-level modules:

1. Dashboard
2. Multi-Tenant Core
3. Authentication
4. Users
5. Teams
6. Roles & Permissions
7. CRM
8. Contacts
9. Leads
10. Unified Inbox
11. WhatsApp Business
12. Instagram
13. Facebook
14. Meta Business Suite
15. Meta Ads
16. Email Marketing
17. SMS
18. Campaigns
19. Automation Engine
20. Workflow Builder
21. Universal Publishing
22. Content Calendar
23. Catalog
24. Google Ads
25. Google Analytics
26. Google Search Console
27. Google SEO
28. Google Business Profile
29. YouTube
30. Google AdSense
31. Unified Analytics
32. Reports
33. Notifications
34. Integrations
35. Media Library
36. Audit Logs
37. Usage
38. Billing
39. System Health
40. Administration

---

# 53. Engineering Rule

The development team should implement **core engines first and provider integrations second**.

The correct dependency direction is:

```text
CORE
 ↓
CRM
 ↓
COMMUNICATION
 ↓
CAMPAIGN
 ↓
AUTOMATION
 ↓
PUBLISHING
 ↓
INTEGRATIONS
 ↓
ANALYTICS
 ↓
REPORTING
```

Not:

```text
Build WhatsApp
Build Instagram
Build Facebook
Build Google
Build Email
...
```

independently.

This approach makes Teameit extensible and prevents every new channel from requiring a separate architecture.

---

# 54. Final Acceptance Principle

Before a module moves from development to production, the team must verify:

**Frontend → Backend API → Database → Provider API → Webhook → Queue → Event Processing → CRM/Campaign/Automation → Analytics**

as a complete end-to-end flow.

The product is not considered complete when the UI works.

It is complete when the **entire lifecycle works reliably**.

---

## TEAMEIT DEVELOPMENT BASELINE

**Frontend:** React + TypeScript

**Backend:** Node.js + TypeScript

**Database:** Supabase/PostgreSQL

**Storage:** Supabase Storage

**Core:** Multi-tenant + CRM + Communication + Campaign + Automation + Publishing + Analytics

**Channels:** WhatsApp + Instagram + Facebook + Email + SMS + YouTube + Google Business

**Advertising:** Meta Ads + Google Ads

**Google:** Analytics + Search Console + SEO + Business Profile + AdSense

**Administration:** Users + Teams + Roles + Permissions + Billing + Usage + Audit + System Health

**Architecture:** Provider-based integration architecture

**Primary objective:** One platform for managing customer communication, marketing campaigns, automation, publishing, advertising and analytics.


