import { Request, Response } from 'express';
import { supabaseAdmin } from '../../config/supabase';
import nodemailer from 'nodemailer';
import { ImapFlow } from 'imapflow';
import { OAuthService } from './oauth.service';
import { IntegrationEngine } from './integrations.engine';
import { encryptJson } from '../../security/credentials';
import { WhatsAppProvider } from '../providers/whatsapp/whatsapp.provider';

export const getIntegrations = async (req: Request, res: Response) => {
  try {
    const tenantId = (req.tenantId || req.headers['x-tenant-id']) as string;
    const { data, error } = await supabaseAdmin
      .from('integrations')
      .select('id, provider, status, created_at, integration_credentials(metadata,provider_account_status,last_verified_at)')
      .eq('tenant_id', tenantId);

    if (error) throw error;
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: { message: error.message } });
  }
};

export const getAuthUrl = async (req: Request, res: Response) => {
  try {
    const tenantId = (req.tenantId || req.headers['x-tenant-id']) as string;
    const { provider } = req.query;
    if (!provider) throw new Error('Provider is required');

    const url = await OAuthService.generateAuthUrl(tenantId, provider as string);
    return res.status(200).json({ success: true, data: { url } });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: { message: error.message } });
  }
};

export const handleOAuthCallback = async (req: Request, res: Response) => {
  try {
    const { code, state } = req.body;
    if (!code || !state) throw new Error('Missing code or state');

    const result = await OAuthService.handleCallback(code, state);
    return res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: { message: error.message } });
  }
};

export const redirectOAuthCallback = (req: Request, res: Response) => {
  const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';
  const callbackUrl = new URL('/integrations/callback', frontendBase);
  // Preserve provider failures for the UI; never exchange an error response.

  for (const key of ['code', 'state', 'error', 'error_description']) {
    const value = req.query[key];
    if (typeof value === 'string') callbackUrl.searchParams.set(key, value);
  }

  return res.redirect(callbackUrl.toString());
};

export const disconnectIntegration = async (req: Request, res: Response) => {
  try {
    const tenantId = (req.tenantId || req.headers['x-tenant-id']) as string;
    const { provider } = req.params;
    
    await OAuthService.disconnect(tenantId, provider);
    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: { message: error.message } });
  }
};

export const syncAnalytics = async (req: Request, res: Response) => {
  try {
    const tenantId = (req.tenantId || req.headers['x-tenant-id']) as string;
    if (!tenantId) throw new Error('x-tenant-id header is required');
    const until = typeof req.body?.until === 'string' ? req.body.until : new Date().toISOString().slice(0, 10);
    const since = typeof req.body?.since === 'string' ? req.body.since : new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    return res.status(200).json({ success: true, data: await IntegrationEngine.syncAnalytics(tenantId, req.params.provider, since, until) });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: { message: error.message } });
  }
};

export const whatsappStatus = async (req: Request, res: Response) => {
  try {
    const tenantId = (req.tenantId || req.headers['x-tenant-id']) as string;
    if (!tenantId) throw new Error('x-tenant-id header is required');
    return res.json({ success: true, data: await WhatsAppProvider.getStatus(tenantId) });
  } catch (error: any) {
    return res.status(error.code === 'NOT_CONNECTED' ? 404 : 400).json({ success: false, error: { code: error.code || 'WHATSAPP_ERROR', message: error.message } });
  }
};

export const whatsappTemplates = async (req: Request, res: Response) => {
  try {
    const tenantId = (req.tenantId || req.headers['x-tenant-id']) as string;
    if (!tenantId) throw new Error('x-tenant-id header is required');
    return res.json({ success: true, data: await WhatsAppProvider.listTemplates(tenantId) });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: { code: error.code || 'WHATSAPP_ERROR', message: error.message } });
  }
};
export const whatsappTemplateStatus = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || req.headers['x-tenant-id'] as string;
    return res.json({ success: true, data: await WhatsAppProvider.templateStatus(tenantId, req.params.name, req.query.language as string) });
  } catch (error: any) { return res.status(400).json({ success: false, error: { code: error.code, message: error.message } }); }
};
export const whatsappTemplateVariables = (req: Request, res: Response) =>
  res.json({ success: true, data: WhatsAppProvider.extractVariables(req.body) });

