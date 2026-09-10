import { IntegrationEngine } from '../../integrations/integrations.engine';

const apiBase = () => process.env.LINKEDIN_API_BASE_URL || 'https://api.linkedin.com';

export class LinkedInProvider {
  static authorizationUrl(redirectUri: string, state: string): string {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    if (!clientId) throw new Error('LINKEDIN_CLIENT_ID is not configured');
    const scopes = process.env.LINKEDIN_SCOPES || 'openid profile email w_member_social';
    return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${encodeURIComponent(state)}`;
  }

  static async exchangeCode(code: string, redirectUri: string) {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const secret = process.env.LINKEDIN_CLIENT_SECRET;
    if (!clientId || !secret) throw new Error('LinkedIn OAuth is not configured');
    const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'authorization_code', code, client_id: clientId, client_secret: secret, redirect_uri: redirectUri })
    });
    const data = await response.json() as any;
    if (!response.ok || !data.access_token) throw new Error(`LinkedIn token exchange failed: ${data.error_description || response.statusText}`);
    const me = await this.request('/v2/userinfo', data.access_token);
    return { accessToken: data.access_token, expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString(), externalAccountId: me.sub, metadata: me };
  }

  static async publish(accessToken: string, authorUrn: string, text: string) {
    if (!authorUrn || !text.trim()) throw new Error('LinkedIn author and content are required');
    return this.request('/rest/posts', accessToken, { method: 'POST', headers: { 'LinkedIn-Version': process.env.LINKEDIN_VERSION || '202506', 'X-Restli-Protocol-Version': '2.0.0' }, body: JSON.stringify({ author: authorUrn, commentary: text, visibility: 'PUBLIC', distribution: { feedDistribution: 'MAIN_FEED' }, lifecycleState: 'PUBLISHED' }) });
  }

  private static async request(path: string, token: string, init: RequestInit = {}) {
    const response = await fetch(`${apiBase()}${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers || {}) } });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(`LinkedIn API request failed (${response.status})`);
    return data;
  }
}
