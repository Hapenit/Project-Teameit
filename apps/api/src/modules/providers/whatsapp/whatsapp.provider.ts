import { IntegrationEngine } from '../../integrations/integrations.engine';
import { CRMEngine } from '../../crm/crm.engine';
import { InboxEngine } from '../../inbox/inbox.engine';
import { supabaseAdmin } from '../../../config/supabase';

export class WhatsAppProviderError extends Error {
  constructor(message: string, public readonly code = 'WHATSAPP_PROVIDER_ERROR', public readonly retryable = false) {
    super(message);
    this.name = 'WhatsAppProviderError';
  }
}

export type WhatsAppMessage =
  | { type: 'text'; text: { body: string; preview_url?: boolean } }
  | { type: 'image' | 'video' | 'audio' | 'document'; [key: string]: any }
  | { type: 'template'; template: { name: string; language: { code: string }; components?: any[] } }
  | { type: 'interactive'; interactive: any }
  | { type: 'location'; location: any };

export class WhatsAppProvider {
  private static version = process.env.META_GRAPH_API_VERSION || 'v21.0';
  private static validateTemplate(template: any, partial = false) {
    if (!template || typeof template !== 'object') throw new WhatsAppProviderError('Template payload is required', 'INVALID_TEMPLATE');
    if (!partial && (!template.name || !template.language || !template.category)) {
      throw new WhatsAppProviderError('Template name, language and category are required', 'INVALID_TEMPLATE');
    }
    if (template.components && !Array.isArray(template.components)) {
      throw new WhatsAppProviderError('Template components must be an array', 'INVALID_TEMPLATE');
    }
  }
  static async credentials(tenantId: string) {
    const { data, error } = await supabaseAdmin.from('integrations')
      .select('id,status,integration_credentials(access_token,external_account_id,metadata)')
      .eq('tenant_id', tenantId).eq('provider', 'whatsapp').maybeSingle();
    if (error || !data) throw new WhatsAppProviderError('WhatsApp Business is not connected', 'NOT_CONNECTED');
    const c: any = data.integration_credentials?.[0];
    if (data.status !== 'active' || !c?.access_token) throw new WhatsAppProviderError('WhatsApp connection is not active', 'NOT_ACTIVE');
    const metadata = c.metadata || {};
    const phoneNumberId = metadata.phone_number_id || metadata.phoneNumberId || metadata.whatsappPhoneNumberId;
    const wabaId = metadata.waba_id || metadata.wabaId || metadata.whatsappBusinessAccountId || c.external_account_id;
    if (!phoneNumberId || !wabaId) throw new WhatsAppProviderError('WhatsApp phone number and WABA are not configured', 'INCOMPLETE_CONFIG');
    return { integrationId: data.id, token: c.access_token, phoneNumberId, wabaId, metadata };
  }

  static async request(tenantId: string, path: string, init: RequestInit = {}) {
    const c = await this.credentials(tenantId);
    const response = await fetch(`https://graph.facebook.com/${this.version}/${path}`, {
      ...init, headers: { Authorization: 'Bearer ' + c.token, 'Content-Type': 'application/json', ...(init.headers || {}) }
    });
    const body: any = await response.json().catch(() => ({}));
    if (!response.ok || body.error) {
      const status = body.error?.code || response.status;
      throw new WhatsAppProviderError(body.error?.message || `Meta WhatsApp API request failed (${response.status})`,
        String(status), response.status === 429 || response.status >= 500);
    }
    return body;
  }

