"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InboxEngine = void 0;
const supabase_1 = require("../../config/supabase");
const credentials_1 = require("../../security/credentials");
const nodemailer_1 = __importDefault(require("nodemailer"));
class InboxEngine {
    /**
     * Processes an incoming message, attaching it to an existing conversation
     * or creating a new one if none exists for this channel.
     */
    static async handleIncomingMessage(params) {
        const { tenantId, contactId, channel, channelIdentityId, content, externalId, messageType = 'text' } = params;
        // 1. Find an active conversation for this contact and channel
        let { data: conversation } = await supabase_1.supabaseAdmin
            .from('conversations')
            .select('id')
            .eq('tenant_id', tenantId)
            .eq('contact_id', contactId)
            .eq('channel', channel)
            .eq('status', 'open')
            .single();
        // 2. If no open conversation, create one
        if (!conversation) {
            const { data: newConv, error: convError } = await supabase_1.supabaseAdmin
                .from('conversations')
                .insert({
                tenant_id: tenantId,
                contact_id: contactId,
                channel,
                channel_identity_id: channelIdentityId,
                status: 'open',
                unread_count: 0
            })
                .select('id')
                .single();
            if (convError)
                throw new Error(`Failed to create conversation: ${convError.message}`);
            conversation = newConv;
        }
        // 3. Insert the message
        const { data: message, error: msgError } = await supabase_1.supabaseAdmin
            .from('messages')
            .insert({
            tenant_id: tenantId,
            conversation_id: conversation.id,
            sender_type: 'contact',
            content,
            message_type: messageType,
            external_id: externalId,
            status: 'delivered'
        })
            .select()
            .single();
        if (msgError)
            throw new Error(`Failed to insert message: ${msgError.message}`);
        // 4. Update conversation unread count and last_message_at
        // In production, this might be handled via a trigger or rpc to avoid race conditions.
        await supabase_1.supabaseAdmin.rpc('increment_unread_count', { row_id: conversation.id });
        return { conversationId: conversation.id, message };
    }
    static async sendMessage(params) {
        const { tenantId, conversationId, senderId, content } = params;
        const { data: conversation, error: conversationError } = await supabase_1.supabaseAdmin
            .from('conversations')
            .select('id, channel, contact_id, channel_identity_id, contacts(email), contact_identities(provider_id)')
            .eq('id', conversationId)
            .eq('tenant_id', tenantId)
            .single();
        if (conversationError || !conversation)
            throw new Error('Conversation not found');
        let identity = conversation.contact_identities?.[0] || null;
        if (!identity) {
            const { data: fallbackIdentity } = await supabase_1.supabaseAdmin
                .from('contact_identities')
                .select('provider_id')
                .eq('tenant_id', tenantId)
                .eq('contact_id', conversation.contact_id)
                .eq('provider', conversation.channel)
                .maybeSingle();
            identity = fallbackIdentity;
        }
        const { data: integration, error: integrationError } = await supabase_1.supabaseAdmin
            .from('integrations')
            .select('credentials, integration_credentials(access_token, external_account_id)')
            .eq('tenant_id', tenantId)
            .eq('provider', conversation.channel)
            .eq('status', 'active')
            .single();
        if (integrationError || !integration) {
            throw new Error(`No active ${conversation.channel} integration is configured`);
        }
        const nestedCredentials = integration.integration_credentials?.[0] || {};
        const credentials = integration.credentials
            ? (typeof integration.credentials === 'string' ? (0, credentials_1.decryptJson)(integration.credentials) : integration.credentials)
            : { ...nestedCredentials, access_token: (0, credentials_1.decryptSecret)(nestedCredentials.access_token) };
        let externalId;
        if (conversation.channel === 'email') {
            const recipient = conversation.contacts?.[0]?.email;
            if (!recipient)
                throw new Error('Conversation contact has no email address');
            const { host, port, user, password, secure } = credentials;
            if (!host || !port || !user || !password)
                throw new Error('Email integration credentials are incomplete');
            const transporter = nodemailer_1.default.createTransport({
                host, port: Number(port), secure: secure === true || secure === 'true',
                auth: { user, pass: password }
            });
            const result = await transporter.sendMail({ from: user, to: recipient, text: content });
            externalId = result.messageId;
        }
        else if (['whatsapp', 'facebook', 'instagram'].includes(conversation.channel)) {
            const accessToken = credentials.access_token || credentials.accessToken;
            const accountId = credentials.external_account_id || credentials.externalAccountId;
            const recipientId = identity?.provider_id;
            if (!accessToken || !accountId || !recipientId) {
                throw new Error(`${conversation.channel} integration or contact identity is incomplete`);
            }
            const payload = conversation.channel === 'whatsapp'
                ? { messaging_product: 'whatsapp', to: recipientId, type: 'text', text: { body: content } }
                : { recipient: { id: recipientId }, message: { text: content } };
            const response = await fetch(`https://graph.facebook.com/v21.0/${accountId}/messages`, {
                method: 'POST',
                headers: { ['Authorization']: 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (!response.ok || result.error)
                throw new Error(result.error?.message || `Failed to send ${conversation.channel} message`);
            externalId = result.messages?.[0]?.id || result.message_id;
        }
        else {
            throw new Error(`Sending messages for ${conversation.channel} is not supported`);
        }
        const { data: message, error: messageError } = await supabase_1.supabaseAdmin
            .from('messages')
            .insert({ tenant_id: tenantId, conversation_id: conversationId, sender_type: 'agent', sender_id: senderId || null, content, message_type: 'text', external_id: externalId, status: 'sent' })
            .select()
            .single();
        if (messageError)
            throw new Error(`Message sent but could not be recorded: ${messageError.message}`);
        await supabase_1.supabaseAdmin.from('conversations').update({ last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', conversationId).eq('tenant_id', tenantId);
        return message;
    }
}
exports.InboxEngine = InboxEngine;
