import { Request, Response } from 'express';
import { supabaseAdmin } from '../../config/supabase';
import { CampaignEngine } from './campaign.engine';

export type CampaignEventType = 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed' | 'unsubscribed';
export interface TrackingWebhookEvent {
  externalId: string;
  eventType: CampaignEventType;
  occurredAt?: string;
  payload?: Record<string, unknown>;
  provider?: string;
}

export const getCampaigns = async (req: Request, res: Response) => {
  try {
    const tenantId = (req.tenantId || req.headers['x-tenant-id']) as string;
    
    // Fetch campaigns along with a count of total jobs and sent jobs
    const { data, error } = await supabaseAdmin
      .from('campaigns')
      .select(`
        *,
        jobs:campaign_jobs(count)
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: { message: error.message } });
  }
};

export const launchCampaign = async (req: Request, res: Response) => {
  try {
    const tenantId = (req.tenantId || req.headers['x-tenant-id']) as string;
    const { name, channel, targetCriteria, messagePayload, scheduledFor, emailSubject, senderName, senderEmail, replyTo, provider, templateId, compliance } = req.body;

    const campaign = await CampaignEngine.launchCampaign({
      tenantId,
      name,
      channel,
      targetCriteria,
      messagePayload,
      emailSubject,
      senderName, senderEmail, replyTo, provider, templateId, compliance,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined
    });

    return res.status(201).json({ success: true, data: campaign });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: { message: error.message } });
  }
};

export const estimateAudience = async (req: Request, res: Response) => {
  try {
    const tenantId = (req.tenantId || req.headers['x-tenant-id']) as string;
    const { tags, source } = req.body;

    let query = supabaseAdmin
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    if (tags && tags.length > 0) {
      query = query.contains('tags', tags);
    }

    if (source) {
      query = query.eq('source', source);
    }

    const { count, error } = await query;
    if (error) throw error;

    return res.status(200).json({ success: true, count });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: { message: error.message } });
  }
};

export const getCampaignAnalytics = async (req: Request, res: Response) => {
  try {
    const tenantId = (req.tenantId || req.headers['x-tenant-id']) as string;
    const campaignId = req.params.id;
    const { data, error } = await supabaseAdmin.from('campaign_events')
      .select('event_type, occurred_at', { count: 'exact' })
      .eq('tenant_id', tenantId).eq('campaign_id', campaignId);
    if (error) throw error;
    const counts = (data || []).reduce((acc: Record<string, number>, event: any) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1; return acc;
    }, {});
    return res.json({ success: true, data: { counts, events: data || [] } });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: { message: error.message } });
  }
};

export const handleSmsWebhook = async (req: Request, res: Response) => {
  const { MessageSid, MessageStatus, OptOut } = req.body || {};
  if (!MessageSid) return res.status(400).json({ success: false, error: { message: 'MessageSid is required' } });
  const status = MessageStatus === 'delivered' ? 'delivered' : ['failed', 'undelivered'].includes(MessageStatus) ? 'failed' : 'sent';
  const { data: job } = await supabaseAdmin.from('campaign_jobs').select('id, tenant_id, campaign_id').eq('external_message_id', MessageSid).single();
  if (job) {
    await supabaseAdmin.from('campaign_jobs').update({ status, delivered_at: status === 'delivered' ? new Date().toISOString() : null }).eq('id', job.id);
    await supabaseAdmin.from('campaign_events').insert({ tenant_id: job.tenant_id, campaign_id: job.campaign_id, job_id: job.id, event_type: status, external_id: MessageSid, payload: req.body });
  }
  return res.json({ success: true });
};

/** Public, idempotent one-click unsubscribe endpoint used by campaign mail. */
export const unsubscribe = async (req: Request, res: Response) => {
  const { contactId, channel = 'email' } = req.query as { contactId?: string; channel?: string };
  if (!contactId || !['email', 'sms'].includes(channel)) return res.status(400).send('Invalid unsubscribe request');
  const field = channel === 'sms' ? 'sms_opt_out' : 'email_opt_out';
  const consentField = channel === 'sms' ? 'sms_consent_at' : 'email_consent_at';
  const { error } = await supabaseAdmin.from('contacts').update({ [field]: true, [consentField]: null }).eq('id', contactId);
  if (error) return res.status(400).send('Unable to update subscription');
  return res.status(200).send('You have been unsubscribed.');
};

export const campaignLifecycle = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const data = await CampaignEngine.lifecycle(tenantId, req.params.id, req.body.action);
    return res.json({ success: true, data });
  } catch (error: any) { return res.status(400).json({ success: false, error: { message: error.message } }); }
};

export const providerTrackingWebhook = async (req: Request, res: Response) => {
  const { externalId, eventType, payload = {}, occurredAt, provider } = req.body as TrackingWebhookEvent || {};
  if (!externalId || !['delivered', 'opened', 'clicked', 'bounced', 'failed', 'unsubscribed'].includes(eventType)) return res.status(400).json({ success: false, error: { message: 'externalId and valid eventType are required' } });
  const { data: job } = await supabaseAdmin.from('campaign_jobs').select('id, tenant_id, campaign_id').eq('external_message_id', externalId).single();
  if (!job) return res.status(404).json({ success: false, error: { message: 'Unknown provider message' } });
  const fields: any = { delivered: 'delivered_at', opened: 'opened_at', clicked: 'clicked_at' };
  await supabaseAdmin.from('campaign_jobs').update({ ...(fields[eventType] ? { [fields[eventType]]: new Date().toISOString() } : {}), ...(eventType === 'bounced' ? { status: 'failed', error_message: 'Provider bounce' } : {}) }).eq('id', job.id);
  const { error } = await supabaseAdmin.from('campaign_events').insert({
    tenant_id: job.tenant_id, campaign_id: job.campaign_id, job_id: job.id, event_type: eventType,
    external_id: externalId, payload: { ...payload, provider }, occurred_at: occurredAt || new Date().toISOString()
  });
  if (error && error.code !== '23505') return res.status(400).json({ success: false, error: { message: error.message } });
  return res.json({ success: true });
};
