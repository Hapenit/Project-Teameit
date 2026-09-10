"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignEngine = exports.renderTemplate = void 0;
const supabase_1 = require("../../config/supabase");
const nodemailer_1 = __importDefault(require("nodemailer"));
const twilio_provider_1 = require("../providers/twilio/twilio.provider");
const whatsapp_provider_1 = require("../providers/whatsapp/whatsapp.provider");
const sms_compliance_1 = require("./sms-compliance");
const renderTemplate = (value, contact) => (value || '').replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_m, key) => {
    const result = key.split('.').reduce((v, k) => v?.[k], contact);
    return result == null ? '' : String(result);
});
exports.renderTemplate = renderTemplate;
class CampaignEngine {
    static async lifecycle(tenantId, id, action) {
        const { data: source, error } = await supabase_1.supabaseAdmin.from('campaigns').select('*').eq('id', id).eq('tenant_id', tenantId).single();
        if (error || !source)
            throw new Error('Campaign not found');
        if (action === 'clone') {
            const { id: _id, created_at: _created, updated_at: _updated, status: _status, paused_at: _paused, cancelled_at: _cancelled, ...cloneValues } = source;
            const { data, error: cloneError } = await supabase_1.supabaseAdmin.from('campaigns').insert({
                ...cloneValues, status: 'draft', cloned_from: id, paused_at: null, cancelled_at: null
            }).select().single();
            if (cloneError || !data)
                throw new Error(`Campaign clone failed: ${cloneError?.message || 'unknown error'}`);
            return data;
        }
        const transitions = { pause: 'paused', resume: 'running', cancel: 'cancelled' };
        if (action === 'resume' && !['paused', 'scheduled'].includes(source.status))
            throw new Error(`Cannot resume campaign in ${source.status} state`);
        if (action === 'pause' && !['running', 'scheduled'].includes(source.status))
            throw new Error(`Cannot pause campaign in ${source.status} state`);
        if (action === 'cancel' && ['completed', 'cancelled'].includes(source.status))
            throw new Error(`Cannot cancel campaign in ${source.status} state`);
        const patch = { status: transitions[action] };
        if (action === 'pause')
            patch.paused_at = new Date().toISOString();
        if (action === 'cancel')
            patch.cancelled_at = new Date().toISOString();
        if (action === 'resume')
            patch.paused_at = null;
        const { data, error: updateError } = await supabase_1.supabaseAdmin.from('campaigns').update(patch).eq('id', id).eq('tenant_id', tenantId).select().single();
        if (updateError || !data)
            throw new Error(`Campaign update failed: ${updateError?.message || 'unknown error'}`);
        if (action === 'cancel') {
            await supabase_1.supabaseAdmin.from('campaign_jobs').update({ status: 'cancelled' })
                .eq('tenant_id', tenantId).eq('campaign_id', id).eq('status', 'pending');
        }
        if (action === 'resume')
            this.processQueue(tenantId, id).catch(() => undefined);
        return data;
    }
    static async launchCampaign(params) {
        if (!params.name?.trim() || !['email', 'sms', 'whatsapp'].includes(params.channel))
            throw new Error('Campaign name and a supported channel are required');
        if (params.channel === 'email' && !params.emailSubject?.trim())
            throw new Error('Email subject is required');
        const contentText = params.messagePayload?.text || params.messagePayload?.contentText || '';
        const contentHtml = params.messagePayload?.html || params.messagePayload?.contentHtml || undefined;
        if (!contentText && !contentHtml && !params.messagePayload?.template)
            throw new Error('Campaign content is required');
        const scheduled = params.scheduledFor && params.scheduledFor.getTime() > Date.now();
        const { data: campaign, error } = await supabase_1.supabaseAdmin.from('campaigns').insert({
            tenant_id: params.tenantId, name: params.name.trim(), channel: params.channel,
            target_criteria: params.targetCriteria || {}, message_payload: params.messagePayload,
            email_subject: params.emailSubject || null, content_html: contentHtml, content_text: contentText,
            sender_name: params.senderName || null, sender_email: params.senderEmail || null, reply_to: params.replyTo || null,
            provider: params.provider || null, template_id: params.templateId || null,
            compliance: params.compliance || {},
            status: scheduled ? 'scheduled' : 'running', scheduled_for: params.scheduledFor?.toISOString() || null
        }).select().single();
        if (error || !campaign)
            throw new Error(`Failed to create campaign: ${error?.message || 'unknown error'}`);
        let query = supabase_1.supabaseAdmin.from('contacts').select('id').eq('tenant_id', params.tenantId);
        if (params.targetCriteria?.tags?.length)
            query = query.contains('tags', params.targetCriteria.tags);
        if (params.targetCriteria?.source)
            query = query.eq('source', params.targetCriteria.source);
        const { data: contacts, error: audienceError } = await query;
        if (audienceError)
            throw new Error(`Failed to fetch audience: ${audienceError.message}`);
        if (contacts?.length) {
            const { error: jobsError } = await supabase_1.supabaseAdmin.from('campaign_jobs').insert(contacts.map(c => ({
                tenant_id: params.tenantId, campaign_id: campaign.id, contact_id: c.id, status: 'pending',
                dedupe_key: `${campaign.id}:${c.id}`, next_attempt_at: new Date().toISOString()
            })));
            if (jobsError)
                throw new Error(`Failed to queue jobs: ${jobsError.message}`);
        }
        if (!scheduled)
            this.processQueue(params.tenantId, campaign.id).catch(() => undefined);
        return campaign;
    }
    static async processQueue(tenantId, campaignId) {
        const { data: campaign, error: campaignError } = await supabase_1.supabaseAdmin.from('campaigns').select('*').eq('id', campaignId).eq('tenant_id', tenantId).single();
        if (campaignError || !campaign)
            throw new Error(`Campaign unavailable: ${campaignError?.message || 'not found'}`);
        if (!['running'].includes(campaign.status))
            return campaign;
        const { data: jobs, error } = await supabase_1.supabaseAdmin.from('campaign_jobs').select('id, contact_id, attempts').eq('campaign_id', campaignId).eq('status', 'pending').or(`next_attempt_at.is.null,next_attempt_at.lte.${new Date().toISOString()}`);
        if (error)
            throw new Error(`Queue read failed: ${error.message}`);
        if (!jobs?.length) {
            await supabase_1.supabaseAdmin.from('campaigns').update({ status: 'completed' }).eq('id', campaignId).eq('tenant_id', tenantId);
            return;
        }
        let transporter;
        let smsConfig;
        let senderAddress = campaign.sender_email;
        if (campaign.channel === 'email') {
            const { data: integration } = await supabase_1.supabaseAdmin.from('integrations').select('credentials').eq('tenant_id', tenantId).eq('provider', 'email').eq('status', 'active').single();
            const credentials = integration?.credentials;
            if (!credentials?.host || !credentials?.user || !credentials?.password)
                throw new Error('Email provider is not configured or verified');
            senderAddress = senderAddress || credentials.user;
            transporter = nodemailer_1.default.createTransport({ host: credentials.host, port: Number(credentials.port || 587), secure: credentials.secure === true || credentials.secure === 'true', auth: { user: credentials.user, pass: credentials.password } });
            await transporter.verify();
        }
        else if (campaign.channel === 'sms') {
            const { data: integration } = await supabase_1.supabaseAdmin.from('integrations').select('credentials').eq('tenant_id', tenantId).eq('provider', campaign.provider || 'twilio').eq('status', 'active').single();
            smsConfig = integration?.credentials || {};
            const compliance = (campaign.compliance || {});
            const validation = new sms_compliance_1.DefaultSmsCompliance().validate(compliance, campaign.content_text || campaign.message_payload?.text || '');
            if (!validation.valid)
                throw new Error(validation.errors.join('; '));
            if ((!smsConfig.accountSid && !process.env.TWILIO_ACCOUNT_SID) || (!smsConfig.authToken && !process.env.TWILIO_AUTH_TOKEN) || (!smsConfig.from && !process.env.TWILIO_FROM_NUMBER && !process.env.TWILIO_PHONE_NUMBER))
                throw new Error('SMS provider is not configured');
        }
        for (const job of jobs) {
            try {
                const { data: current } = await supabase_1.supabaseAdmin.from('campaigns').select('status').eq('id', campaignId).single();
                if (current?.status !== 'running')
                    break;
                const { data: contact } = await supabase_1.supabaseAdmin.from('contacts').select('*').eq('id', job.contact_id).eq('tenant_id', tenantId).single();
                const optedOut = !contact || (campaign.channel === 'email' ? !contact.email || contact.email_opt_out : campaign.channel === 'sms' ? !contact.phone || contact.sms_opt_out : !contact.phone);
                if (optedOut) {
                    await this.updateJob(job.id, { status: 'skipped', error_message: 'Missing destination or recipient opted out', opted_out_at: new Date().toISOString() });
                    continue;
                }
                let externalId;
                if (campaign.channel === 'email') {
                    const text = (0, exports.renderTemplate)(campaign.content_text || campaign.message_payload?.text, contact);
                    const html = (0, exports.renderTemplate)(campaign.content_html || campaign.message_payload?.html || text, contact);
                    const unsubscribe = `${process.env.CAMPAIGN_PUBLIC_URL || process.env.API_BASE_URL || ''}/api/v1/campaigns/unsubscribe?contactId=${encodeURIComponent(contact.id)}&channel=email`;
                    const info = await transporter.sendMail({ from: campaign.sender_name ? `"${campaign.sender_name}" <${senderAddress}>` : senderAddress, replyTo: campaign.reply_to || undefined, to: contact.email, subject: (0, exports.renderTemplate)(campaign.email_subject, contact), text, html, headers: { 'List-Unsubscribe': `<${unsubscribe}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } });
                    externalId = info.messageId;
                }
                else if (campaign.channel === 'sms') {
                    const result = await twilio_provider_1.TwilioProvider.sendSms(contact.phone, (0, exports.renderTemplate)(campaign.content_text || campaign.message_payload?.text, contact), { ...smsConfig, statusCallback: `${process.env.API_BASE_URL || ''}/api/v1/campaigns/webhooks/sms` });
                    externalId = result.id;
                }
                else {
                    const { data: identity } = await supabase_1.supabaseAdmin.from('contact_identities').select('provider_id').eq('tenant_id', tenantId).eq('contact_id', job.contact_id).eq('provider', 'whatsapp').maybeSingle();
                    if (!identity?.provider_id)
                        throw new Error('Contact has no WhatsApp identity');
                    const p = campaign.message_payload;
                    const message = p.template ? { type: 'template', template: p.template } : { type: 'text', text: { body: (0, exports.renderTemplate)(p.text || p.body, contact) } };
                    externalId = (await whatsapp_provider_1.WhatsAppProvider.sendMessage(tenantId, identity.provider_id, message)).externalId;
                    await new Promise(resolve => setTimeout(resolve, Number(process.env.WHATSAPP_CAMPAIGN_INTERVAL_MS || 100)));
                }
                await this.updateJob(job.id, { status: 'sent', external_message_id: externalId, processed_at: new Date().toISOString(), attempts: (job.attempts || 0) + 1 });
                await supabase_1.supabaseAdmin.from('campaign_events').insert({ tenant_id: tenantId, campaign_id: campaignId, job_id: job.id, event_type: 'sent', external_id: externalId });
            }
            catch (e) {
                const attempts = (job.attempts || 0) + 1;
                const message = e instanceof Error ? e.message : String(e);
                await this.updateJob(job.id, { status: attempts >= 3 ? 'failed' : 'pending', attempts, error_message: message, next_attempt_at: new Date(Date.now() + Math.min(3600000, 2 ** attempts * 60000)).toISOString() });
            }
        }
    }
    static updateJob(id, values) { return supabase_1.supabaseAdmin.from('campaign_jobs').update(values).eq('id', id); }
}
exports.CampaignEngine = CampaignEngine;
