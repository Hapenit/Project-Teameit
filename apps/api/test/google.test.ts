import assert from 'node:assert/strict';
import { test } from 'node:test';
import { GoogleProviderAdapter, GoogleProviderError } from '../src/modules/integrations/providers/google.provider';
import { supabaseAdmin } from '../src/config/supabase';
import { googleAdsQuery } from '../src/modules/integrations/google.controller';

test('Google adapter scopes credential lookup to tenant and provider', async () => {
  const calls: string[][] = [];
  const original = (supabaseAdmin as any).from;
  (supabaseAdmin as any).from = (table: string) => {
    assert.equal(table, 'integrations');
    const chain: any = {
      select: () => chain,
      eq: (field: string, value: string) => { calls.push([field, value]); return chain; },
      maybeSingle: async () => ({ data: { integration_credentials: [{ access_token: 'token' }] }, error: null })
    };
    return chain;
  };
  await GoogleProviderAdapter.credentials('tenant-a', 'google_analytics');
  (supabaseAdmin as any).from = original;
  assert.deepEqual(calls, [['tenant_id', 'tenant-a'], ['provider', 'google_analytics'], ['status', 'active']]);
});

test('Google adapter surfaces provider HTTP failures without claiming success', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({ error: { message: 'insufficient permission' } }), { status: 403 })) as any;
  await assert.rejects(
    () => GoogleProviderAdapter.request('youtube', 'https://example.invalid', 'token'),
    (error: any) => error instanceof GoogleProviderError && error.status === 403 && /insufficient permission/.test(error.message)
  );
  globalThis.fetch = originalFetch;
});

test('Ads management rejects mutation-like queries instead of reporting fake success', async () => {
  const response: any = { statusCode: 200, status(n: number) { this.statusCode = n; return this; }, json(body: any) { this.body = body; return this; } };
  await googleAdsQuery({ body: { customerId: '123', query: 'UPDATE campaign SET status=ENABLED' }, headers: { 'x-tenant-id': 'tenant-a' } } as any, response);
  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error.code, 'INVALID_REQUEST');
});
