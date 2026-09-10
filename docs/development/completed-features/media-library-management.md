# Feature: Media Library Management

### Purpose
To provide a central repository where tenant users can upload, manage, and reuse their creative assets (images, videos) for social media publishing and email campaigns.

### User stories
- As a Content Creator, I want to upload multiple images or videos into a central folder.
- As a Content Creator, I want to browse my previously uploaded media so I can attach it to a new social post or email campaign.
- As a Tenant Admin, I want to delete old media to save storage space.

### UI
- **Media Library Page (`/media`)**:
  - A grid view displaying thumbnails of all uploaded media.
  - A prominent "Upload Asset" button that opens a file selection dialog.
  - Options to filter by type (Image/Video).
  - A modal to view a larger version of the media and delete it.
- **Content Composer (`/publishing/new`)**:
  - Add a "Select from Media Library" button that opens a mini-browser modal.

### Frontend
- **Components**: `MediaLibrary.tsx`, `MediaBrowserModal.tsx` (reusable).
- **Services**: `GET /api/v1/media`, `POST /api/v1/media/upload`, `DELETE /api/v1/media/:id`.

### Backend
- **Dependencies**: `multer` (for handling multipart/form-data uploads).
- **Controllers**: `media.controller.ts`
- **Routes**: `media.routes.ts` (Already registered in `app.ts` as a placeholder, need to implement).
- **Storage**: For MVP, we will store files in Supabase Storage. We will create a `tenant-media` bucket.

### Database
- **Tables**: `media_assets`
  - `id` (uuid)
  - `tenant_id` (uuid)
  - `filename` (text)
  - `file_url` (text)
  - `mime_type` (text)
  - `size_bytes` (bigint)
  - `created_at` (timestamptz)

### Security
- **Authentication**: JWT required.
- **RBAC**: Requires `publishing.read` and `publishing.write`.
- **Storage Policies**: Supabase Storage bucket policies must restrict access to the `tenant_id` folder.

### Acceptance criteria
- User can upload an image file.
- The file is saved to Supabase Storage and a database record is created.
- The Media Library UI displays the uploaded image.
- The user can delete the image.
