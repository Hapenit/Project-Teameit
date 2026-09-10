"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.providerTrackingWebhook = exports.campaignLifecycle = exports.unsubscribe = exports.handleSmsWebhook = exports.getCampaignAnalytics = exports.estimateAudience = exports.launchCampaign = exports.getCampaigns = void 0;
const supabase_1 = require("../../config/supabase");
const campaign_engine_1 = require("./campaign.engine");
const getCampaigns = async (req, res) => {
    try {
        const tenantId = (req.tenantId || req.headers['x-tenant-id']);
        // Fetch campaigns along with a count of total jobs and sent jobs
        const { data, error } = await supabase_1.supabaseAdmin
            .from('campaigns')
            .select(`
        *,
        jobs:campaign_jobs(count)
      `)
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        return res.status(200).json({ success: true, data });
    }
    catch (error) {
        return res.status(400).json({ success: false, error: { message: error.message } });
    }
};
exports.getCampaigns = getCampaigns;
const launchCampaign = async (req, res) => {
    try {
        const tenantId = (req.tenantId || req.headers['x-tenant-id']);
        const { name, channel, targetCriteria, messagePayload, scheduledFor, emailSubject, senderName, senderEmail, replyTo, provider, templateId, compliance } = req.body;
        const campaign = await campaign_engine_1.CampaignEngine.launchCampaign({
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
    }
    catch (error) {
        return res.status(400).json({ success: false, error: { message: error.message } });
    }
};
exports.launchCampaign = launchCampaign;
const estimateAudience = async (req, res) => {
    try {
        const tenantId = (req.tenantId || req.headers['x-tenant-id']);
        const { tags, source } = req.body;
        let query = supabase_1.supabaseAdmin
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
        if (error)
            throw error;
        return res.status(200).json({ success: true, count });
    }
    catch (error) {
        return res.status(400).json({ success: false, error: { message: error.message } });
    }
};
exports.estimateAudience = estimateAudience;
const getCampaignAnalytics = async (req, res) => {
    try {
        const tenantId = (req.tenantId || req.headers['x-tenant-id']);
        const campaignId = req.params.id;
        const { data, error } = await supabase_1.supabaseAdmin.from('campaign_events')
            .select('event_type, occurred_at', { count: 'exact' })
            .eq('tenant_id', tenantId).eq('campaign_id', campaignId);
        if (error)
            throw error;
        const counts = (data || []).reduce((acc, event) => {
            acc[event.event_type] = (acc[event.event_type] || 0) + 1;
            return acc;
        }, {});
        return res.json({ success: true, data: { counts, events: data || [] } });
    }
    catch (error) {
        return res.status(400).json({ success: false, error: { message: error.message } });
    }
};
exports.getCampaignAnalytics = getCampaignAnalytics;
const handleSmsWebhook = async (req, res) => {
    const { MessageSid, MessageStatus, OptOut } = req.body || {};
    if (!MessageSid)
        return res.status(400).json({ success: false, error: { message: 'MessageSid is required' } });
    const status = MessageStatus === 'delivered' ? 'delivered' : ['failed', 'undelivered'].includes(MessageStatus) ? 'failed' : 'sent';
    const { data: job } = await supabase_1.supabaseAdmin.from('campaign_jobs').select('id, tenant_id, campaign_id').eq('external_message_id', MessageSid).single();
    if (job) {
        await supabase_1.supabaseAdmin.from('campaign_jobs').update({ status, delivered_at: status === 'delivered' ? new Date().toISOString() : null }).eq('id', job.id);
        await supabase_1.supabaseAdmin.from('campaign_events').insert({ tenant_id: job.tenant_id, campaign_id: job.campaign_id, job_id: job.id, event_type: status, external_id: MessageSid, payload: req.body });
    }
    return res.json({ success: true });
};
exports.handleSmsWebhook = handleSmsWebhook;
/** Public, idempotent one-click unsubscribe endpoint used by campaign mail. */
const unsubscribe = async (req, res) => {
    const { contactId, channel = 'email' } = req.query;
    if (!contactId || !['email', 'sms'].includes(channel))
        return res.status(400).send('Invalid unsubscribe request');
    const field = channel === 'sms' ? 'sms_opt_out' : 'email_opt_out';
    const consentField = channel === 'sms' ? 'sms_consent_at' : 'email_consent_at';
    const { error } = await supabase_1.supabaseAdmin.from('contacts').update({ [field]: true, [consentField]: null }).eq('id', contactId);
    if (error)
        return res.status(400).send('Unable to update subscription');
    return res.status(200).send('You have been unsubscribed.');
};
exports.unsubscribe = unsubscribe;
const campaignLifecycle = async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        const data = await campaign_engine_1.CampaignEngine.lifecycle(tenantId, req.params.id, req.body.action);
        return res.json({ success: true, data });
    }
    catch (error) {
        return res.status(400).json({ success: false, error: { message: error.message } });
    }
};
exports.campaignLifecycle = campaignLifecycle;
const providerTrackingWebhook = async (req, res) => {
    const { externalId, eventType, payload = {}, occurredAt, provider } = req.body || {};
    if (!externalId || !['delivered', 'opened', 'clicked', 'bounced', 'failed', 'unsubscribed'].includes(eventType))
        return res.status(400).json({ success: false, error: { message: 'externalId and valid eventType are required' } });
    const { data: job } = await supabase_1.supabaseAdmin.from('campaign_jobs').select('id, tenant_id, campaign_id').eq('external_message_id', externalId).single();
    if (!job)
        return res.status(404).json({ success: false, error: { message: 'Unknown provider message' } });
    const fields = { delivered: 'delivered_at', opened: 'opened_at', clicked: 'clicked_at' };
    await supabase_1.supabaseAdmin.from('campaign_jobs').update({ ...(fields[eventType] ? { [fields[eventType]]: new Date().toISOString() } : {}), ...(eventType === 'bounced' ? { status: 'failed', error_message: 'Provider bounce' } : {}) }).eq('id', job.id);
    const { error } = await supabase_1.supabaseAdmin.from('campaign_events').insert({
        tenant_id: job.tenant_id, campaign_id: job.campaign_id, job_id: job.id, event_type: eventType,
        external_id: externalId, payload: { ...payload, provider }, occurred_at: occurredAt || new Date().toISOString()
    });
    if (error && error.code !== '23505')
        return res.status(400).json({ success: false, error: { message: error.message } });
    return res.json({ success: true });
};
exports.providerTrackingWebhook = providerTrackingWebhook;
