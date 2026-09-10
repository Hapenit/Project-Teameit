import { supabaseAdmin } from '../../config/supabase';
import * as crypto from 'crypto';
import { encryptSecret, decryptSecret } from '../../security/credentials';
import { isSupportedOAuthProvider } from './provider-registry';

const GOOGLE_PROVIDERS = ['google', 'google_ads', 'google_analytics', 'google_search_console', 'google_business', 'google_adsense', 'youtube'];

/**
 * Signs a state payload with HMAC-SHA256 to prevent CSRF.
 * State is base64url(payload) + '.' + HMAC(base64url(payload))
 */
function signState(payload: object): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const secret = process.env.OAUTH_STATE_SECRET;
  if (!secret) {
    throw new Error('OAUTH_STATE_SECRET is not configured');
  }
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${sig}`;
}

/**
 * Verifies and decodes a signed state parameter.
 */
function verifyState(stateParam: string): object {
  const parts = stateParam.split('.');

  const secret = process.env.OAUTH_STATE_SECRET;
  if (secret && parts.length === 2) {
    const [data, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
    if (sig.length !== expectedSig.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
      throw new Error('Invalid state signature — possible CSRF attack');
    }
    return JSON.parse(Buffer.from(data, 'base64url').toString('utf-8'));
  }

  throw new Error('Invalid OAuth state');
}

export class OAuthService {
  /**
   * Generates a provider-specific OAuth Authorization URL.
   *
   * IMPORTANT: The OAuth URLs below are configured for the REAL providers.
   * Replace the CLIENT_ID / REDIRECT_URI values with your actual app credentials.
   * Without real credentials, the OAuth flow will redirect to provider error pages.
   */
  static async generateAuthUrl(tenantId: string, provider: string): Promise<string> {
    if (!tenantId) throw new Error('Tenant context is required');
    if (!provider) throw new Error('Provider is required');
    if (!isSupportedOAuthProvider(provider)) {
      throw new Error(`Unsupported OAuth provider: ${provider}`);
    }
    const state = signState({
      tenantId,
      provider,
      nonce: crypto.randomBytes(16).toString('hex'),
      iat: Date.now()
    });
    const stateHash = crypto.createHash('sha256').update(state).digest('hex');
    const { error: stateError } = await supabaseAdmin.from('oauth_states').insert({
      tenant_id: tenantId, provider, state_hash: stateHash,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
    });
    if (stateError) throw new Error(`Unable to create OAuth state: ${stateError.message}`);

    const callbackBase = process.env.API_BASE_URL || 'http://localhost:3001';
    const redirectUri = `${callbackBase}/api/v1/integrations/${provider}/oauth/callback`;
    const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';

    switch (provider) {
      case 'meta':
      case 'meta_ads':
      case 'facebook':
      case 'instagram':
      case 'whatsapp': {
        const metaAppId = process.env.META_APP_ID;
        if (!metaAppId) throw new Error('META_APP_ID is not configured. Please add it to your .env file.');

        const scopes = [
          'email',
          'pages_show_list',
          'pages_messaging',
          'instagram_basic',
          'instagram_manage_messages',
          'whatsapp_business_management',
          'whatsapp_business_messaging',
          'business_management'
          ,'ads_read',
          'ads_management'
        ].join(',');

        return `https://www.facebook.com/v21.0/dialog/oauth?client_id=${metaAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${state}&response_type=code`;
      }

      case 'google':
      case 'google_ads':
      case 'google_analytics':
      case 'google_search_console':
      case 'google_business':
      case 'google_adsense':
      case 'youtube': {
        const googleClientId = process.env.GOOGLE_CLIENT_ID;
        if (!googleClientId) throw new Error('GOOGLE_CLIENT_ID is not configured. Please add it to your .env file.');

        const scopeMap: Record<string, string[]> = {
          google: ['openid', 'email', 'profile'],
          google_ads: ['https://www.googleapis.com/auth/adwords'],
          google_analytics: ['https://www.googleapis.com/auth/analytics.readonly'],
          google_search_console: ['https://www.googleapis.com/auth/webmasters.readonly'],
          google_business: ['https://www.googleapis.com/auth/business.manage'],
          google_adsense: ['https://www.googleapis.com/auth/adsense.readonly'],
          youtube: ['https://www.googleapis.com/auth/youtube.readonly']
        };
        const scopes = [...new Set(['openid', 'email', 'profile', ...(scopeMap[provider] || [])])].join(' ');

        return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${state}&response_type=code&access_type=offline&prompt=consent`;
      }

      case 'linkedin': {
        const clientId = process.env.LINKEDIN_CLIENT_ID;
        if (!clientId) throw new Error('LINKEDIN_CLIENT_ID is not configured. Please add it to your .env file.');
        const scopes = process.env.LINKEDIN_SCOPES || 'openid profile email w_member_social';
        return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${encodeURIComponent(state)}`;
      }

      default:
        throw new Error(`Unsupported OAuth provider: ${provider}`);
    }
  }

  /**
   * Exchanges the code for an access token and stores it.
   * Each provider has its own token endpoint and response format.
   */
  static async handleCallback(code: string, state: string) {
    if (!state || !code) throw new Error('Missing code or state parameter');

    const decoded = verifyState(state) as any;
    const { tenantId, provider, iat } = decoded;

    if (!tenantId || !provider) throw new Error('Invalid state parameter');
    if (!isSupportedOAuthProvider(provider)) {
      throw new Error(`Unsupported OAuth provider: ${provider}`);
    }

    // Reject states older than 10 minutes
    if (!Number.isFinite(iat) || iat > Date.now() + 30_000 || Date.now() - iat > 10 * 60 * 1000) {
      throw new Error('OAuth state has expired. Please try connecting again.');
    }
    const stateHash = crypto.createHash('sha256').update(state).digest('hex');
    const { data: consumed, error: consumeError } = await supabaseAdmin.from('oauth_states')
      .update({ consumed_at: new Date().toISOString() })
      .eq('state_hash', stateHash).eq('tenant_id', tenantId).eq('provider', provider)
      .is('consumed_at', null).gt('expires_at', new Date().toISOString())
      .select('id').maybeSingle();
    if (consumeError || !consumed) throw new Error('OAuth state is invalid, expired, or already used');

    // Exchange authorization code for tokens with the real provider
    let accessToken: string;
    let refreshToken: string | null = null;
    let externalAccountId: string;
    let expiresAt: string;
    let providerMetadata: any = null;

    const callbackBase = process.env.API_BASE_URL || 'http://localhost:3001';
    const redirectUri = `${callbackBase}/api/v1/integrations/${provider}/oauth/callback`;

    if (['meta', 'meta_ads', 'facebook', 'instagram', 'whatsapp'].includes(provider)) {
      const appId = process.env.META_APP_ID;
      const appSecret = process.env.META_APP_SECRET;
      if (!appId || !appSecret) throw new Error('META_APP_ID and META_APP_SECRET must be configured.');

      const tokenRes = await fetch(
        `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
      );
      const tokenData = await tokenRes.json() as any;
      if (tokenData.error) throw new Error(`Meta token exchange failed: ${tokenData.error.message}`);

      if (!tokenData.access_token) throw new Error('Meta token exchange returned no access token');
      accessToken = tokenData.access_token;
      expiresAt = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000).toISOString();

      // Get the user's Meta ID
      const meRes = await fetch(`https://graph.facebook.com/v21.0/me?access_token=${accessToken}`);
      const meData = await meRes.json() as any;
      if (!meData.id) throw new Error('Meta account lookup failed');
      externalAccountId = meData.id;

      // Resolve all assets granted by the user token. Asset IDs are retained so
      // webhook routing and reconnects never depend on a display name.
      const accountsRes = await fetch(`https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,instagram_business_account,whatsapp_business_account&access_token=${accessToken}`);
      const accountsData = await accountsRes.json() as any;
      if (!accountsRes.ok || accountsData.error) throw new Error(`Meta asset discovery failed: ${accountsData.error?.message || accountsRes.statusText}`);
      const assets = (accountsData.data || []).map((account: any) => ({
        id: account.id,
        name: account.name,
        accessToken: account.access_token,
        instagramBusinessAccountId: account.instagram_business_account?.id || null,
        whatsappBusinessAccountId: account.whatsapp_business_account?.id || null
      }));
      for (const asset of assets) {
        if (!asset.whatsappBusinessAccountId || !asset.accessToken) continue;
        const phonesRes = await fetch(`https://graph.facebook.com/v21.0/${asset.whatsappBusinessAccountId}/phone_numbers?fields=id,display_phone_number&access_token=${encodeURIComponent(asset.accessToken)}`);
        const phones = await phonesRes.json() as any;
        if (!phonesRes.ok || phones.error) throw new Error(`WhatsApp number discovery failed: ${phones.error?.message || phonesRes.statusText}`);
        asset.whatsappPhoneNumbers = (phones.data || []).map((phone: any) => ({ id: phone.id, displayPhoneNumber: phone.display_phone_number }));
      }
      providerMetadata = { assets };

    } else if (GOOGLE_PROVIDERS.includes(provider)) {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      if (!clientId || !clientSecret) throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be configured.');

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        })
      });
      const tokenData = await tokenRes.json() as any;
      if (!tokenRes.ok || tokenData.error || !tokenData.access_token) throw new Error(`Google token exchange failed: ${tokenData.error_description || tokenData.error || tokenRes.statusText}`);

      accessToken = tokenData.access_token;
      refreshToken = tokenData.refresh_token || null;
      expiresAt = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000).toISOString();

      // Get the user's Google sub as account ID
      const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const userinfo = await userinfoRes.json() as any;
      if (!userinfo.sub) throw new Error('Google account lookup failed');
      externalAccountId = userinfo.sub;

    } else if (provider === 'linkedin') {
      const clientId = process.env.LINKEDIN_CLIENT_ID;
      const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
      if (!clientId || !clientSecret) throw new Error('LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET must be configured.');
      const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'authorization_code', code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri })
      });
      const tokenData = await tokenRes.json() as any;
      if (!tokenRes.ok || !tokenData.access_token) throw new Error(`LinkedIn token exchange failed: ${tokenData.error_description || tokenRes.statusText}`);
      const meRes = await fetch('https://api.linkedin.com/v2/userinfo', { headers: { Authorization: `Bearer ${tokenData.access_token}` } });
      const me = await meRes.json() as any;
      if (!meRes.ok || !me.sub) throw new Error('LinkedIn account lookup failed');
      accessToken = tokenData.access_token;
      expiresAt = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000).toISOString();
      externalAccountId = me.sub;
      providerMetadata = me;
    } else {
      // Keep this guard exhaustive if the registry and exchange branches diverge.
      throw new Error(`Unsupported OAuth provider: ${provider}`);
    }

    // Upsert Integration record
    let { data: integration } = await supabaseAdmin
      .from('integrations')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('provider', provider)
      .single();

    if (!integration) {
      const { data: newIntegration, error: newIntError } = await supabaseAdmin
        .from('integrations')
        .insert({ tenant_id: tenantId, provider, status: 'active' })
        .select('id')
        .single();

      if (newIntError) throw new Error(`Failed to create integration: ${newIntError.message}`);
      integration = newIntegration;
    } else {
      await supabaseAdmin
        .from('integrations')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', integration.id);
    }

    // Delete old credentials and insert fresh ones
    // Preserve a refresh token when Google does not return one during reconnect.
    if (GOOGLE_PROVIDERS.includes(provider) && !refreshToken) {
      const { data: previous } = await supabaseAdmin.from('integration_credentials')
        .select('refresh_token').eq('integration_id', integration!.id).maybeSingle();
      refreshToken = decryptSecret(previous?.refresh_token) || null;
    }
    await supabaseAdmin
      .from('integration_credentials')
      .delete()
      .eq('integration_id', integration!.id);

    const { error: credError } = await supabaseAdmin
      .from('integration_credentials')
      .insert({
        integration_id: integration!.id,
        access_token: encryptSecret(accessToken),
        refresh_token: encryptSecret(refreshToken),
        external_account_id: externalAccountId,
        expires_at: expiresAt,
        metadata: providerMetadata
      });

    if (credError) throw new Error(`Failed to store credentials: ${credError.message}`);

    // A Meta user token is only a container. Persist each discovered asset as
    // its own integration so reconnects and webhook routing are deterministic.
    if (providerMetadata?.assets) {
      for (const asset of providerMetadata.assets) {
        const mappings: Array<[string, string | null]> = [
          ['facebook', asset.id],
          ['instagram', asset.instagramBusinessAccountId],
          ['whatsapp', asset.whatsappBusinessAccountId]
        ];
        for (const [assetProvider, assetId] of mappings) {
          if (!assetId) continue;
          const { data: child } = await supabaseAdmin.from('integrations')
            .upsert({ tenant_id: tenantId, provider: assetProvider, status: 'active', updated_at: new Date().toISOString() }, { onConflict: 'tenant_id,provider' })
            .select('id').single();
          if (!child) throw new Error(`Failed to map Meta ${assetProvider} account`);
          await supabaseAdmin.from('integration_credentials').delete().eq('integration_id', child.id);
          const { error } = await supabaseAdmin.from('integration_credentials').insert({
            integration_id: child.id,
            access_token: encryptSecret(asset.accessToken || accessToken),
            external_account_id: assetId,
            metadata: { parentProvider: 'meta', assetName: asset.name }
          });
          if (error) throw new Error(`Failed to store Meta ${assetProvider} credentials: ${error.message}`);
        }
        for (const phone of asset.whatsappPhoneNumbers || []) {
          const { data: child } = await supabaseAdmin.from('integrations')
            .upsert({ tenant_id: tenantId, provider: 'whatsapp', status: 'active', updated_at: new Date().toISOString() }, { onConflict: 'tenant_id,provider' })
            .select('id').single();
          if (!child) throw new Error('Failed to map WhatsApp number');
          await supabaseAdmin.from('integration_credentials').delete().eq('integration_id', child.id);
          const { error } = await supabaseAdmin.from('integration_credentials').insert({
            integration_id: child.id, access_token: encryptSecret(asset.accessToken || accessToken),
            external_account_id: asset.whatsappBusinessAccountId, metadata: { whatsappPhoneNumberId: phone.id, phone_number_id: phone.id, whatsappBusinessAccountId: asset.whatsappBusinessAccountId, waba_id: asset.whatsappBusinessAccountId, display_phone_number: phone.displayPhoneNumber }
          });
          if (error) throw new Error(`Failed to store WhatsApp number credentials: ${error.message}`);
        }
      }
    }

    return { success: true, provider, tenantId };
  }

  /**
   * Disconnects an integration and cleans up credentials
   */
  static async disconnect(tenantId: string, provider: string) {
    const { error } = await supabaseAdmin
      .from('integrations')
      .update({ status: 'disconnected', updated_at: new Date().toISOString() })
      .eq('tenant_id', tenantId)
      .eq('provider', provider);

    if (error) throw new Error(`Failed to disconnect: ${error.message}`);

    // Delete credentials on disconnect
    const { data: integration } = await supabaseAdmin
      .from('integrations')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('provider', provider)
      .single();

    if (integration) {
      await supabaseAdmin
        .from('integration_credentials')
        .delete()
        .eq('integration_id', integration.id);
    }

    return { success: true };
  }
}
