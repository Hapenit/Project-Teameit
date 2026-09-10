import { Router } from 'express';
import { getConversations, getMessages, assignAgent, getTenantMembers, sendMessage } from './inbox.controller';
import { requirePermission } from '../../middleware/rbac';

const router = Router();

router.get('/conversations', requirePermission('inbox', 'read'), getConversations);
router.get('/conversations/:conversationId/messages', requirePermission('inbox', 'read'), getMessages);
router.put('/conversations/:conversationId/assign', requirePermission('inbox', 'write'), assignAgent);
router.get('/team', requirePermission('inbox', 'read'), getTenantMembers);
router.post('/conversations/:conversationId/messages', requirePermission('inbox', 'write'), sendMessage);

export default router;
