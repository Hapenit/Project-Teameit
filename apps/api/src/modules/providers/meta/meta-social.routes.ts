import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../../../config/supabase';
import { requirePermission } from '../../../middleware/rbac';
import { moderate, reply } from './meta-social.controller';

const router = Router();
const tenant = (req: Request) => req.tenantId as string;
const providerOk = (value: any) => value === 'instagram' || value === 'facebook';

router.use(requirePermission('inbox', 'read'));

router.get('/:provider/comments', async (req: Request, res: Response) => {
  const provider = req.params.provider;
  if (!providerOk(provider)) return res.status(400).json({ success: false, error: { message: 'Unsupported provider' } });
  let query = supabaseAdmin.from('meta_social_comments').select('*').eq('tenant_id', tenant(req)).eq('provider', provider).order('created_at', { ascending: false }).limit(100);
  if (typeof req.query.status === 'string') query = query.eq('status', req.query.status);
  const { data, error } = await query;
  if (error) return res.status(400).json({ success: false, error: { message: error.message } });
  return res.json({ success: true, data });
});

router.post('/:provider/comments/:commentId/reply', requirePermission('inbox', 'write'), reply);
router.post('/:provider/comments/:commentId/moderate', requirePermission('inbox', 'write'), moderate);

router.get('/:provider/keyword-automations', async (req: Request, res: Response) => {
  const provider = req.params.provider;
  if (!providerOk(provider)) return res.status(400).json({ success: false, error: { message: 'Unsupported provider' } });
  const { data, error } = await supabaseAdmin.from('meta_keyword_automations').select('*').eq('tenant_id', tenant(req)).eq('provider', provider).order('created_at', { ascending: false });
  if (error) return res.status(400).json({ success: false, error: { message: error.message } });
  return res.json({ success: true, data });
});

router.post('/:provider/keyword-automations', requirePermission('automation', 'write'), async (req: Request, res: Response) => {
  const provider = req.params.provider;
  const { keyword, action_type = 'create_lead', action_payload = {}, enabled = true } = req.body || {};
  if (!providerOk(provider) || typeof keyword !== 'string' || !keyword.trim() || !['create_lead', 'record_event'].includes(action_type)) return res.status(400).json({ success: false, error: { message: 'Provider, keyword and supported action_type are required' } });
  const { data, error } = await supabaseAdmin.from('meta_keyword_automations').insert({ tenant_id: tenant(req), provider, keyword: keyword.trim(), action_type, action_payload, enabled: Boolean(enabled) }).select().single();
  if (error) return res.status(400).json({ success: false, error: { message: error.message } });
  return res.status(201).json({ success: true, data });
});

router.patch('/:provider/keyword-automations/:id', requirePermission('automation', 'write'), async (req: Request, res: Response) => {
  const provider = req.params.provider;
  const updates: any = {};
  if (typeof req.body?.keyword === 'string' && req.body.keyword.trim()) updates.keyword = req.body.keyword.trim();
  if (typeof req.body?.enabled === 'boolean') updates.enabled = req.body.enabled;
  if (req.body?.action_payload && typeof req.body.action_payload === 'object') updates.action_payload = req.body.action_payload;
  if (!Object.keys(updates).length) return res.status(400).json({ success: false, error: { message: 'No valid updates supplied' } });
  const { data, error } = await supabaseAdmin.from('meta_keyword_automations').update(updates).eq('id', req.params.id).eq('tenant_id', tenant(req)).eq('provider', provider).select().single();
  if (error || !data) return res.status(error ? 400 : 404).json({ success: false, error: { message: error?.message || 'Automation not found' } });
  return res.json({ success: true, data });
});

router.delete('/:provider/keyword-automations/:id', requirePermission('automation', 'write'), async (req: Request, res: Response) => {
  const { error } = await supabaseAdmin.from('meta_keyword_automations').delete().eq('id', req.params.id).eq('tenant_id', tenant(req)).eq('provider', req.params.provider);
  if (error) return res.status(400).json({ success: false, error: { message: error.message } });
  return res.status(204).send();
});

export default router;
