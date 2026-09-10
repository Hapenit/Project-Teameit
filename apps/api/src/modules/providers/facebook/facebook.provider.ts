import { MetaSocialProvider } from '../meta/meta-social.provider';
export class FacebookProvider {
  static async processWebhook(tenantId: string, payload: any) {
    for (const entry of payload.entry || []) {
      for (const event of entry.messaging || []) if (event.message) await MetaSocialProvider.processMessage(tenantId, 'facebook', event);
      for (const change of entry.changes || []) {
        if ((change.field === 'feed' || change.field === 'comments') && change.value) {
          const value = change.value; if (value.item === 'comment' || value.message || value.comment_id) await MetaSocialProvider.processComment(tenantId, 'facebook', value);
        }
      }
    }
  }
  static replyToComment(tenantId: string, _provider: string, commentId: string, message: string) { return MetaSocialProvider.replyToComment(tenantId, 'facebook', commentId, message); }
  static moderateComment(tenantId: string, _provider: string, commentId: string, action: 'hide' | 'unhide' | 'delete') { return MetaSocialProvider.moderateComment(tenantId, 'facebook', commentId, action); }
}
