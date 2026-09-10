"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublishingScheduler = void 0;
const supabase_1 = require("../../config/supabase");
const publishing_adapters_1 = require("./publishing.adapters");
let running = false;
class PublishingScheduler {
    static async tick() {
        if (running)
            return;
        running = true;
        try {
            const { data: posts } = await supabase_1.supabaseAdmin.from('posts').select('id, tenant_id, content, platforms, post_media(*)').eq('status', 'scheduled').lte('scheduled_for', new Date().toISOString()).limit(25);
            for (const post of posts || []) {
                try {
                    const ids = {};
                    for (const platform of post.platforms)
                        ids[platform] = await (0, publishing_adapters_1.publishPlatform)(platform, { tenantId: post.tenant_id, content: post.content, media: post.post_media || [] });
                    await supabase_1.supabaseAdmin.from('posts').update({ status: 'published', published_at: new Date().toISOString(), external_ids: ids, last_error: null }).eq('id', post.id).eq('status', 'scheduled');
                }
                catch (error) {
                    await supabase_1.supabaseAdmin.from('posts').update({ status: 'failed', last_error: error instanceof Error ? error.message : 'Scheduled publishing failed' }).eq('id', post.id).eq('status', 'scheduled');
                }
            }
        }
        finally {
            running = false;
        }
    }
}
exports.PublishingScheduler = PublishingScheduler;
