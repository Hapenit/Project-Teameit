"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUPPORTED_OAUTH_PROVIDERS = void 0;
exports.isSupportedOAuthProvider = isSupportedOAuthProvider;
/**
 * Providers for which OAuth authorization and token exchange are implemented.
 * Keep this registry in sync with the integrations UI; non-OAuth integrations
 * (such as SMTP) must not be added here.
 */
exports.SUPPORTED_OAUTH_PROVIDERS = [
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
];
function isSupportedOAuthProvider(provider) {
    return exports.SUPPORTED_OAUTH_PROVIDERS.includes(provider);
}
