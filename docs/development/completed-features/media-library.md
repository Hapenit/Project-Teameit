# Feature: Media Library

### Purpose
To provide a centralized repository for tenants to upload, view, and manage their multimedia assets (images, videos, documents). These assets can then be selected and attached to Social Publishing posts, WhatsApp Broadcast Campaigns, or directly sent in the Unified Inbox.

### User stories
- As a Content Creator, I want to upload an image to my tenant's library so I can use it in future Instagram posts.
- As a Support Agent, I want to quickly attach a PDF manual from the Media Library into a WhatsApp chat.
- As a Tenant Admin, I want to view all media uploaded by my team and delete outdated files to save storage space.

### UI
- **Media Library Dashboard (`/media`)**: A grid view of uploaded thumbnails. 
- **Upload Modal**: A drag-and-drop zone for users to upload new files.
- **Media Picker Modal (Future)**: A reusable component that can be launched from the Publishing or Inbox screens to select an existing file.

### Frontend
- **Components**: `MediaGrid`, `UploadZone`
- **Pages**: `MediaLibraryDashboard.tsx`
- **Services**: API calls to `GET /api/v1/media`, `POST /api/v1/media/upload`, `DELETE /api/v1/media/:id`.

### Backend
- **Routes**: `media.routes.ts`
- **Controllers**: `media.controller.ts`
- **Storage**: Since we are using Supabase, we will leverage Supabase Storage (S3-compatible) to physically host the files.

### Database
- **Tables**:
  - `media_assets` (id, tenant_id, file_name, file_url, file_type, file_size, created_by, created_at)
  - Migration: `016_media_library.sql`.

### Security
- **Authentication**: JWT required.
- **RBAC**: Requires `publishing.read` or `campaigns.read` to view, and `.write` to upload/delete.
- **RLS**: Assets are strictly scoped to the `tenant_id`.

### Integrations
- N/A

### Background processing
- Optional: Future cron job to clean up orphaned media files.

### Validation
- Restrict file types (e.g., only image/jpeg, image/png, video/mp4, application/pdf).
- Restrict file size (e.g., max 10MB per file).

### Error handling
- Handle Supabase Storage upload failures.
- Handle missing files on deletion.

### Testing
- Integration: Test uploading a mock file and verifying the `media_assets` row is created.

### Acceptance criteria
- User can navigate to the Media Library.
- User can select a file from their local machine and upload it.
- A progress indicator shows upload status.
- Upon completion, the new media thumbnail appears in the grid.
- User can click a media item to view its details or delete it.
