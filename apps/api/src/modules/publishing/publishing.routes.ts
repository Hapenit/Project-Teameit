import { Router } from 'express';
import { getPosts, createPost, getCapabilities, publishPost } from './publishing.controller';
import { requirePermission } from '../../middleware/rbac';

const router = Router();

router.get('/capabilities', requirePermission('publishing', 'read'), getCapabilities);
router.get('/posts', requirePermission('publishing', 'read'), getPosts);
router.post('/posts', requirePermission('publishing', 'write'), createPost);
router.post('/posts/:id/publish', requirePermission('publishing', 'write'), publishPost);

export default router;
