/**
 * Central API configuration.
 * Set VITE_API_URL in your .env file for production.
 * Defaults to http://localhost:3001 for local development.
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Helper to make authenticated API calls with the tenant context header.
 */
export async function apiRequest(
  path: string,
  options: RequestInit = {},
  authToken?: string,
  tenantId?: string
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (authToken) {
    headers['Authorization'] = 'Bearer ' + authToken;
  }

  if (tenantId) {
    headers['x-tenant-id'] = tenantId;
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
}
