"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleBusinessProvider = void 0;
class GoogleBusinessProvider {
    async sendMessage(credentials, recipientId, messagePayload) {
        // In a real integration, we would use the Google Business Messages API
        // e.g., POST https://businessmessages.googleapis.com/v1/conversations/{recipientId}/messages
        console.log(`[GoogleBusinessProvider] Sending message to ${recipientId}:`, messagePayload);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300));
        return {
            success: true,
            messageId: `gbp-msg-${Date.now()}`
        };
    }
    async handleWebhook(tenantId, payload) {
        // Simulate parsing a Google Business Messages webhook payload
        // Real payload docs: https://developers.google.com/business-communications/business-messages/guides/how-to/message/receive
        const senderId = payload.sender?.name || payload.from || 'unknown_gbp_user';
        const text = payload.message?.text || payload.text || '';
        return {
            senderId,
            channel: 'google-business',
            messagePayload: {
                type: 'text',
                text
            },
            rawPayload: payload
        };
    }
}
exports.GoogleBusinessProvider = GoogleBusinessProvider;
