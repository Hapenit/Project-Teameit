import { Request, Response } from 'express';
import { WhatsAppProvider } from '../providers/whatsapp/whatsapp.provider';
import { InstagramProvider } from '../providers/instagram/instagram.provider';
import { FacebookProvider } from '../providers/facebook/facebook.provider';
import { supabaseAdmin } from '../../config/supabase';
import * as crypto from 'crypto';

/**
 * Verifies the X-Hub-Signature-256 header from Meta webhook payloads.
 * This prevents spoofed webhook requests from being processed.
 */
function verifyMetaSignature(req: Request, appSecret: string): boolean {
  const signature = req.headers['x-hub-signature-256'] as string;
  if (!signature) return false;

  const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));
  const expectedSig = 'sha256=' + crypto
    .createHmac('sha256', appSecret)
    .update(rawBody)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSig)
    );
  } catch {
    return false;
  }
}


// GET /api/v1/webhooks/whatsapp
// Required by Meta to verify the webhook URL
export const verifyWhatsAppWebhook = (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // In production, this token should be checked against an env variable
  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN;
  if (mode === 'subscribe' && !!verifyToken && token === verifyToken) {
    return res.status(200).send(challenge);
  } else {
    return res.sendStatus(403);
  }
};

// POST /api/v1/webhooks/whatsapp
export const handleWhatsAppWebhook = async (req: Request, res: Response) => {
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
    const { data: credentials, error } = await supabaseAdmin.from('integration_credentials')
      .select('external_account_id,metadata,integrations!inner(tenant_id,provider)')
      .eq('integrations.provider', 'whatsapp');
    const cred: any = (credentials || []).find((row: any) =>
      row.external_account_id === wabaId ||
      [row.metadata?.phone_number_id, row.metadata?.phoneNumberId, row.metadata?.whatsappPhoneNumberId].includes(phoneNumberId)
    );

    if (!error && cred && cred.integrations) {
      const tenantId = (cred.integrations as any).tenant_id;
      // Process asynchronously so we can return 200 OK to Meta immediately
      WhatsAppProvider.processWebhook(tenantId, payload).catch(err => {
        console.error('Failed to process WhatsApp Webhook async:', err);
      });
    } else {
      console.warn(`Received webhook for unknown WhatsApp account: ${wabaId || phoneNumberId}`);
    }

    return res.status(200).send('EVENT_RECEIVED');
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).send('Internal Server Error');
  }
};

// GET /api/v1/webhooks/instagram
export const verifyInstagramWebhook = (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.INSTAGRAM_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  } else {
    return res.sendStatus(403);
  }
};

// POST /api/v1/webhooks/instagram
export const handleInstagramWebhook = async (req: Request, res: Response) => {
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
    const { data: cred, error } = await supabaseAdmin
      .from('integration_credentials')
      .select('integrations(tenant_id)')
      .eq('external_account_id', pageId)
      .eq('integrations.provider', 'instagram')
      .single();

    if (!error && cred && cred.integrations) {
      const tenantId = (cred.integrations as any).tenant_id;
      InstagramProvider.processWebhook(tenantId, payload).catch(err => {
        console.error('Failed to process Instagram Webhook async:', err);
      });
    } else {
      console.warn(`Received IG webhook for unknown page: ${pageId}`);
    }

    return res.status(200).send('EVENT_RECEIVED');
  } catch (error) {
    console.error('IG Webhook error:', error);
    return res.status(500).send('Internal Server Error');
  }
};

// GET /api/v1/webhooks/facebook
export const verifyFacebookWebhook = (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.FACEBOOK_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  } else {
    return res.sendStatus(403);
  }
};

// POST /api/v1/webhooks/facebook
export const handleFacebookWebhook = async (req: Request, res: Response) => {
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
    const { data: cred, error } = await supabaseAdmin
      .from('integration_credentials')
      .select('integrations(tenant_id)')
      .eq('external_account_id', pageId)
      .eq('integrations.provider', 'facebook')
      .single();

    if (!error && cred && cred.integrations) {
      const tenantId = (cred.integrations as any).tenant_id;
      FacebookProvider.processWebhook(tenantId, payload).catch(err => {
        console.error('Failed to process Facebook Webhook async:', err);
      });
    } else {
      console.warn(`Received FB webhook for unknown page: ${pageId}`);
    }

    return res.status(200).send('EVENT_RECEIVED');
  } catch (error) {
    console.error('FB Webhook error:', error);
    return res.status(500).send('Internal Server Error');
  }
};
