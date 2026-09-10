import { Router } from 'express';
import { getContacts, updateContact, getPipelines, addNote, addTask, completeTask, importContacts } from './crm.controller';
import { requirePermission } from '../../middleware/rbac';

const router = Router();

router.get('/contacts', requirePermission('crm', 'read'), getContacts);
router.put('/contacts/:id', requirePermission('crm', 'write'), updateContact);
router.get('/pipelines', requirePermission('crm', 'read'), getPipelines);
router.post('/contacts/import', requirePermission('crm', 'write'), importContacts);
router.post('/contacts/:id/notes', requirePermission('crm', 'write'), addNote);
router.post('/contacts/:id/tasks', requirePermission('crm', 'write'), addTask);
router.put('/contacts/tasks/:taskId/complete', requirePermission('crm', 'write'), completeTask);

export default router;
