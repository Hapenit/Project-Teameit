import { supabaseAdmin } from '../../config/supabase';
import { publishPlatform } from './publishing.adapters';

let running = false;
export class PublishingScheduler {
  static async tick() {
    if (running) return;
    running = true;
    try {
      const { data: posts } = await supabaseAdmin.from('posts').select('id, tenant_id, content, platforms, post_media(*)').eq('status', 'scheduled').lte('scheduled_for', new Date().toISOString()).limit(25);
      for (const post of posts || []) {
        try {
          const ids: Record<string, string> = {};
          for (const platform of post.platforms) ids[platform] = await publishPlatform(platform, { tenantId: post.tenant_id, content: post.content, media: post.post_media || [] });
          await supabaseAdmin.from('posts').update({ status: 'published', published_at: new Date().toISOString(), external_ids: ids, last_error: null }).eq('id', post.id).eq('status', 'scheduled');
        } catch (error) {
          await supabaseAdmin.from('posts').update({ status: 'failed', last_error: error instanceof Error ? error.message : 'Scheduled publishing failed' }).eq('id', post.id).eq('status', 'scheduled');
        }
      }
    } finally { running = false; }
  }
}
