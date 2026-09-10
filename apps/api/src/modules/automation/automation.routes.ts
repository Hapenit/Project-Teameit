import { Router } from 'express';
import { getWorkflows, getWorkflow, saveWorkflow, getWorkflowExecutions, executeWorkflow, resumeWorkflowExecution } from './automation.controller';
import { requirePermission } from '../../middleware/rbac';

const router = Router();

router.get('/workflows', requirePermission('automation', 'read'), getWorkflows);
router.get('/workflows/:id', requirePermission('automation', 'read'), getWorkflow);
router.post('/workflows', requirePermission('automation', 'write'), saveWorkflow);
router.post('/workflows/:id/execute', requirePermission('automation', 'write'), executeWorkflow);
router.post('/executions/:executionId/resume', requirePermission('automation', 'write'), resumeWorkflowExecution);
router.get('/workflows/:id/executions', requirePermission('automation', 'read'), getWorkflowExecutions);

export default router;
