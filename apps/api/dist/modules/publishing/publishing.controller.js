"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPost = exports.getPosts = exports.publishPost = exports.getCapabilities = void 0;
const supabase_1 = require("../../config/supabase");
const publishing_engine_1 = require("./publishing.engine");
const publishing_adapters_1 = require("./publishing.adapters");
const errorResponse = (res, error) => {
    const message = error instanceof Error ? error.message : 'Publishing request failed';
    const code = error instanceof publishing_engine_1.PublishingValidationError ? error.code : 'PUBLISHING_ERROR';
    return res.status(error instanceof publishing_engine_1.PublishingValidationError ? 422 : 400).json({
        success: false,
        error: { code, message }
    });
};
const getCapabilities = (_req, res) => {
    return res.status(200).json({
        success: true,
        data: {
            mode: 'live-when-configured',
            canCreateDrafts: true,
            canSchedule: true,
            canPublish: true,
            supportedPlatforms: publishing_engine_1.SUPPORTED_PLATFORMS
        }
    });
};
exports.getCapabilities = getCapabilities;
const publishPost = async (req, res) => {
    try {
        const tenantId = (req.tenantId || req.headers['x-tenant-id']);
        const post = await publishing_engine_1.PublishingEngine.getPost(req.params.id, tenantId);
        if (!['draft', 'failed'].includes(post.status))
            throw new publishing_engine_1.PublishingValidationError('Only drafts or failed posts can be published');
        const ids = {};
        for (const platform of post.platforms)
            ids[platform] = await (0, publishing_adapters_1.publishPlatform)(platform, { tenantId, content: post.content, media: post.post_media || [], postType: post.post_type });
        const { data, error } = await supabase_1.supabaseAdmin.from('posts').update({ status: 'published', published_at: new Date().toISOString(), external_ids: ids, last_error: null }).eq('id', post.id).select().single();
        if (error)
            throw new Error(`Failed to record published post: ${error.message}`);
        return res.status(200).json({ success: true, data });
    }
    catch (error) {
        const tenantId = (req.tenantId || req.headers['x-tenant-id']);
        if (req.params.id)
            await supabase_1.supabaseAdmin.from('posts').update({ status: 'failed', last_error: error instanceof Error ? error.message : 'Provider publishing failed' }).eq('id', req.params.id).eq('tenant_id', tenantId);
        return errorResponse(res, error);
    }
};
exports.publishPost = publishPost;
const getPosts = async (req, res) => {
    try {
        const tenantId = (req.tenantId || req.headers['x-tenant-id']);
        const { data, error } = await supabase_1.supabaseAdmin
            .from('posts')
            .select(`
        *,
        post_media(*)
      `)
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        return res.status(200).json({ success: true, data });
    }
    catch (error) {
        return errorResponse(res, error);
    }
};
exports.getPosts = getPosts;
const createPost = async (req, res) => {
    try {
        const tenantId = (req.tenantId || req.headers['x-tenant-id']);
        const authorId = req.user.sub; // From JWT middleware
        const { content, platforms, scheduledFor, mediaUrls, postType } = req.body ?? {};
        const post = await publishing_engine_1.PublishingEngine.createPost({
            tenantId,
            authorId,
            content,
            platforms,
            scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
            mediaUrls,
            postType
        });
        return res.status(201).json({ success: true, data: post });
    }
    catch (error) {
        return errorResponse(res, error);
    }
};
exports.createPost = createPost;
