"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectEmail = exports.sendWhatsAppMessage = exports.whatsappProductDelete = exports.whatsappProductUpdate = exports.whatsappProductCreate = exports.whatsappProductShare = exports.whatsappCatalogSync = exports.whatsappCatalog = exports.whatsappTemplateDelete = exports.whatsappTemplateUpdate = exports.whatsappTemplateCreate = exports.whatsappTemplateVariables = exports.whatsappTemplateStatus = exports.whatsappTemplates = exports.whatsappStatus = exports.syncAnalytics = exports.disconnectIntegration = exports.redirectOAuthCallback = exports.handleOAuthCallback = exports.getAuthUrl = exports.getIntegrations = void 0;
const supabase_1 = require("../../config/supabase");
const nodemailer_1 = __importDefault(require("nodemailer"));
const imapflow_1 = require("imapflow");
const oauth_service_1 = require("./oauth.service");
const integrations_engine_1 = require("./integrations.engine");
const credentials_1 = require("../../security/credentials");
const whatsapp_provider_1 = require("../providers/whatsapp/whatsapp.provider");
const getIntegrations = async (req, res) => {
    try {
        const tenantId = (req.tenantId || req.headers['x-tenant-id']);
        const { data, error } = await supabase_1.supabaseAdmin
            .from('integrations')
            .select('id, provider, status, created_at, integration_credentials(metadata,provider_account_status,last_verified_at)')
            .eq('tenant_id', tenantId);
        if (error)
            throw error;
        return res.status(200).json({ success: true, data });
    }
    catch (error) {
        return res.status(400).json({ success: false, error: { message: error.message } });
    }
};
exports.getIntegrations = getIntegrations;
const getAuthUrl = async (req, res) => {
    try {
        const tenantId = (req.tenantId || req.headers['x-tenant-id']);
        const { provider } = req.query;
        if (!provider)
            throw new Error('Provider is required');
        const url = await oauth_service_1.OAuthService.generateAuthUrl(tenantId, provider);
        return res.status(200).json({ success: true, data: { url } });
    }
    catch (error) {
        return res.status(400).json({ success: false, error: { message: error.message } });
    }
};
exports.getAuthUrl = getAuthUrl;
const handleOAuthCallback = async (req, res) => {
    try {
        const { code, state } = req.body;
        if (!code || !state)
            throw new Error('Missing code or state');
        const result = await oauth_service_1.OAuthService.handleCallback(code, state);
        return res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        return res.status(400).json({ success: false, error: { message: error.message } });
    }
};
exports.handleOAuthCallback = handleOAuthCallback;
const redirectOAuthCallback = (req, res) => {
    const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';
    const callbackUrl = new URL('/integrations/callback', frontendBase);
    // Preserve provider failures for the UI; never exchange an error response.
    for (const key of ['code', 'state', 'error', 'error_description']) {
        const value = req.query[key];
        if (typeof value === 'string')
            callbackUrl.searchParams.set(key, value);
    }
    return res.redirect(callbackUrl.toString());
};
exports.redirectOAuthCallback = redirectOAuthCallback;
const disconnectIntegration = async (req, res) => {
    try {
        const tenantId = (req.tenantId || req.headers['x-tenant-id']);
        const { provider } = req.params;
        await oauth_service_1.OAuthService.disconnect(tenantId, provider);
        return res.status(200).json({ success: true });
    }
    catch (error) {
        return res.status(400).json({ success: false, error: { message: error.message } });
    }
};
exports.disconnectIntegration = disconnectIntegration;
const syncAnalytics = async (req, res) => {
    try {
        const tenantId = (req.tenantId || req.headers['x-tenant-id']);
        if (!tenantId)
            throw new Error('x-tenant-id header is required');
        const until = typeof req.body?.until === 'string' ? req.body.until : new Date().toISOString().slice(0, 10);
        const since = typeof req.body?.since === 'string' ? req.body.since : new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
        return res.status(200).json({ success: true, data: await integrations_engine_1.IntegrationEngine.syncAnalytics(tenantId, req.params.provider, since, until) });
    }
    catch (error) {
        return res.status(400).json({ success: false, error: { message: error.message } });
    }
};
exports.syncAnalytics = syncAnalytics;
const whatsappStatus = async (req, res) => {
    try {
        const tenantId = (req.tenantId || req.headers['x-tenant-id']);
        if (!tenantId)
            throw new Error('x-tenant-id header is required');
        return res.json({ success: true, data: await whatsapp_provider_1.WhatsAppProvider.getStatus(tenantId) });
    }
    catch (error) {
        return res.status(error.code === 'NOT_CONNECTED' ? 404 : 400).json({ success: false, error: { code: error.code || 'WHATSAPP_ERROR', message: error.message } });
    }
};
exports.whatsappStatus = whatsappStatus;
const whatsappTemplates = async (req, res) => {
    try {
        const tenantId = (req.tenantId || req.headers['x-tenant-id']);
        if (!tenantId)
            throw new Error('x-tenant-id header is required');
        return res.json({ success: true, data: await whatsapp_provider_1.WhatsAppProvider.listTemplates(tenantId) });
    }
    catch (error) {
        return res.status(400).json({ success: false, error: { code: error.code || 'WHATSAPP_ERROR', message: error.message } });
    }
};
exports.whatsappTemplates = whatsappTemplates;
const whatsappTemplateStatus = async (req, res) => {
    try {
        const tenantId = req.tenantId || req.headers['x-tenant-id'];
        return res.json({ success: true, data: await whatsapp_provider_1.WhatsAppProvider.templateStatus(tenantId, req.params.name, req.query.language) });
    }
    catch (error) {
        return res.status(400).json({ success: false, error: { code: error.code, message: error.message } });
    }
};
exports.whatsappTemplateStatus = whatsappTemplateStatus;
const whatsappTemplateVariables = (req, res) => res.json({ success: true, data: whatsapp_provider_1.WhatsAppProvider.extractVariables(req.body) });
exports.whatsappTemplateVariables = whatsappTemplateVariables;
const whatsappTemplateCreate = async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        return res.status(201).json({ success: true, data: await whatsapp_provider_1.WhatsAppProvider.createTemplate(tenantId, req.body) });
    }
    catch (error) {
        return res.status(error.retryable ? 503 : 400).json({ success: false, error: { code: error.code, message: error.message } });
    }
};
exports.whatsappTemplateCreate = whatsappTemplateCreate;
const whatsappTemplateUpdate = async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        return res.json({ success: true, data: await whatsapp_provider_1.WhatsAppProvider.updateTemplate(tenantId, req.params.id, req.body) });
    }
    catch (error) {
        return res.status(error.retryable ? 503 : 400).json({ success: false, error: { code: error.code, message: error.message } });
    }
};
exports.whatsappTemplateUpdate = whatsappTemplateUpdate;
const whatsappTemplateDelete = async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        return res.json({ success: true, data: await whatsapp_provider_1.WhatsAppProvider.deleteTemplate(tenantId, req.params.name, req.query.language) });
    }
    catch (error) {
        return res.status(error.retryable ? 503 : 400).json({ success: false, error: { code: error.code, message: error.message } });
    }
};
exports.whatsappTemplateDelete = whatsappTemplateDelete;
const whatsappCatalog = async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        return res.json({ success: true, data: await whatsapp_provider_1.WhatsAppProvider.listCatalogProducts(tenantId, req.query.catalogId) });
    }
    catch (error) {
        return res.status(error.retryable ? 503 : 400).json({ success: false, error: { code: error.code, message: error.message } });
    }
};
exports.whatsappCatalog = whatsappCatalog;
const whatsappCatalogSync = async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        return res.json({ success: true, data: await whatsapp_provider_1.WhatsAppProvider.syncCatalog(tenantId, req.body?.catalogId) });
    }
    catch (error) {
        return res.status(error.retryable ? 503 : 400).json({ success: false, error: { code: error.code, message: error.message } });
    }
};
exports.whatsappCatalogSync = whatsappCatalogSync;
const whatsappProductShare = async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        const { to, productId, catalogId, body } = req.body || {};
        if (!to || !productId)
            throw new Error('to and productId are required');
        return res.status(202).json({ success: true, data: await whatsapp_provider_1.WhatsAppProvider.shareProduct(tenantId, to, productId, catalogId, body) });
    }
    catch (error) {
        return res.status(error.retryable ? 503 : 400).json({ success: false, error: { code: error.code, message: error.message } });
    }
};
exports.whatsappProductShare = whatsappProductShare;
const whatsappProductCreate = async (req, res) => {
    try {
        const tenantId = req.tenantId || req.headers['x-tenant-id'];
        return res.status(201).json({ success: true, data: await whatsapp_provider_1.WhatsAppProvider.createCatalogProduct(tenantId, req.body, req.body?.catalogId) });
    }
    catch (error) {
        return res.status(error.retryable ? 503 : 400).json({ success: false, error: { code: error.code, message: error.message } });
    }
};
exports.whatsappProductCreate = whatsappProductCreate;
const whatsappProductUpdate = async (req, res) => {
    try {
        const tenantId = req.tenantId || req.headers['x-tenant-id'];
        return res.json({ success: true, data: await whatsapp_provider_1.WhatsAppProvider.updateCatalogProduct(tenantId, req.params.id, req.body, req.body?.catalogId) });
    }
    catch (error) {
        return res.status(error.retryable ? 503 : 400).json({ success: false, error: { code: error.code, message: error.message } });
    }
};
exports.whatsappProductUpdate = whatsappProductUpdate;
const whatsappProductDelete = async (req, res) => {
    try {
        const tenantId = req.tenantId || req.headers['x-tenant-id'];
        return res.json({ success: true, data: await whatsapp_provider_1.WhatsAppProvider.deleteCatalogProduct(tenantId, req.params.id, req.query.catalogId) });
    }
    catch (error) {
        return res.status(error.retryable ? 503 : 400).json({ success: false, error: { code: error.code, message: error.message } });
    }
};
exports.whatsappProductDelete = whatsappProductDelete;
const sendWhatsAppMessage = async (req, res) => {
    try {
        const tenantId = (req.tenantId || req.headers['x-tenant-id']);
        const { to, type, ...body } = req.body || {};
        if (!tenantId || !to || !type)
            throw new Error('x-tenant-id, to and type are required');
        const result = await whatsapp_provider_1.WhatsAppProvider.sendMessage(tenantId, to, { type, ...body });
        return res.status(202).json({ success: true, data: result });
    }
    catch (error) {
        return res.status(error.retryable ? 503 : 400).json({ success: false, error: { code: error.code || 'WHATSAPP_ERROR', message: error.message, retryable: !!error.retryable } });
    }
};
exports.sendWhatsAppMessage = sendWhatsAppMessage;
const connectEmail = async (req, res) => {
    try {
        const tenantId = (req.tenantId || req.headers['x-tenant-id']);
        const { host, port, user, password, secure, imapHost, imapPort, imapSecure } = req.body;
        if (!host || !port || !user || !password || !imapHost || !imapPort) {
            return res.status(400).json({ success: false, error: { message: 'Missing SMTP/IMAP credentials' } });
        }
        // Verify SMTP connection
        const transporter = nodemailer_1.default.createTransport({
            host,
            port: parseInt(port, 10),
            secure: secure === 'true' || secure === true,
            auth: {
                user,
                pass: password,
            },
        });
        await transporter.verify();
        // Verify IMAP connection
        const imapClient = new imapflow_1.ImapFlow({
            host: imapHost,
            port: parseInt(imapPort, 10),
            secure: imapSecure === 'true' || imapSecure === true,
            auth: {
                user,
                pass: password
            },
            logger: false
        });
        await imapClient.connect();
        await imapClient.logout();
        // If successful, save to database
        // For MVP, saving credentials as JSON. In production, passwords MUST be encrypted via KMS.
        const credentials = (0, credentials_1.encryptJson)({ host, port, user, password, secure, imapHost, imapPort, imapSecure });
        // Check if email integration already exists
        const { data: existing } = await supabase_1.supabaseAdmin
            .from('integrations')
            .select('id')
            .eq('tenant_id', tenantId)
            .eq('provider', 'email')
            .single();
        if (existing) {
            // Update
            const { error } = await supabase_1.supabaseAdmin
                .from('integrations')
                .update({ credentials, status: 'active' })
                .eq('id', existing.id);
            if (error)
                throw error;
        }
        else {
            // Insert
            const { error } = await supabase_1.supabaseAdmin
                .from('integrations')
                .insert({
                tenant_id: tenantId,
                provider: 'email',
                status: 'active',
                credentials,
            });
            if (error)
                throw error;
        }
        return res.status(200).json({ success: true });
    }
    catch (error) {
        return res.status(400).json({ success: false, error: { message: 'Verification Failed: ' + error.message } });
    }
};
exports.connectEmail = connectEmail;
