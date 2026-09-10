import { supabaseAdmin } from '../../../config/supabase';
import { IntegrationEngine } from '../../integrations/integrations.engine';
import { CRMEngine } from '../../crm/crm.engine';
import { InboxEngine } from '../../inbox/inbox.engine';

export class MetaSocialProviderError extends Error {
  constructor(public status: number, message: string) { super(`meta_social: ${message}`); }
}

export class MetaSocialProvider {
  private static version = () => process.env.META_GRAPH_API_VERSION || 'v21.0';
  private static async token(tenantId: string, provider: 'instagram' | 'facebook') {
    const { data, error } = await supabaseAdmin.from('integrations')
      .select('integration_credentials(access_token)').eq('tenant_id', tenantId)
      .eq('provider', provider).eq('status', 'active').maybeSingle();
    const token = (data as any)?.integration_credentials?.[0]?.access_token;
    if (error || !token) throw new MetaSocialProviderError(412, `${provider} is not connected`);
    return token;
  }
  static async request(tenantId: string, provider: 'instagram' | 'facebook', path: string, init: RequestInit = {}) {
    const token = await this.token(tenantId, provider);
    const url = new URL(`https://graph.facebook.com/${this.version()}/${path.replace(/^\//, '')}`);
    url.searchParams.set('access_token', token);
    const response = await fetch(url, init);
    const body = await response.json().catch(() => ({}));
    if (!response.ok || (body as any).error) throw new MetaSocialProviderError(response.status || 502, (body as any).error?.message || response.statusText);
    return body;
  }
  static profile(tenantId: string, provider: 'instagram' | 'facebook', id: string) {
    if (!/^[0-9_]+$/.test(id)) throw new MetaSocialProviderError(400, 'Invalid provider identity');
    return this.request(tenantId, provider, `${id}?fields=id,name,username,first_name,last_name`);
  }
  static replyToComment(tenantId: string, provider: 'instagram' | 'facebook', commentId: string, message: string) {
    if (!commentId || !message?.trim()) throw new MetaSocialProviderError(400, 'Comment id and message are required');
    // Instagram uses /replies while Facebook Page comments use /comments.
    const edge = provider === 'instagram' ? 'replies' : 'comments';
    return this.request(tenantId, provider, `${encodeURIComponent(commentId)}/${edge}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: message.trim() }) });
  }
  static moderateComment(tenantId: string, provider: 'instagram' | 'facebook', commentId: string, action: 'hide' | 'unhide' | 'delete') {
    if (action === 'delete') return this.request(tenantId, provider, encodeURIComponent(commentId), { method: 'DELETE' });
    return this.request(tenantId, provider, encodeURIComponent(commentId), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_hidden: action === 'hide' }) });
  }
  static async processComment(tenantId: string, provider: 'instagram' | 'facebook', comment: any) {
    const id = comment.id || comment.comment_id;
    const text = comment.message || comment.text || '';
    if (!id) throw new MetaSocialProviderError(422, 'Webhook comment has no id');
    await IntegrationEngine.handleWebhook({ provider, eventType: 'comment', externalId: id, payload: comment }, async () => {
      const from = comment.from || {};
      const contact = await CRMEngine.resolveIdentity({ tenantId, provider, providerId: from.id || `comment:${id}`, profileData: { firstName: from.name || `${provider} user` } });
      await supabaseAdmin.from('meta_social_comments').upsert({ tenant_id: tenantId, provider, external_id: id, parent_external_id: comment.media?.id || comment.post_id, contact_id: contact.id, text, status: 'received', payload: comment }, { onConflict: 'tenant_id,provider,external_id' });
      await this.runKeywordRules(tenantId, provider, text, contact.id, id);
    });
  }
  private static async runKeywordRules(tenantId: string, provider: string, text: string, contactId: string, commentId: string) {
    const { data: rules } = await supabaseAdmin.from('meta_keyword_automations').select('keyword,action_type,action_payload').eq('tenant_id', tenantId).eq('provider', provider).eq('enabled', true);
    for (const rule of rules || []) {
      if (!text.toLocaleLowerCase().includes(String(rule.keyword).toLocaleLowerCase())) continue;
      if (rule.action_type === 'create_lead') {
        // Contacts are the CRM lead record in this schema; keep this operation
        // tenant-scoped and idempotent for repeated provider deliveries.
        await supabaseAdmin.from('contacts').update({ lead_status: rule.action_payload?.lead_status || 'new', updated_at: new Date().toISOString() }).eq('id', contactId).eq('tenant_id', tenantId);
      }
      await supabaseAdmin.from('meta_automation_events').insert({ tenant_id: tenantId, provider, contact_id: contactId, external_id: commentId, keyword: rule.keyword, action_type: rule.action_type, payload: rule.action_payload });
    }
  }
  static async processMessage(tenantId: string, provider: 'instagram' | 'facebook', event: any) {
    const senderId = event.sender?.id; const msg = event.message; const externalId = msg?.mid;
    if (!senderId || !msg || !externalId) throw new MetaSocialProviderError(422, 'Webhook message is missing sender, message, or id');
    const profile = await this.profile(tenantId, provider, senderId).catch(() => ({}));
    await IntegrationEngine.handleWebhook({ provider, eventType: 'message', externalId, payload: event }, async () => {
      const contact = await CRMEngine.resolveIdentity({ tenantId, provider, providerId: senderId, profileData: { firstName: profile.name || profile.first_name || `${provider} user`, lastName: profile.last_name } });
      const content = msg.text || (msg.attachments?.length ? `[Received ${msg.attachments[0].type} attachment]` : '');
      await InboxEngine.handleIncomingMessage({ tenantId, contactId: contact.id, channel: provider === 'facebook' ? 'facebook' : 'instagram', channelIdentityId: contact.id, content, externalId, messageType: msg.text ? 'text' : 'attachment' });
    });
  }
}
