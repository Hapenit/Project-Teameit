import assert from 'node:assert/strict';
import test from 'node:test';
import { matchIdentity } from '../src/modules/crm/identity-matcher';
test('identity matcher only returns unique exact matches', () => {
  assert.deepEqual(matchIdentity({ contactId: 'new', email: 'A@EXAMPLE.COM' }, [{ contactId: '1', email: 'a@example.com' }]), { contactId: '1', confidence: 'high', reason: 'email' });
  assert.equal(matchIdentity({ contactId: 'new', phone: '+1 555' }, [{ contactId: '1', phone: '+1555' }, { contactId: '2', phone: '+1555' }]), null);
});
