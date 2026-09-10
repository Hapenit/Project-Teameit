"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstagramProvider = void 0;
const meta_social_provider_1 = require("../meta/meta-social.provider");
class InstagramProvider {
    static async processWebhook(tenantId, payload) {
        for (const entry of payload.entry || []) {
            for (const event of entry.messaging || [])
                if (event.message)
                    await meta_social_provider_1.MetaSocialProvider.processMessage(tenantId, 'instagram', event);
            for (const change of entry.changes || []) {
                if (change.field === 'comments' && change.value)
                    await meta_social_provider_1.MetaSocialProvider.processComment(tenantId, 'instagram', change.value);
            }
        }
    }
    static replyToComment(tenantId, _provider, commentId, message) { return meta_social_provider_1.MetaSocialProvider.replyToComment(tenantId, 'instagram', commentId, message); }
    static moderateComment(tenantId, _provider, commentId, action) { return meta_social_provider_1.MetaSocialProvider.moderateComment(tenantId, 'instagram', commentId, action); }
}
exports.InstagramProvider = InstagramProvider;
