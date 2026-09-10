/**
 * Providers for which OAuth authorization and token exchange are implemented.
 * Keep this registry in sync with the integrations UI; non-OAuth integrations
 * (such as SMTP) must not be added here.
 */
export const SUPPORTED_OAUTH_PROVIDERS = [
  'meta',
  'meta_ads',
  'facebook',
  'instagram',
  'whatsapp',
  'google',
  'google_ads',
  'google_analytics',
  'google_search_console',
  'google_business',
  'google_adsense',
  'youtube',
  'linkedin'
] as const;

export type SupportedOAuthProvider = typeof SUPPORTED_OAUTH_PROVIDERS[number];

export function isSupportedOAuthProvider(provider: string): provider is SupportedOAuthProvider {
  return (SUPPORTED_OAUTH_PROVIDERS as readonly string[]).includes(provider);
}
