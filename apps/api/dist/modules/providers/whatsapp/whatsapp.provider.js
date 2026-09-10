"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppProvider = exports.WhatsAppProviderError = void 0;
const integrations_engine_1 = require("../../integrations/integrations.engine");
const crm_engine_1 = require("../../crm/crm.engine");
const inbox_engine_1 = require("../../inbox/inbox.engine");
const supabase_1 = require("../../../config/supabase");
class WhatsAppProviderError extends Error {
    code;
    retryable;
    constructor(message, code = 'WHATSAPP_PROVIDER_ERROR', retryable = false) {
        super(message);
        this.code = code;
        this.retryable = retryable;
        this.name = 'WhatsAppProviderError';
    }
}
exports.WhatsAppProviderError = WhatsAppProviderError;
class WhatsAppProvider {
    static version = process.env.META_GRAPH_API_VERSION || 'v21.0';
    static validateTemplate(template, partial = false) {
        if (!template || typeof template !== 'object')
            throw new WhatsAppProviderError('Template payload is required', 'INVALID_TEMPLATE');
        if (!partial && (!template.name || !template.language || !template.category)) {
            throw new WhatsAppProviderError('Template name, language and category are required', 'INVALID_TEMPLATE');
        }
        if (template.components && !Array.isArray(template.components)) {
            throw new WhatsAppProviderError('Template components must be an array', 'INVALID_TEMPLATE');
        }
    }
    static async credentials(tenantId) {
        const { data, error } = await supabase_1.supabaseAdmin.from('integrations')
            .select('id,status,integration_credentials(access_token,external_account_id,metadata)')
            .eq('tenant_id', tenantId).eq('provider', 'whatsapp').maybeSingle();
        if (error || !data)
            throw new WhatsAppProviderError('WhatsApp Business is not connected', 'NOT_CONNECTED');
        const c = data.integration_credentials?.[0];
        if (data.status !== 'active' || !c?.access_token)
            throw new WhatsAppProviderError('WhatsApp connection is not active', 'NOT_ACTIVE');
        const metadata = c.metadata || {};
        const phoneNumberId = metadata.phone_number_id || metadata.phoneNumberId || metadata.whatsappPhoneNumberId;
        const wabaId = metadata.waba_id || metadata.wabaId || metadata.whatsappBusinessAccountId || c.external_account_id;
        if (!phoneNumberId || !wabaId)
            throw new WhatsAppProviderError('WhatsApp phone number and WABA are not configured', 'INCOMPLETE_CONFIG');
        return { integrationId: data.id, token: c.access_token, phoneNumberId, wabaId, metadata };
    }
    static async request(tenantId, path, init = {}) {
        const c = await this.credentials(tenantId);
        const response = await fetch(`https://graph.facebook.com/${this.version}/${path}`, {
            ...init, headers: { Authorization: 'Bearer ' + c.token, 'Content-Type': 'application/json', ...(init.headers || {}) }
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok || body.error) {
            const status = body.error?.code || response.status;
            throw new WhatsAppProviderError(body.error?.message || `Meta WhatsApp API request failed (${response.status})`, String(status), response.status === 429 || response.status >= 500);
        }
        return body;
    }
    static async sendMessage(tenantId, to, message, context) {
        if (!to)
            throw new WhatsAppProviderError('Recipient WhatsApp number is required', 'INVALID_RECIPIENT');
        if (!['text', 'image', 'video', 'audio', 'document', 'template', 'interactive', 'location'].includes(message.type)) {
            throw new WhatsAppProviderError(`Unsupported WhatsApp message type: ${message.type}`, 'UNSUPPORTED_MESSAGE_TYPE');
        }
        if (message.type === 'text' && !message.text?.body?.trim())
            throw new WhatsAppProviderError('Text body is required', 'INVALID_MESSAGE');
        if (message.type === 'template' && (!message.template?.name || !message.template?.language?.code))
            throw new WhatsAppProviderError('Template name and language are required', 'INVALID_MESSAGE');
        if (message.type === 'interactive' && !message.interactive?.type)
            throw new WhatsAppProviderError('Interactive type is required', 'INVALID_MESSAGE');
        const c = await this.credentials(tenantId);
        const result = await this.request(tenantId, `${c.phoneNumberId}/messages`, {
            method: 'POST', body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to, ...message })
        });
        const externalId = result.messages?.[0]?.id;
        if (!externalId)
            throw new WhatsAppProviderError('Meta returned no WhatsApp message id', 'INVALID_PROVIDER_RESPONSE');
        return { externalId, providerResponse: result, ...context };
    }
    static async getStatus(tenantId) {
        const c = await this.credentials(tenantId);
        const phone = await this.request(tenantId, `${c.phoneNumberId}?fields=id,display_phone_number,verified_name,quality_rating,status`);
        const waba = await this.request(tenantId, `${c.wabaId}?fields=id,name,account_review_status`);
        await supabase_1.supabaseAdmin.from('integration_credentials').update({
            provider_account_status: phone.status || waba.account_review_status || 'unknown',
            last_verified_at: new Date().toISOString(),
            metadata: { ...c.metadata, phone_status: phone.status, quality_rating: phone.quality_rating, account_review_status: waba.account_review_status }
        }).eq('integration_id', c.integrationId);
        return { phone, waba };
    }
    static async listTemplates(tenantId) {
        const c = await this.credentials(tenantId);
        const result = await this.request(tenantId, `${c.wabaId}/message_templates?limit=100`);
        const templates = result.data || [];
        const { error } = await supabase_1.supabaseAdmin.from('whatsapp_templates').upsert(templates.map((t) => ({
            tenant_id: tenantId, waba_id: c.wabaId, template_id: t.id, name: t.name,
            language: t.language, category: t.category, status: t.status,
            components: t.components || [], rejected_reason: t.rejected_reason || null, synced_at: new Date().toISOString()
        })), { onConflict: 'tenant_id,waba_id,name,language' });
        if (error)
            throw new WhatsAppProviderError(`Template sync failed: ${error.message}`, 'TEMPLATE_STORAGE_FAILED');
        return templates;
    }
    static async createTemplate(tenantId, template) {
        this.validateTemplate(template);
        const c = await this.credentials(tenantId);
        return this.request(tenantId, `${c.wabaId}/message_templates`, { method: 'POST', body: JSON.stringify(template) });
    }
    static async updateTemplate(tenantId, id, template) {
        this.validateTemplate(template, true);
        return this.request(tenantId, id, { method: 'POST', body: JSON.stringify(template) });
    }
    static async deleteTemplate(tenantId, name, language) {
        const c = await this.credentials(tenantId);
        const query = language ? `?name=${encodeURIComponent(name)}&language=${encodeURIComponent(language)}` : `?name=${encodeURIComponent(name)}`;
        return this.request(tenantId, `${c.wabaId}/message_templates${query}`, { method: 'DELETE' });
    }
    static async templateStatus(tenantId, name, language) {
        const templates = await this.listTemplates(tenantId);
        return templates.filter((t) => t.name === name && (!language || t.language === language));
    }
    static extractVariables(template) {
        const text = JSON.stringify(template?.components || template || '');
        return [...new Set([...text.matchAll(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g)].map(m => m[1]))];
    }
    static async listCatalogProducts(tenantId, catalogId) {
        const c = await this.credentials(tenantId);
        const id = catalogId || c.metadata.catalog_id || c.metadata.catalogId;
        if (!id)
            throw new WhatsAppProviderError('WhatsApp catalog is not configured', 'CATALOG_NOT_CONFIGURED');
        const result = await this.request(tenantId, `${id}/products?fields=id,name,description,price,currency,image_url,availability,retailer_id&limit=100`);
        return result.data || [];
    }
    static async syncCatalog(tenantId, catalogId) {
        const products = await this.listCatalogProducts(tenantId, catalogId);
        const c = await this.credentials(tenantId);
        const id = catalogId || c.metadata.catalog_id || c.metadata.catalogId;
        const { error } = await supabase_1.supabaseAdmin.from('whatsapp_catalog_products').upsert(products.map((p) => ({
            tenant_id: tenantId, catalog_id: id, product_id: p.id, name: p.name, description: p.description,
            price: p.price, currency: p.currency, image_url: p.image_url, availability: p.availability,
            retailer_id: p.retailer_id, raw: p, synced_at: new Date().toISOString(), updated_at: new Date().toISOString()
        })), { onConflict: 'tenant_id,catalog_id,product_id' });
        if (error)
            throw new WhatsAppProviderError(`Catalog sync failed: ${error.message}`, 'CATALOG_STORAGE_FAILED');
        return products;
    }
    static async shareProduct(tenantId, to, productId, catalogId, body) {
        const c = await this.credentials(tenantId);
        const id = catalogId || c.metadata.catalog_id || c.metadata.catalogId;
        if (!id)
            throw new WhatsAppProviderError('WhatsApp catalog is not configured', 'CATALOG_NOT_CONFIGURED');
        return this.sendMessage(tenantId, to, { type: 'interactive', interactive: {
                type: 'product', body: body ? { text: body } : undefined, action: { catalog_id: id, product_retailer_id: productId }
            } });
    }
    static async createCatalogProduct(tenantId, product, catalogId) {
        const c = await this.credentials(tenantId);
        const id = catalogId || c.metadata.catalog_id || c.metadata.catalogId;
        if (!id || !product?.name || !product?.retailer_id)
            throw new WhatsAppProviderError('Catalog, name and retailer_id are required', 'INVALID_PRODUCT');
        return this.request(tenantId, id + '/products', { method: 'POST', body: JSON.stringify(product) });
    }
    static async updateCatalogProduct(tenantId, productId, product, catalogId) {
        const c = await this.credentials(tenantId);
        const id = catalogId || c.metadata.catalog_id || c.metadata.catalogId;
        if (!id || !productId)
            throw new WhatsAppProviderError('Catalog and product id are required', 'INVALID_PRODUCT');
        return this.request(tenantId, productId, { method: 'POST', body: JSON.stringify(product) });
    }
    static async deleteCatalogProduct(tenantId, productId, catalogId) {
        const c = await this.credentials(tenantId);
        const id = catalogId || c.metadata.catalog_id || c.metadata.catalogId;
        if (!id || !productId)
            throw new WhatsAppProviderError('Catalog and product id are required', 'INVALID_PRODUCT');
        return this.request(tenantId, productId, { method: 'DELETE' });
    }
    static async processWebhook(tenantId, payload) {
        if (payload.object !== 'whatsapp_business_account')
            return;
        for (const entry of payload.entry || [])
            for (const change of entry.changes || []) {
                const value = change.value || {};
                for (const status of value.statuses || [])
                    await this.processStatus(tenantId, status);
                if (value.messages?.length)
                    await this.processMessages(tenantId, value);
            }
    }
    static async processStatus(tenantId, status) {
        const eventId = `status:${status.id}:${status.status}`;
        await integrations_engine_1.IntegrationEngine.handleWebhook({ tenantId, provider: 'whatsapp', eventType: 'message_status', externalId: eventId, payload: status }, async () => {
            const mapped = ['sent', 'delivered', 'read', 'failed'].includes(status.status) ? status.status : 'failed';
            await supabase_1.supabaseAdmin.from('messages').update({ status: mapped })
                .eq('tenant_id', tenantId).eq('external_id', status.id);
            await supabase_1.supabaseAdmin.from('campaign_jobs').update({ status: mapped, error_message: status.errors?.[0]?.title || null })
                .eq('tenant_id', tenantId).eq('external_message_id', status.id);
            await supabase_1.supabaseAdmin.from('whatsapp_delivery_events').upsert({
                tenant_id: tenantId, external_message_id: status.id, status: status.status,
                recipient_id: status.recipient_id, errors: status.errors || null, occurred_at: status.timestamp ? new Date(Number(status.timestamp) * 1000).toISOString() : new Date().toISOString()
            }, { onConflict: 'tenant_id,external_message_id,status' });
        });
    }
    static async processMessages(tenantId, value) {
        for (const msg of value.messages || []) {
            const contactInfo = (value.contacts || []).find((c) => c.wa_id === msg.from);
            await integrations_engine_1.IntegrationEngine.handleWebhook({ tenantId, provider: 'whatsapp', eventType: 'message', externalId: msg.id, payload: msg }, async () => {
                const contact = await crm_engine_1.CRMEngine.resolveIdentity({ tenantId, provider: 'whatsapp', providerId: msg.from, profileData: { firstName: contactInfo?.profile?.name || 'Unknown', phone: msg.from } });
                const content = msg.type === 'text' ? msg.text?.body || '' : msg[msg.type]?.caption || `[Received a ${msg.type} message]`;
                await inbox_engine_1.InboxEngine.handleIncomingMessage({ tenantId, contactId: contact.id, channel: 'whatsapp', channelIdentityId: contact.id, content, externalId: msg.id, messageType: msg.type });
            });
        }
    }
}
exports.WhatsAppProvider = WhatsAppProvider;