export const whatsappTemplateCreate = async (req: Request, res: Response) => {
  try { const tenantId = req.headers['x-tenant-id'] as string; return res.status(201).json({ success: true, data: await WhatsAppProvider.createTemplate(tenantId, req.body) }); }
  catch (error: any) { return res.status(error.retryable ? 503 : 400).json({ success: false, error: { code: error.code, message: error.message } }); }
};
export const whatsappTemplateUpdate = async (req: Request, res: Response) => {
  try { const tenantId = req.headers['x-tenant-id'] as string; return res.json({ success: true, data: await WhatsAppProvider.updateTemplate(tenantId, req.params.id, req.body) }); }
  catch (error: any) { return res.status(error.retryable ? 503 : 400).json({ success: false, error: { code: error.code, message: error.message } }); }
};
export const whatsappTemplateDelete = async (req: Request, res: Response) => {
  try { const tenantId = req.headers['x-tenant-id'] as string; return res.json({ success: true, data: await WhatsAppProvider.deleteTemplate(tenantId, req.params.name, req.query.language as string) }); }
  catch (error: any) { return res.status(error.retryable ? 503 : 400).json({ success: false, error: { code: error.code, message: error.message } }); }
};
export const whatsappCatalog = async (req: Request, res: Response) => {
  try { const tenantId = req.headers['x-tenant-id'] as string; return res.json({ success: true, data: await WhatsAppProvider.listCatalogProducts(tenantId, req.query.catalogId as string) }); }
  catch (error: any) { return res.status(error.retryable ? 503 : 400).json({ success: false, error: { code: error.code, message: error.message } }); }
};
export const whatsappCatalogSync = async (req: Request, res: Response) => {
  try { const tenantId = req.headers['x-tenant-id'] as string; return res.json({ success: true, data: await WhatsAppProvider.syncCatalog(tenantId, req.body?.catalogId) }); }
  catch (error: any) { return res.status(error.retryable ? 503 : 400).json({ success: false, error: { code: error.code, message: error.message } }); }
};
export const whatsappProductShare = async (req: Request, res: Response) => {
  try { const tenantId = req.headers['x-tenant-id'] as string; const { to, productId, catalogId, body } = req.body || {}; if (!to || !productId) throw new Error('to and productId are required'); return res.status(202).json({ success: true, data: await WhatsAppProvider.shareProduct(tenantId, to, productId, catalogId, body) }); }
  catch (error: any) { return res.status(error.retryable ? 503 : 400).json({ success: false, error: { code: error.code, message: error.message } }); }
};
export const whatsappProductCreate = async (req: Request, res: Response) => {
  try { const tenantId = req.tenantId || req.headers['x-tenant-id'] as string; return res.status(201).json({ success: true, data: await WhatsAppProvider.createCatalogProduct(tenantId, req.body, req.body?.catalogId) }); }
  catch (error: any) { return res.status(error.retryable ? 503 : 400).json({ success: false, error: { code: error.code, message: error.message } }); }
};
export const whatsappProductUpdate = async (req: Request, res: Response) => {
  try { const tenantId = req.tenantId || req.headers['x-tenant-id'] as string; return res.json({ success: true, data: await WhatsAppProvider.updateCatalogProduct(tenantId, req.params.id, req.body, req.body?.catalogId) }); }
  catch (error: any) { return res.status(error.retryable ? 503 : 400).json({ success: false, error: { code: error.code, message: error.message } }); }
};
export const whatsappProductDelete = async (req: Request, res: Response) => {
  try { const tenantId = req.tenantId || req.headers['x-tenant-id'] as string; return res.json({ success: true, data: await WhatsAppProvider.deleteCatalogProduct(tenantId, req.params.id, req.query.catalogId as string) }); }
  catch (error: any) { return res.status(error.retryable ? 503 : 400).json({ success: false, error: { code: error.code, message: error.message } }); }
};

export const sendWhatsAppMessage = async (req: Request, res: Response) => {
  try {
    const tenantId = (req.tenantId || req.headers['x-tenant-id']) as string;
    const { to, type, ...body } = req.body || {};
    if (!tenantId || !to || !type) throw new Error('x-tenant-id, to and type are required');
    const result = await WhatsAppProvider.sendMessage(tenantId, to, { type, ...body } as any);
    return res.status(202).json({ success: true, data: result });
  } catch (error: any) {
    return res.status(error.retryable ? 503 : 400).json({ success: false, error: { code: error.code || 'WHATSAPP_ERROR', message: error.message, retryable: !!error.retryable } });
  }
};

export const connectEmail = async (req: Request, res: Response) => {
  try {
    const tenantId = (req.tenantId || req.headers['x-tenant-id']) as string;
    const { host, port, user, password, secure, imapHost, imapPort, imapSecure } = req.body;

    if (!host || !port || !user || !password || !imapHost || !imapPort) {
      return res.status(400).json({ success: false, error: { message: 'Missing SMTP/IMAP credentials' } });
    }

    // Verify SMTP connection
    const transporter = nodemailer.createTransport({
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
    const imapClient = new ImapFlow({
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
    const credentials = encryptJson({ host, port, user, password, secure, imapHost, imapPort, imapSecure });

    // Check if email integration already exists
    const { data: existing } = await supabaseAdmin
      .from('integrations')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('provider', 'email')
      .single();

    if (existing) {
      // Update
      const { error } = await supabaseAdmin
        .from('integrations')
        .update({ credentials, status: 'active' })
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      // Insert
      const { error } = await supabaseAdmin
        .from('integrations')
        .insert({
          tenant_id: tenantId,
          provider: 'email',
          status: 'active',
          credentials,
        });
      if (error) throw error;
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: { message: 'Verification Failed: ' + error.message } });
  }
};
