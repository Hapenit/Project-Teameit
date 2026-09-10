"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacebookProvider = void 0;
const meta_social_provider_1 = require("../meta/meta-social.provider");
class FacebookProvider {
    static async processWebhook(tenantId, payload) {
        for (const entry of payload.entry || []) {
            for (const event of entry.messaging || [])
                if (event.message)
                    await meta_social_provider_1.MetaSocialProvider.processMessage(tenantId, 'facebook', event);
            for (const change of entry.changes || []) {
                if ((change.field === 'feed' || change.field === 'comments') && change.value) {
                    const value = change.value;
                    if (value.item === 'comment' || value.message || value.comment_id)
                        await meta_social_provider_1.MetaSocialProvider.processComment(tenantId, 'facebook', value);
                }
            }
        }
    }
    static replyToComment(tenantId, _provider, commentId, message) { return meta_social_provider_1.MetaSocialProvider.replyToComment(tenantId, 'facebook', commentId, message); }
    static moderateComment(tenantId, _provider, commentId, action) { return meta_social_provider_1.MetaSocialProvider.moderateComment(tenantId, 'facebook', commentId, action); }
}
exports.FacebookProvider = FacebookProvider;
