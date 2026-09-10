"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleFacebookWebhook = exports.verifyFacebookWebhook = exports.handleInstagramWebhook = exports.verifyInstagramWebhook = exports.handleWhatsAppWebhook = exports.verifyWhatsAppWebhook = void 0;
const whatsapp_provider_1 = require("../providers/whatsapp/whatsapp.provider");
const instagram_provider_1 = require("../providers/instagram/instagram.provider");
const facebook_provider_1 = require("../providers/facebook/facebook.provider");
const supabase_1 = require("../../config/supabase");
const crypto = __importStar(require("crypto"));
/**
 * Verifies the X-Hub-Signature-256 header from Meta webhook payloads.
 * This prevents spoofed webhook requests from being processed.
 */
function verifyMetaSignature(req, appSecret) {
    const signature = req.headers['x-hub-signature-256'];
    if (!signature)
        return false;
    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));
    const expectedSig = 'sha256=' + crypto
        .createHmac('sha256', appSecret)
        .update(rawBody)
        .digest('hex');
    try {
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));
    }
    catch {
        return false;
    }
}
// GET /api/v1/webhooks/whatsapp
// Required by Meta to verify the webhook URL
const verifyWhatsAppWebhook = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    // In production, this token should be checked against an env variable
    const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN;
    if (mode === 'subscribe' && !!verifyToken && token === verifyToken) {
        return res.status(200).send(challenge);
    }
    else {
        return res.sendStatus(403);
    }
};
exports.verifyWhatsAppWebhook = verifyWhatsAppWebhook;
// POST /api/v1/webhooks/whatsapp
const handleWhatsAppWebhook = async (req, res) => {
    try {
        // Verify Meta signature before processing
        const appSecret = process.env.META_APP_SECRET || '';
        if (!appSecret) {
            return res.status(500).json({ error: 'Webhook verification is not configured' });
        }
        if (!verifyMetaSignature(req, appSecret)) {
            return res.status(403).json({ error: 'Invalid webhook signature' });
        }
        const payload = req.body;
        // Webhooks from Meta don't contain our tenant ID directly in the header.
        // In a real multi-tenant app, you either use different webhook URLs per tenant (e.g. /webhooks/whatsapp/:tenantId)
        // or map the incoming `display_phone_number` or WABA ID to the correct tenant via the integration_credentials table.
        // For this demonstration, we'll extract the phone number the message was sent TO,
        // and find which tenant owns it.
        const value = payload.entry?.[0]?.changes?.[0]?.value;
        const phoneNumberId = value?.metadata?.phone_number_id;
        const wabaId = payload.entry?.[0]?.id;
        if (!phoneNumberId && !wabaId) {
            return res.status(200).send('EVENT_RECEIVED'); // Meta requires a 200 OK fast
        }
        // Find the tenant that owns this WhatsApp number
        const { data: credentials, error } = await supabase_1.supabaseAdmin.from('integration_credentials')
            .select('external_account_id,metadata,integrations!inner(tenant_id,provider)')
            .eq('integrations.provider', 'whatsapp');
        const cred = (credentials || []).find((row) => row.external_account_id === wabaId ||
            [row.metadata?.phone_number_id, row.metadata?.phoneNumberId, row.metadata?.whatsappPhoneNumberId].includes(phoneNumberId));
        if (!error && cred && cred.integrations) {
            const tenantId = cred.integrations.tenant_id;
            // Process asynchronously so we can return 200 OK to Meta immediately
            whatsapp_provider_1.WhatsAppProvider.processWebhook(tenantId, payload).catch(err => {
                console.error('Failed to process WhatsApp Webhook async:', err);
            });
        }
        else {
            console.warn(`Received webhook for unknown WhatsApp account: ${wabaId || phoneNumberId}`);
        }
        return res.status(200).send('EVENT_RECEIVED');
    }
    catch (error) {
        console.error('Webhook error:', error);
        return res.status(500).send('Internal Server Error');
    }
};
exports.handleWhatsAppWebhook = handleWhatsAppWebhook;
// GET /api/v1/webhooks/instagram
const verifyInstagramWebhook = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === process.env.INSTAGRAM_VERIFY_TOKEN) {
        return res.status(200).send(challenge);
    }
    else {
        return res.sendStatus(403);
    }
};
exports.verifyInstagramWebhook = verifyInstagramWebhook;
// POST /api/v1/webhooks/instagram
const handleInstagramWebhook = async (req, res) => {
    try {
        // Verify Meta signature before processing
        const appSecret = process.env.META_APP_SECRET || '';
        if (!appSecret) {
            return res.status(500).json({ error: 'Webhook verification is not configured' });
        }
        if (!verifyMetaSignature(req, appSecret)) {
            return res.status(403).json({ error: 'Invalid webhook signature' });
        }
        const payload = req.body;
        // Like WhatsApp, we extract the recipient ID (our connected Instagram Account ID)
        let pageId = null;
        if (payload.entry?.[0]?.id) {
            pageId = payload.entry[0].id;
        }
        if (!pageId) {
            return res.status(200).send('EVENT_RECEIVED');
        }
        // Find the tenant that owns this Instagram page
        const { data: cred, error } = await supabase_1.supabaseAdmin
            .from('integration_credentials')
            .select('integrations(tenant_id)')
            .eq('external_account_id', pageId)
            .eq('integrations.provider', 'instagram')
            .single();
        if (!error && cred && cred.integrations) {
            const tenantId = cred.integrations.tenant_id;
            instagram_provider_1.InstagramProvider.processWebhook(tenantId, payload).catch(err => {
                console.error('Failed to process Instagram Webhook async:', err);
            });
        }
        else {
            console.warn(`Received IG webhook for unknown page: ${pageId}`);
        }
        return res.status(200).send('EVENT_RECEIVED');
    }
    catch (error) {
        console.error('IG Webhook error:', error);
        return res.status(500).send('Internal Server Error');
    }
};
exports.handleInstagramWebhook = handleInstagramWebhook;
// GET /api/v1/webhooks/facebook
const verifyFacebookWebhook = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === process.env.FACEBOOK_VERIFY_TOKEN) {
        return res.status(200).send(challenge);
    }
    else {
        return res.sendStatus(403);
    }
};
exports.verifyFacebookWebhook = verifyFacebookWebhook;
// POST /api/v1/webhooks/facebook
const handleFacebookWebhook = async (req, res) => {
    try {
        // Verify Meta signature before processing
        const appSecret = process.env.META_APP_SECRET || '';
        if (!appSecret) {
            return res.status(500).json({ error: 'Webhook verification is not configured' });
        }
        if (!verifyMetaSignature(req, appSecret)) {
            return res.status(403).json({ error: 'Invalid webhook signature' });
        }
        const payload = req.body;
        // Like IG, we extract the recipient ID (our connected FB Page ID)
        let pageId = null;
        if (payload.entry?.[0]?.id) {
            pageId = payload.entry[0].id;
        }
        if (!pageId) {
            return res.status(200).send('EVENT_RECEIVED');
        }
        // Find the tenant that owns this Facebook page
        const { data: cred, error } = await supabase_1.supabaseAdmin
            .from('integration_credentials')
            .select('integrations(tenant_id)')
            .eq('external_account_id', pageId)
            .eq('integrations.provider', 'facebook')
            .single();
        if (!error && cred && cred.integrations) {
            const tenantId = cred.integrations.tenant_id;
            facebook_provider_1.FacebookProvider.processWebhook(tenantId, payload).catch(err => {
                console.error('Failed to process Facebook Webhook async:', err);
            });
        }
        else {
            console.warn(`Received FB webhook for unknown page: ${pageId}`);
        }
        return res.status(200).send('EVENT_RECEIVED');
    }
    catch (error) {
        console.error('FB Webhook error:', error);
        return res.status(500).send('Internal Server Error');
    }
};
exports.handleFacebookWebhook = handleFacebookWebhook;
