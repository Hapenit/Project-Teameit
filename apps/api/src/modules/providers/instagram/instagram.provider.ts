import { MetaSocialProvider } from '../meta/meta-social.provider';
export class InstagramProvider {
  static async processWebhook(tenantId: string, payload: any) {
    for (const entry of payload.entry || []) {
      for (const event of entry.messaging || []) if (event.message) await MetaSocialProvider.processMessage(tenantId, 'instagram', event);
      for (const change of entry.changes || []) {
        if (change.field === 'comments' && change.value) await MetaSocialProvider.processComment(tenantId, 'instagram', change.value);
      }
    }
  }
  static replyToComment(tenantId: string, _provider: string, commentId: string, message: string) { return MetaSocialProvider.replyToComment(tenantId, 'instagram', commentId, message); }
  static moderateComment(tenantId: string, _provider: string, commentId: string, action: 'hide' | 'unhide' | 'delete') { return MetaSocialProvider.moderateComment(tenantId, 'instagram', commentId, action); }
}
