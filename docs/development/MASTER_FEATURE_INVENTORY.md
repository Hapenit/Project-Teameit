# TEAMEIT MASTER FEATURE INVENTORY

This document contains every Teameit module and feature, broken down hierarchically.

## 01. Authentication & Core Security
- Supabase Auth Integration
- Email/Password Sign Up
- Email/Password Sign In
- Password Reset
- Session Management
- Multi-Tenant Token Injection

## 02. Tenant / Workspace Management
- Tenant Creation
- Tenant Switching
- Tenant Settings
- Tenant Deletion
- Tenant Member Invitation
- Tenant Role Assignment (Owner, Admin, Member)

## 03. Roles & Permissions (RBAC)
- Permission Definition (e.g., `contacts.view`)
- Role Definition
- Role-to-Permission Mapping
- API Middleware Validation
- UI Capability Hiding

## 04. Row Level Security (RLS)
- Tenant Isolation Policies
- User Isolation Policies
- Automatic `tenant_id` Enforcement

## 05. CRM Core
- Contacts
  - Contact List View
  - Contact Profile View
  - Create/Edit/Archive Contact
  - Identity Matching (Cross-channel resolution)
  - Tags and Custom Fields
- Leads
  - Pipelines
  - Lead Stages
  - Activity Timeline

## 06. Integration Engine
- Provider Adapters Architecture
- OAuth Flow (Meta, Google, etc.)
- Webhook Ingestion (Signature verification)
- Webhook Idempotency (Deduplication)
- Background Processing Queue

## 07. Unified Inbox
- WhatsApp Channel
  - Direct Messaging (Text, Media, Templates)
  - Message Status Tracking (Sent, Delivered, Read)
- Instagram Channel
  - DM Processing
  - Comment Processing
- Facebook Messenger Channel
- Real-time UI updates
- Agent Assignment
- Unread Counters

## 08. Universal Publishing
- Content Composer
- Multi-channel Selection (IG, FB, YouTube)
- Drafts and Approvals
- Scheduling Engine
- Background Worker (Cron)

## 09. Automation Engine
- Visual Workflow Builder (React Flow)
- Triggers (Incoming Message, Lead Created)
- Conditions (Keywords, Tags)
- Actions (Send Message, Assign Agent)
- Workflow Execution Parser

## 10. Campaign / Broadcast Engine
- Target Audience Selection (Segments/Tags)
- Message Composition
- Job Queue Generation
- Bulk Processing Worker
- Rate Limit Handling
- Delivery Tracking

## 11. Advertising (Meta / Google)
- Ad Account Connection
- Campaign Syncing
- Lead Syncing
- Spend / ROAS Tracking

## 12. Unified Analytics
- Aggregated Dashboards
- Channel Distribution
- Message Volume Trends
- Custom Report Builder

## 13. System Admin (Super Admin)
- Global Tenant Overview
- Usage Monitoring
- Billing Integration (Stripe)
- System Health & Audit Logs
