import { Request, Response } from 'express';
import { supabaseAdmin } from '../../../config/supabase';
import { MetaSocialProvider, MetaSocialProviderError } from './meta-social.provider';
const run = async (fn: () => Promise<any>): Promise<any> => { try { return { success: true, data: await fn() }; } catch (error) { return { error }; } };
export async function reply(req: Request, res: Response) {
  const provider = req.params.provider as 'instagram' | 'facebook';
  if (!['instagram', 'facebook'].includes(provider)) return res.status(400).json({ success: false, error: { message: 'Unsupported provider' } });
  const tenantId = req.tenantId || req.headers['x-tenant-id'];
  if (!tenantId) return res.status(400).json({ success: false, error: { message: 'Tenant context is required' } });
  const result = await run(() => MetaSocialProvider.replyToComment(tenantId as string, provider, req.params.commentId, req.body?.message));
  if (result.error) { const e = result.error; return res.status(e instanceof MetaSocialProviderError ? e.status : 502).json({ success: false, error: { message: e.message } }); }
  return res.status(201).json(result);
}
export async function moderate(req: Request, res: Response) {
  const provider = req.params.provider as 'instagram' | 'facebook';
  const action = req.body?.action;
  if (!['instagram', 'facebook'].includes(provider) || !['hide', 'unhide', 'delete'].includes(action)) return res.status(400).json({ success: false, error: { message: 'Provider and moderation action are invalid' } });
  const tenantId = req.tenantId || req.headers['x-tenant-id'];
  if (!tenantId) return res.status(400).json({ success: false, error: { message: 'Tenant context is required' } });
  const result = await run(() => MetaSocialProvider.moderateComment(tenantId as string, provider, req.params.commentId, action));
  if (result.error) { const e = result.error; return res.status(e instanceof MetaSocialProviderError ? e.status : 502).json({ success: false, error: { message: e.message } }); }
  await supabaseAdmin.from('meta_social_comments').update({ status: action === 'delete' ? 'deleted' : action === 'hide' ? 'hidden' : 'received', updated_at: new Date().toISOString() })
    .eq('tenant_id', tenantId).eq('provider', provider).eq('external_id', req.params.commentId);
  return res.json(result);
}