  static async sendMessage(tenantId: string, to: string, message: WhatsAppMessage, context?: { campaignJobId?: string; conversationId?: string }) {
    if (!to) throw new WhatsAppProviderError('Recipient WhatsApp number is required', 'INVALID_RECIPIENT');
    if (!['text', 'image', 'video', 'audio', 'document', 'template', 'interactive', 'location'].includes(message.type)) {
      throw new WhatsAppProviderError(`Unsupported WhatsApp message type: ${(message as any).type}`, 'UNSUPPORTED_MESSAGE_TYPE');
    }
    if (message.type === 'text' && !message.text?.body?.trim()) throw new WhatsAppProviderError('Text body is required', 'INVALID_MESSAGE');
    if (message.type === 'template' && (!message.template?.name || !message.template?.language?.code)) throw new WhatsAppProviderError('Template name and language are required', 'INVALID_MESSAGE');
    if (message.type === 'interactive' && !message.interactive?.type) throw new WhatsAppProviderError('Interactive type is required', 'INVALID_MESSAGE');
    const c = await this.credentials(tenantId);
    const result = await this.request(tenantId, `${c.phoneNumberId}/messages`, {
      method: 'POST', body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to, ...message })
    });
    const externalId = result.messages?.[0]?.id;
    if (!externalId) throw new WhatsAppProviderError('Meta returned no WhatsApp message id', 'INVALID_PROVIDER_RESPONSE');
    return { externalId, providerResponse: result, ...context };
  }

  static async getStatus(tenantId: string) {
    const c = await this.credentials(tenantId);
    const phone: any = await this.request(tenantId, `${c.phoneNumberId}?fields=id,display_phone_number,verified_name,quality_rating,status`);
    const waba: any = await this.request(tenantId, `${c.wabaId}?fields=id,name,account_review_status`);
    await supabaseAdmin.from('integration_credentials').update({
      provider_account_status: phone.status || waba.account_review_status || 'unknown',
      last_verified_at: new Date().toISOString(),
      metadata: { ...c.metadata, phone_status: phone.status, quality_rating: phone.quality_rating, account_review_status: waba.account_review_status }
    }).eq('integration_id', c.integrationId);
    return { phone, waba };
  }

  static async listTemplates(tenantId: string) {
    const c = await this.credentials(tenantId);
    const result: any = await this.request(tenantId, `${c.wabaId}/message_templates?limit=100`);
    const templates = result.data || [];
    const { error } = await supabaseAdmin.from('whatsapp_templates').upsert(templates.map((t: any) => ({
      tenant_id: tenantId, waba_id: c.wabaId, template_id: t.id, name: t.name,
      language: t.language, category: t.category, status: t.status,
      components: t.components || [], rejected_reason: t.rejected_reason || null, synced_at: new Date().toISOString()
    })), { onConflict: 'tenant_id,waba_id,name,language' });
    if (error) throw new WhatsAppProviderError(`Template sync failed: ${error.message}`, 'TEMPLATE_STORAGE_FAILED');
    return templates;
  }

  static async createTemplate(tenantId: string, template: any) {
    this.validateTemplate(template);
    const c = await this.credentials(tenantId);
    return this.request(tenantId, `${c.wabaId}/message_templates`, { method: 'POST', body: JSON.stringify(template) });
  }
  static async updateTemplate(tenantId: string, id: string, template: any) {
    this.validateTemplate(template, true);
    return this.request(tenantId, id, { method: 'POST', body: JSON.stringify(template) });
  }
  static async deleteTemplate(tenantId: string, name: string, language?: string) {
    const c = await this.credentials(tenantId);
    const query = language ? `?name=${encodeURIComponent(name)}&language=${encodeURIComponent(language)}` : `?name=${encodeURIComponent(name)}`;
    return this.request(tenantId, `${c.wabaId}/message_templates${query}`, { method: 'DELETE' });
  }
  static async templateStatus(tenantId: string, name: string, language?: string) {
    const templates = await this.listTemplates(tenantId);
    return templates.filter((t: any) => t.name === name && (!language || t.language === language));
  }
  static extractVariables(template: any): string[] {
    const text = JSON.stringify(template?.components || template || '');
    return [...new Set([...text.matchAll(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g)].map(m => m[1]))];
  }
  static async listCatalogProducts(tenantId: string, catalogId?: string) {
    const c = await this.credentials(tenantId);
    const id = catalogId || c.metadata.catalog_id || c.metadata.catalogId;
    if (!id) throw new WhatsAppProviderError('WhatsApp catalog is not configured', 'CATALOG_NOT_CONFIGURED');
    const result: any = await this.request(tenantId, `${id}/products?fields=id,name,description,price,currency,image_url,availability,retailer_id&limit=100`);
    return result.data || [];
  }
  static async syncCatalog(tenantId: string, catalogId?: string) {
    const products = await this.listCatalogProducts(tenantId, catalogId);
    const c = await this.credentials(tenantId);
    const id = catalogId || c.metadata.catalog_id || c.metadata.catalogId;
    const { error } = await supabaseAdmin.from('whatsapp_catalog_products').upsert(products.map((p: any) => ({
      tenant_id: tenantId, catalog_id: id, product_id: p.id, name: p.name, description: p.description,
      price: p.price, currency: p.currency, image_url: p.image_url, availability: p.availability,
      retailer_id: p.retailer_id, raw: p, synced_at: new Date().toISOString(), updated_at: new Date().toISOString()
    })), { onConflict: 'tenant_id,catalog_id,product_id' });
    if (error) throw new WhatsAppProviderError(`Catalog sync failed: ${error.message}`, 'CATALOG_STORAGE_FAILED');
    return products;
  }
  static async shareProduct(tenantId: string, to: string, productId: string, catalogId?: string, body?: string) {
    const c = await this.credentials(tenantId);
    const id = catalogId || c.metadata.catalog_id || c.metadata.catalogId;
    if (!id) throw new WhatsAppProviderError('WhatsApp catalog is not configured', 'CATALOG_NOT_CONFIGURED');
    return this.sendMessage(tenantId, to, { type: 'interactive', interactive: {
      type: 'product', body: body ? { text: body } : undefined, action: { catalog_id: id, product_retailer_id: productId }
    } } as any);
  }
  static async createCatalogProduct(tenantId: string, product: any, catalogId?: string) {
    const c = await this.credentials(tenantId); const id = catalogId || c.metadata.catalog_id || c.metadata.catalogId;
    if (!id || !product?.name || !product?.retailer_id) throw new WhatsAppProviderError('Catalog, name and retailer_id are required', 'INVALID_PRODUCT');
    return this.request(tenantId, id + '/products', { method: 'POST', body: JSON.stringify(product) });
  }
  static async updateCatalogProduct(tenantId: string, productId: string, product: any, catalogId?: string) {
    const c = await this.credentials(tenantId); const id = catalogId || c.metadata.catalog_id || c.metadata.catalogId;
    if (!id || !productId) throw new WhatsAppProviderError('Catalog and product id are required', 'INVALID_PRODUCT');
    return this.request(tenantId, productId, { method: 'POST', body: JSON.stringify(product) });
  }
  static async deleteCatalogProduct(tenantId: string, productId: string, catalogId?: string) {
    const c = await this.credentials(tenantId); const id = catalogId || c.metadata.catalog_id || c.metadata.catalogId;
    if (!id || !productId) throw new WhatsAppProviderError('Catalog and product id are required', 'INVALID_PRODUCT');
    return this.request(tenantId, productId, { method: 'DELETE' });
  }

  static async processWebhook(tenantId: string, payload: any) {
    if (payload.object !== 'whatsapp_business_account') return;
    for (const entry of payload.entry || []) for (const change of entry.changes || []) {
      const value = change.value || {};
      for (const status of value.statuses || []) await this.processStatus(tenantId, status);
      if (value.messages?.length) await this.processMessages(tenantId, value);
    }
  }

  private static async processStatus(tenantId: string, status: any) {
    const eventId = `status:${status.id}:${status.status}`;
    await IntegrationEngine.handleWebhook({ tenantId, provider: 'whatsapp', eventType: 'message_status', externalId: eventId, payload: status }, async () => {
      const mapped = ['sent', 'delivered', 'read', 'failed'].includes(status.status) ? status.status : 'failed';
      await supabaseAdmin.from('messages').update({ status: mapped })
        .eq('tenant_id', tenantId).eq('external_id', status.id);
      await supabaseAdmin.from('campaign_jobs').update({ status: mapped, error_message: status.errors?.[0]?.title || null })
        .eq('tenant_id', tenantId).eq('external_message_id', status.id);
      await supabaseAdmin.from('whatsapp_delivery_events').upsert({
        tenant_id: tenantId, external_message_id: status.id, status: status.status,
        recipient_id: status.recipient_id, errors: status.errors || null, occurred_at: status.timestamp ? new Date(Number(status.timestamp) * 1000).toISOString() : new Date().toISOString()
      }, { onConflict: 'tenant_id,external_message_id,status' });
    });
  }

  private static async processMessages(tenantId: string, value: any) {
    for (const msg of value.messages || []) {
      const contactInfo = (value.contacts || []).find((c: any) => c.wa_id === msg.from);
      await IntegrationEngine.handleWebhook({ tenantId, provider: 'whatsapp', eventType: 'message', externalId: msg.id, payload: msg }, async () => {
        const contact = await CRMEngine.resolveIdentity({ tenantId, provider: 'whatsapp', providerId: msg.from, profileData: { firstName: contactInfo?.profile?.name || 'Unknown', phone: msg.from } });
        const content = msg.type === 'text' ? msg.text?.body || '' : msg[msg.type]?.caption || `[Received a ${msg.type} message]`;
        await InboxEngine.handleIncomingMessage({ tenantId, contactId: contact.id, channel: 'whatsapp', channelIdentityId: contact.id, content, externalId: msg.id, messageType: msg.type });
      });
    }
  }
}
