"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublishingEngine = exports.PublishingValidationError = exports.SUPPORTED_PLATFORMS = void 0;
exports.validateCreatePost = validateCreatePost;
const supabase_1 = require("../../config/supabase");
exports.SUPPORTED_PLATFORMS = ['facebook', 'instagram', 'linkedin'];
class PublishingValidationError extends Error {
    code = 'INVALID_POST';
    constructor(message) {
        super(message);
        this.name = 'PublishingValidationError';
    }
}
exports.PublishingValidationError = PublishingValidationError;
function validateCreatePost(params) {
    if (!params.tenantId || !params.authorId) {
        throw new PublishingValidationError('A tenant and authenticated author are required');
    }
    if (typeof params.content !== 'string' || !params.content.trim()) {
        throw new PublishingValidationError('Content is required');
    }
    if (params.content.trim().length > 5000) {
        throw new PublishingValidationError('Content must be 5,000 characters or fewer');
    }
    if (!Array.isArray(params.platforms) || params.platforms.length === 0) {
        throw new PublishingValidationError('Select at least one supported platform');
    }
    if (params.platforms.some(platform => typeof platform !== 'string' || !platform.trim())) {
        throw new PublishingValidationError('Platforms must be non-empty strings');
    }
    const platforms = params.platforms.map(platform => platform.trim().toLowerCase());
    if (new Set(platforms).size !== platforms.length) {
        throw new PublishingValidationError('Platforms must not be duplicated');
    }
    const unsupported = platforms.filter(platform => !exports.SUPPORTED_PLATFORMS.includes(platform));
    if (unsupported.length > 0) {
        throw new PublishingValidationError(`Unsupported platform(s): ${unsupported.join(', ')}`);
    }
    if (params.scheduledFor && Number.isNaN(params.scheduledFor.getTime())) {
        throw new PublishingValidationError('scheduledFor must be a valid date');
    }
    if (params.scheduledFor && params.scheduledFor.getTime() <= Date.now()) {
        throw new PublishingValidationError('scheduledFor must be in the future');
    }
    if (params.mediaUrls && params.mediaUrls.length > 10) {
        throw new PublishingValidationError('A post can include at most 10 media items');
    }
    if (params.mediaUrls?.some(url => !/^https?:\/\/\S+$/i.test(url))) {
        throw new PublishingValidationError('Media URLs must use http or https');
    }
}
class PublishingEngine {
    static async createPost(params) {
        validateCreatePost(params);
        const { tenantId, authorId, content, platforms, mediaUrls = [], scheduledFor, postType = 'feed' } = params;
        // 1. Create the post record
        const { data: post, error: postError } = await supabase_1.supabaseAdmin
            .from('posts')
            .insert({
            tenant_id: tenantId,
            author_id: authorId,
            content: content.trim(),
            platforms: platforms.map(platform => platform.toLowerCase()),
            status: scheduledFor ? 'scheduled' : 'draft',
            scheduled_for: scheduledFor?.toISOString() ?? null,
            post_type: postType
        })
            .select()
            .single();
        if (postError)
            throw new Error(`Failed to create post: ${postError.message}`);
        // 2. Attach media if provided
        if (mediaUrls.length > 0) {
            const mediaRecords = mediaUrls.map((url, index) => ({
                post_id: post.id,
                media_type: url.match(/\.(mp4|mov|avi)$/i) ? 'video' : 'image',
                media_url: url,
                sort_order: index
            }));
            const { error: mediaError } = await supabase_1.supabaseAdmin
                .from('post_media')
                .insert(mediaRecords);
            if (mediaError)
                throw new Error(`Failed to attach media: ${mediaError.message}`);
        }
        return post;
    }
    static async getPost(id, tenantId) {
        const { data, error } = await supabase_1.supabaseAdmin.from('posts').select('*, post_media(*)').eq('id', id).eq('tenant_id', tenantId).single();
        if (error || !data)
            throw new PublishingValidationError('Post not found');
        return data;
    }
    static async publishPost(tenantId, postId) {
        // This is now handled in the controller which iterators over platforms and calls adapters directly
        // This method might be obsolete or only used for direct manual publishing via another route, but the controller uses `publishPlatform` from adapters.
        throw new Error('publishPost is deprecated, use controller logic');
    }
}
exports.PublishingEngine = PublishingEngine;
