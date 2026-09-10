"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImapSyncEngine = void 0;
const imapflow_1 = require("imapflow");
const mailparser_1 = require("mailparser");
const supabase_1 = require("../../config/supabase");
class ImapSyncEngine {
    /**
     * Polls all active email integrations for UNSEEN messages
     */
    static async syncAll() {
        console.log('[ImapSyncEngine] Starting IMAP poll loop...');
        try {
            const { data: integrations } = await supabase_1.supabaseAdmin
                .from('integrations')
                .select('*')
                .eq('provider', 'email')
                .eq('status', 'active');
            if (!integrations || integrations.length === 0) {
                return;
            }
            for (const integration of integrations) {
                await this.syncTenant(integration);
            }
        }
        catch (error) {
            console.error('[ImapSyncEngine] Error during sync loop', error);
        }
    }
    /**
     * Connects to a specific tenant's IMAP server, reads UNSEEN, and ingests them
     */
    static async syncTenant(integration) {
        const tenantId = integration.tenant_id;
        const { imapHost, imapPort, imapSecure, user, password } = integration.credentials;
        if (!imapHost || !imapPort || !user || !password)
            return;
        const client = new imapflow_1.ImapFlow({
            host: imapHost,
            port: parseInt(imapPort, 10),
            secure: imapSecure === 'true' || imapSecure === true,
            auth: { user, pass: password },
            logger: false
        });
        try {
            await client.connect();
            const lock = await client.getMailboxLock('INBOX');
            try {
                // Fetch all unseen messages
                const searchRes = await client.search({ seen: false });
                if (searchRes && searchRes.length > 0) {
                    for (const seq of searchRes) {
                        // Fetch the raw email source
                        const msg = await client.fetchOne(seq, { source: true });
                        if (msg && msg.source) {
                            const parsedMail = await (0, mailparser_1.simpleParser)(msg.source);
                            // Find or create conversation based on sender's email
                            const senderEmail = parsedMail.from?.value[0]?.address || 'unknown@example.com';
                            const subject = parsedMail.subject || 'No Subject';
                            const bodyText = parsedMail.text || parsedMail.html || '';
                            let { data: conversation } = await supabase_1.supabaseAdmin
                                .from('conversations')
                                .select('id')
                                .eq('tenant_id', tenantId)
                                .eq('provider', 'email')
                                .eq('provider_id', senderEmail)
                                .single();
                            if (!conversation) {
                                const { data: newConv } = await supabase_1.supabaseAdmin
                                    .from('conversations')
                                    .insert({
                                    tenant_id: tenantId,
                                    provider: 'email',
                                    provider_id: senderEmail,
                                    status: 'open'
                                })
                                    .select('id')
                                    .single();
                                conversation = newConv;
                            }
                            if (conversation) {
                                // Insert message
                                await supabase_1.supabaseAdmin
                                    .from('messages')
                                    .insert({
                                    conversation_id: conversation.id,
                                    sender_id: senderEmail,
                                    direction: 'inbound',
                                    content: { text: `[${subject}]\n\n${bodyText}` },
                                    channel: 'email'
                                });
                            }
                            // Mark as SEEN
                            await client.messageFlagsAdd(seq, ['\\Seen']);
                        }
                    }
                }
            }
            finally {
                lock.release();
            }
            await client.logout();
        }
        catch (err) {
            console.error(`[ImapSyncEngine] Failed to sync tenant ${tenantId}`, err);
        }
    }
}
exports.ImapSyncEngine = ImapSyncEngine;
