import assert from 'node:assert/strict';
import test from 'node:test';
import { DefaultSmsCompliance } from '../src/modules/campaigns/sms-compliance';

test('DLT profile requires TRAI identifiers', () => {
  const adapter = new DefaultSmsCompliance();
  const result = adapter.validate({ region: 'IN', registrationStatus: 'verified' }, 'hello');
  assert.deepEqual(result.errors, ['TRAI/DLT principal entity ID is required', 'DLT sender ID is required', 'DLT template ID is required']);
});

test('non-Indian verified profile has no DLT headers', () => {
  const adapter = new DefaultSmsCompliance();
  assert.deepEqual(adapter.headers({ region: 'US', registrationStatus: 'verified' }), {});
});
