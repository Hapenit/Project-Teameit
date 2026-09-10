import { Router } from 'express';
import { getDashboardStats, getAgentPerformance } from './analytics.controller';
import { requirePermission } from '../../middleware/rbac';

const router = Router();

// Technically we could use 'read' on a new 'analytics' module, or just require auth
router.get('/', requirePermission('crm', 'read'), getDashboardStats);
router.get('/agents', requirePermission('crm', 'read'), getAgentPerformance);

export default router;
