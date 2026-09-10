import { Router } from 'express';
import multer from 'multer';
import { getMedia, uploadMedia, deleteMedia } from './media.controller';
import { requirePermission } from '../../middleware/rbac';

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

// For MVP, we'll map these to 'publishing' permissions, as media is primarily used there.
// Alternatively, a dedicated 'media' permission could be created.
router.get('/', requirePermission('publishing', 'read'), getMedia);
router.post('/upload', requirePermission('publishing', 'write'), upload.single('file'), uploadMedia);
router.delete('/:id', requirePermission('publishing', 'write'), deleteMedia);

export default router;
