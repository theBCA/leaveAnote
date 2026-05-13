import test from 'node:test';
import assert from 'node:assert/strict';
import { grantsPremiumAi, hasPendingPremiumState } from '../functions/entitlement-model.mjs';

test('grantsPremiumAi allows active premium subscriptions', () => {
  assert.equal(grantsPremiumAi({ role: 'premium', status: 'active' }), true);
  assert.equal(grantsPremiumAi({ role: 'premium', status: 'trialing' }), true);
});

test('grantsPremiumAi rejects non-premium or inactive subscriptions', () => {
  assert.equal(grantsPremiumAi({ role: 'free', status: 'active' }), false);
  assert.equal(grantsPremiumAi({ role: 'premium', status: 'past_due' }), false);
  assert.equal(grantsPremiumAi({ role: 'premium', status: 'canceled' }), false);
});

test('hasPendingPremiumState identifies pending premium billing states', () => {
  assert.equal(hasPendingPremiumState({ role: 'premium', status: 'incomplete' }), true);
  assert.equal(hasPendingPremiumState({ role: 'premium', status: 'past_due' }), true);
  assert.equal(hasPendingPremiumState({ role: 'premium', status: 'active' }), false);
});
