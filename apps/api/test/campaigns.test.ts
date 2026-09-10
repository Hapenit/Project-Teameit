import assert from 'node:assert/strict';
import test from 'node:test';
import { renderTemplate } from '../src/modules/campaigns/campaign.engine';

test('campaign templates render nested contact variables and never emit undefined', () => {
  assert.equal(renderTemplate('Hi {{first_name}} {{company.name}} {{missing}}', {
    first_name: 'Ada', company: { name: 'Example' }
  }), 'Hi Ada Example ');
});

test('campaign templates support whitespace around variables', () => {
  assert.equal(renderTemplate('{{ first_name }}', { first_name: 'Grace' }), 'Grace');
});
