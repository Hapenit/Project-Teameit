import assert from 'node:assert/strict';
import { test } from 'node:test';
import jwt from 'jsonwebtoken';
import { requireAuth } from '../src/middleware/auth';
import { requirePermission } from '../src/middleware/rbac';
import { supabaseAdmin } from '../src/config/supabase';
import { PublishingEngine, PublishingValidationError, validateCreatePost } from '../src/modules/publishing/publishing.engine';
import { publishPost } from '../src/modules/publishing/publishing.controller';
import { launchCampaign } from '../src/modules/campaigns/campaign.controller';
import { CampaignEngine } from '../src/modules/campaigns/campaign.engine';
import { handleWhatsAppWebhook } from '../src/modules/webhooks/webhooks.controller';

const response = () => {
  const result: any = { statusCode: 200, body: undefined };
  result.status = (code: number) => { result.statusCode = code; return result; };
  result.json = (body: unknown) => { result.body = body; return result; };
  result.send = (body: unknown) => { result.body = body; return result; };
  result.sendStatus = (code: number) => { result.statusCode = code; return result; };
  return result;
};

test('auth rejects missing and invalid tokens, and accepts a valid token', () => {
  process.env.JWT_SECRET = 'test-secret';
  const req: any = { headers: {} };
  const missing = response();
  requireAuth(req, missing, () => {});
  assert.equal(missing.statusCode, 401);

  const invalid = response();
  requireAuth({ headers: { authorization: 'Bearer bad' } } as any, invalid, () => {});
  assert.equal(invalid.statusCode, 401);

  const next = { called: false };
  const validReq: any = { headers: { authorization: `Bearer ${jwt.sign({ sub: 'user-1' }, 'test-secret')}` } };
  requireAuth(validReq, response(), () => { next.called = true; });
  assert.equal(next.called, true);
  assert.equal(validReq.user.sub, 'user-1');
});

test('RBAC resolves an unambiguous membership and denies users outside a tenant', async () => {
  const middleware = requirePermission('publishing', 'create');
  const token = jwt.sign({ sub: 'user-1' }, 'test-secret');
  const missingTenant = response();
  await middleware({ headers: { authorization: `Bearer ${token}` } } as any, missingTenant, () => {});
  // The test database has exactly one membership for user-1, so the middleware
  // derives that tenant server-side instead of requiring a client header.
  assert.equal(missingTenant.statusCode, 200);

  const originalFrom = (supabaseAdmin as any).from;
  (supabaseAdmin as any).from = () => ({
    select: () => ({
      eq: (field: string, value: string) => {
        if (field === 'user_id') return { data: [], error: null };
        return {
          eq: () => ({
            single: async () => ({ data: null, error: new Error('not a member') })
          })
        };
      }
    })
  });
  const forbidden = response();
  await middleware({ headers: { authorization: `Bearer ${token}`, 'x-tenant-id': 'other-tenant' } } as any, forbidden, () => {});
  (supabaseAdmin as any).from = originalFrom;
  assert.equal(forbidden.statusCode, 403);
});

test('publishing validation rejects invalid input and post lookup is tenant-scoped', async () => {
  assert.throws(() => validateCreatePost({
    tenantId: 'tenant-1', authorId: 'user-1', content: 'hello', platforms: ['twitter']
  }), (error: unknown) => error instanceof PublishingValidationError && error.code === 'INVALID_POST');

  const calls: string[][] = [];
  const originalFrom = (supabaseAdmin as any).from;
  (supabaseAdmin as any).from = () => ({
    select: () => ({
      eq: (field: string, value: string) => {
        calls.push([field, value]);
        return { eq: (nextField: string, nextValue: string) => {
          calls.push([nextField, nextValue]);
          return { single: async () => ({ data: null, error: new Error('missing') }) };
        }};
      }
    })
  });
  await assert.rejects(() => PublishingEngine.getPost('post-1', 'tenant-1'), PublishingValidationError);
  (supabaseAdmin as any).from = originalFrom;
  assert.deepEqual(calls, [['id', 'post-1'], ['tenant_id', 'tenant-1']]);
});

test('publishing returns validation status and campaign failures return 400', async () => {
  const publishResponse = response();
  (PublishingEngine as any).getPost = async () => ({ status: 'published', platforms: [], content: '' });
  await publishPost({ headers: { 'x-tenant-id': 'tenant-1' }, params: { id: 'post-1' } } as any, publishResponse);
  assert.equal(publishResponse.statusCode, 422);
  assert.equal(publishResponse.body.error.code, 'INVALID_POST');

  const originalLaunch = (CampaignEngine as any).launchCampaign;
  (CampaignEngine as any).launchCampaign = async () => { throw new Error('audience unavailable'); };
  const campaignResponse = response();
  await launchCampaign({ headers: { 'x-tenant-id': 'tenant-1' }, body: {} } as any, campaignResponse);
  (CampaignEngine as any).launchCampaign = originalLaunch;
  assert.equal(campaignResponse.statusCode, 400);
  assert.equal(campaignResponse.body.error.message, 'audience unavailable');
});

test('webhook signature verification fails closed when unconfigured or invalid', async () => {
  delete process.env.META_APP_SECRET;
  const unconfigured = response();
  await handleWhatsAppWebhook({ headers: {}, body: {} } as any, unconfigured);
  assert.equal(unconfigured.statusCode, 500);

  process.env.META_APP_SECRET = 'secret';
  const invalid = response();
  await handleWhatsAppWebhook({ headers: { 'x-hub-signature-256': 'sha256=invalid' }, body: {} } as any, invalid);
  assert.equal(invalid.statusCode, 403);
});
