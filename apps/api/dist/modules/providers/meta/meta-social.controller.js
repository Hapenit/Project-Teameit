"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reply = reply;
exports.moderate = moderate;
const supabase_1 = require("../../../config/supabase");
const meta_social_provider_1 = require("./meta-social.provider");
const run = async (fn) => { try {
    return { success: true, data: await fn() };
}
catch (error) {
    return { error };
} };
async function reply(req, res) {
    const provider = req.params.provider;
    if (!['instagram', 'facebook'].includes(provider))
        return res.status(400).json({ success: false, error: { message: 'Unsupported provider' } });
    const tenantId = req.tenantId || req.headers['x-tenant-id'];
    if (!tenantId)
        return res.status(400).json({ success: false, error: { message: 'Tenant context is required' } });
    const result = await run(() => meta_social_provider_1.MetaSocialProvider.replyToComment(tenantId, provider, req.params.commentId, req.body?.message));
    if (result.error) {
        const e = result.error;
        return res.status(e instanceof meta_social_provider_1.MetaSocialProviderError ? e.status : 502).json({ success: false, error: { message: e.message } });
    }
    return res.status(201).json(result);
}
async function moderate(req, res) {
    const provider = req.params.provider;
    const action = req.body?.action;
    if (!['instagram', 'facebook'].includes(provider) || !['hide', 'unhide', 'delete'].includes(action))
        return res.status(400).json({ success: false, error: { message: 'Provider and moderation action are invalid' } });
    const tenantId = req.tenantId || req.headers['x-tenant-id'];
    if (!tenantId)
        return res.status(400).json({ success: false, error: { message: 'Tenant context is required' } });
    const result = await run(() => meta_social_provider_1.MetaSocialProvider.moderateComment(tenantId, provider, req.params.commentId, action));
    if (result.error) {
        const e = result.error;
        return res.status(e instanceof meta_social_provider_1.MetaSocialProviderError ? e.status : 502).json({ success: false, error: { message: e.message } });
    }
    await supabase_1.supabaseAdmin.from('meta_social_comments').update({ status: action === 'delete' ? 'deleted' : action === 'hide' ? 'hidden' : 'received', updated_at: new Date().toISOString() })
        .eq('tenant_id', tenantId).eq('provider', provider).eq('external_id', req.params.commentId);
    return res.json(result);
}
