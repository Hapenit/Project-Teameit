import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { createTenant, getTenants, switchActiveTenant } from './tenants.controller';

const router = Router();

router.use(requireAuth);

router.post('/', createTenant);
router.get('/', getTenants);
router.post('/active', switchActiveTenant);

export default router;
