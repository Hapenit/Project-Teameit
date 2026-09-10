"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhook = exports.checkout = exports.billingStatus = exports.listAuditLogs = exports.createReport = exports.listReports = exports.markNotificationRead = exports.listNotifications = exports.updateSettings = exports.getSettings = void 0;
const supabase_1 = require("../../config/supabase");
async function member(req, tenantId) {
    const userId = req.user?.sub;
    if (!userId || !tenantId)
        return null;
    const { data } = await supabase_1.supabaseAdmin.from('tenant_members').select('user_id, role_id, roles(name)')
        .eq('tenant_id', tenantId).eq('user_id', userId).eq('status', 'active').single();
    return data;
}
function tenant(req) { return (req.tenantId || req.headers['x-tenant-id']); }
function fail(res, status, message) {
    return res.status(status).json({ success: false, error: { message } });
}
const getSettings = async (req, res) => {
    const id = tenant(req);
    if (!await member(req, id))
        return fail(res, 403, 'Tenant access denied');
    const { data, error } = await supabase_1.supabaseAdmin.from('tenant_settings').select('settings, updated_at').eq('tenant_id', id).maybeSingle();
    if (error)
        return fail(res, 500, error.message);
    return res.json({ success: true, data: data || { settings: {} } });
};
exports.getSettings = getSettings;
const updateSettings = async (req, res) => {
    const id = tenant(req);
    const m = await member(req, id);
    const role = m?.roles?.name;
    if (!m)
        return fail(res, 403, 'Tenant access denied');
    if (!['owner', 'admin'].includes(role))
        return fail(res, 403, 'Administrator role required');
    const { data, error } = await supabase_1.supabaseAdmin.from('tenant_settings').upsert({ tenant_id: id, settings: req.body.settings || {}, updated_by: req.user.sub }).select().single();
    if (error)
        return fail(res, 400, error.message);
    await supabase_1.supabaseAdmin.from('audit_logs').insert({ tenant_id: id, actor_id: req.user.sub, action: 'settings.updated', resource_type: 'tenant_settings', metadata: { keys: Object.keys(req.body.settings || {}) } });
    return res.json({ success: true, data });
};
exports.updateSettings = updateSettings;
const listNotifications = async (req, res) => {
    const id = tenant(req);
    if (!await member(req, id))
        return fail(res, 403, 'Tenant access denied');
    const { data, error } = await supabase_1.supabaseAdmin.from('notifications').select('*').eq('tenant_id', id).or(`user_id.is.null,user_id.eq.${req.user.sub}`).order('created_at', { ascending: false }).limit(100);
    if (error)
        return fail(res, 500, error.message);
    return res.json({ success: true, data: data || [] });
};
exports.listNotifications = listNotifications;
const markNotificationRead = async (req, res) => {
    const id = tenant(req);
    if (!await member(req, id))
        return fail(res, 403, 'Tenant access denied');
    const { error } = await supabase_1.supabaseAdmin.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', req.params.id).eq('tenant_id', id).or(`user_id.is.null,user_id.eq.${req.user.sub}`);
    if (error)
        return fail(res, 400, error.message);
    return res.json({ success: true });
};
exports.markNotificationRead = markNotificationRead;
const listReports = async (req, res) => {
    const id = tenant(req);
    if (!await member(req, id))
        return fail(res, 403, 'Tenant access denied');
    const { data, error } = await supabase_1.supabaseAdmin.from('reports').select('*').eq('tenant_id', id).order('created_at', { ascending: false }).limit(100);
    if (error)
        return fail(res, 500, error.message);
    return res.json({ success: true, data: data || [] });
};
exports.listReports = listReports;
const createReport = async (req, res) => {
    const id = tenant(req);
    if (!await member(req, id))
        return fail(res, 403, 'Tenant access denied');
    if (!req.body.name || !req.body.report_type)
        return fail(res, 400, 'name and report_type are required');
    const { data, error } = await supabase_1.supabaseAdmin.from('reports').insert({ tenant_id: id, created_by: req.user.sub, name: req.body.name, report_type: req.body.report_type, parameters: req.body.parameters || {} }).select().single();
    if (error)
        return fail(res, 400, error.message);
    return res.status(201).json({ success: true, data });
};
exports.createReport = createReport;
const listAuditLogs = async (req, res) => {
    const id = tenant(req);
    if (!await member(req, id))
        return fail(res, 403, 'Tenant access denied');
    const { data, error } = await supabase_1.supabaseAdmin.from('audit_logs').select('*').eq('tenant_id', id).order('created_at', { ascending: false }).limit(200);
    if (error)
        return fail(res, 500, error.message);
    return res.json({ success: true, data: data || [] });
};
exports.listAuditLogs = listAuditLogs;
const billingStatus = async (req, res) => {
    const id = tenant(req);
    if (!await member(req, id))
        return fail(res, 403, 'Tenant access denied');
    const configured = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
    const { data } = await supabase_1.supabaseAdmin.from('billing_accounts').select('*').eq('tenant_id', id).maybeSingle();
    return res.json({ success: true, data: { configured, status: data?.status || 'unconfigured', stripeConfigured: configured } });
};
exports.billingStatus = billingStatus;
const checkout = async (req, res) => {
    const id = tenant(req);
    if (!await member(req, id))
        return fail(res, 403, 'Tenant access denied');
    if (!process.env.STRIPE_SECRET_KEY)
        return fail(res, 503, 'Billing is not configured (STRIPE_SECRET_KEY is missing)');
    return fail(res, 501, 'Stripe checkout is not enabled in this deployment');
};
exports.checkout = checkout;
const stripeWebhook = async (_req, res) => {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET)
        return fail(res, 503, 'Stripe billing is not configured');
    return fail(res, 501, 'Stripe webhook handling is not enabled in this deployment');
};
exports.stripeWebhook = stripeWebhook;
