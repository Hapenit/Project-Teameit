# Feature: Contact Tags & Custom Fields

### Purpose
To allow tenants to categorize and store bespoke information on their CRM contacts. Tags allow for quick segmentation (e.g., "VIP", "Churned"), and custom fields allow tenants to store data specific to their business model (e.g., "Company Size", "Birthday") that isn't covered by the standard contact schema.

### User stories
- As a Tenant User, I want to add arbitrary tags to a contact so I can easily identify them later.
- As a Tenant User, I want to filter my contact list by specific tags.
- As a Tenant User, I want to store custom attributes on a contact (e.g., "Industry: Software") so I can track specialized data.
- As a Campaign Manager, I want to use tags to target a specific audience segment for a broadcast.

### UI
- **Contact Profile View**: Add a "Tags" section with a visual chip-input to add/remove tags. Add a "Custom Fields" key-value table to add/edit custom attributes.
- **Contact List View**: Display tags as colored chips next to the contact name. Add a filter dropdown to filter the list by tags.

### Frontend
- **Components**: `TagInput`, `CustomFieldsEditor`
- **Pages**: `ContactProfile.tsx`, `ContactsDashboard.tsx`
- **Services**: API calls to `PUT /api/v1/crm/contacts/:id`

### Backend
- **Routes**: `crm.routes.ts` (Existing)
- **Controllers**: `crm.controller.ts` (Update existing `updateContact` method to handle `tags` and `custom_fields` properly).
- **Validation**: Ensure `tags` is an array of strings, and `custom_fields` is a valid JSON object.

### Database
- **Tables**: Ensure the `contacts` table has a `tags` (text[]) column and a `custom_fields` (jsonb) column. (I will verify `006_crm_foundation.sql` to see if they exist. If not, I will add a migration).
- **Indexes**: Add GIN indexes on `tags` and `custom_fields` to allow for rapid filtering when building audiences.

### Security
- **Authentication**: JWT required.
- **RBAC**: Requires `crm.write` permission to update tags/fields.

### Integrations
- N/A directly, though integrations (like Shopify) might automatically push tags into the CRM.

### Background processing
- N/A

### Validation
- Prevent massive payloads in `custom_fields` (limit size).

### Error handling
- Handle malformed JSON for custom fields.

### Testing
- Unit: N/A (simple DB operations).
- Integration: Test `PUT /api/v1/crm/contacts/:id` correctly persists tags and custom fields.

### Acceptance criteria
- User can open a Contact Profile.
- User can type a tag, hit enter, and save it.
- User can add a custom field key/value pair and save it.
- The UI reflects the saved tags and custom fields.
- The tags/fields persist across page reloads.
