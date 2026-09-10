import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MetaAdsProvider, MetaAdsProviderError } from '../src/modules/providers/meta/meta-ads.provider';

test('Meta Ads rejects malformed resource ids before API calls', () => {
  assert.throws(
    () => MetaAdsProvider.update('tenant-1', '123', 'bad-id', {}),
    (error: any) => {
      assert.equal(error.status, 400);
      assert.match(error.message, /Invalid resource id/);
      return true;
    }
  );
});

test('Meta Ads provider errors carry an actionable provider and HTTP status', () => {
  const error = new MetaAdsProviderError(403, 'permission denied', 'OAuthException');
  assert.equal(error.status, 403);
  assert.equal(error.code, 'OAuthException');
  assert.match(error.message, /^meta_ads:/);
});
