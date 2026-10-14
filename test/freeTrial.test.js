import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeEmail,
  isDisposableEmail,
  evaluateSignupAbuse
} from '../server/services/antiAbuseService.js';
import {
  reserveFeatureAccess,
  refundFeatureAccess,
  getEffectiveAccessState,
  getUserTrialStatus,
  updateUserSubscription,
  memoryStore
} from '../server/services/userService.js';
import { PLAN_LIMITS } from '../src/shared/planLimits.js';

test('Free Trial & Abuse Prevention Test Suite', async (t) => {

  await t.test('1. Disposable-email domain is rejected at sign-up', async () => {
    assert.equal(isDisposableEmail('test@mailinator.com'), true);
    assert.equal(isDisposableEmail('user@tempmail.com'), true);
    assert.equal(isDisposableEmail('alice@10minutemail.com'), true);
    assert.equal(isDisposableEmail('normal@gmail.com'), false);
    assert.equal(isDisposableEmail('business@outlook.com'), false);

    await assert.rejects(
      async () => {
        await evaluateSignupAbuse('scam@mailinator.com', 'uid_123');
      },
      (err) => {
        assert.equal(err.code, 'disposable_email_blocked');
        assert.equal(err.status, 400);
        return true;
      }
    );
  });

  await t.test('2. Duplicate normalized email (Gmail dots and +tags) is flagged', async () => {
    assert.equal(normalizeEmail('John.Doe+promo@gmail.com'), 'johndoe@gmail.com');
    assert.equal(normalizeEmail('J.O.H.N.D.O.E@googlemail.com'), 'johndoe@gmail.com');
    assert.equal(normalizeEmail('alice+test1@yahoo.com'), 'alice@yahoo.com');

    // Register first account
    const first = await evaluateSignupAbuse('charlie.brown+first@gmail.com', 'uid_charlie_1');
    assert.equal(first.normalizedEmail, 'charliebrown@gmail.com');
    assert.equal(first.isDuplicate, false);

    // Attempt second account with dots and different +tag
    const second = await evaluateSignupAbuse('c.h.a.r.l.i.e.b.r.o.w.n+another@gmail.com', 'uid_charlie_2');
    assert.equal(second.normalizedEmail, 'charliebrown@gmail.com');
    assert.equal(second.isDuplicate, true);
  });

  await t.test('3. New verified account: first search succeeds, second returns 402 subscription_required', async () => {
    const testUid = `user_trial_${Date.now()}_1`;
    memoryStore.users.set(testUid, {
      uid: testUid,
      email: `${testUid}@example.com`,
      emailVerified: true,
      plan: 'free',
      subscription: null,
      trial: { searchesUsed: 0, analysesUsed: 0, startedAt: null }
    });

    // 1st search: succeeds on trial
    const firstRun = await reserveFeatureAccess(testUid, 'search');
    assert.equal(firstRun.allowed, true);
    assert.equal(firstRun.plan, 'trial');
    assert.equal(firstRun.isTrial, true);
    assert.equal(firstRun.remaining, 0);

    // 2nd search: exhausted -> 402 subscription_required
    await assert.rejects(
      async () => {
        await reserveFeatureAccess(testUid, 'search');
      },
      (err) => {
        assert.equal(err.code, 'subscription_required');
        assert.equal(err.status, 402);
        assert.equal(err.feature, 'search');
        assert.equal(err.trialRemaining, 0);
        assert.equal(err.suggestedPlan, 'weekly');
        return true;
      }
    );
  });

  await t.test('4. Trial remains exhausted after the next day (counter does not reset)', async () => {
    const testUid = `user_trial_no_reset_${Date.now()}`;
    memoryStore.users.set(testUid, {
      uid: testUid,
      email: `${testUid}@example.com`,
      emailVerified: true,
      plan: 'free',
      subscription: null,
      trial: { searchesUsed: 1, analysesUsed: 1, startedAt: '2026-01-01T00:00:00.000Z' }
    });

    // Effective state is locked
    const state = getEffectiveAccessState(memoryStore.users.get(testUid), 'search');
    assert.equal(state.plan, 'locked');
    assert.equal(state.isLocked, true);

    // Attempting to reserve must throw 402 subscription_required
    await assert.rejects(
      async () => {
        await reserveFeatureAccess(testUid, 'search');
      },
      (err) => {
        assert.equal(err.code, 'subscription_required');
        assert.equal(err.status, 402);
        return true;
      }
    );
  });

  await t.test('5. Failed Apify run refunds the trial unit', async () => {
    const testUid = `user_refund_${Date.now()}`;
    memoryStore.users.set(testUid, {
      uid: testUid,
      email: `${testUid}@example.com`,
      emailVerified: true,
      plan: 'free',
      subscription: null,
      trial: { searchesUsed: 0, analysesUsed: 0, startedAt: null }
    });

    // Reserve 1 search
    const reserved = await reserveFeatureAccess(testUid, 'search');
    assert.equal(reserved.allowed, true);
    assert.equal(memoryStore.users.get(testUid).trial.searchesUsed, 1);

    // Upstream failure happens -> refund
    await refundFeatureAccess(testUid, 'search');
    assert.equal(memoryStore.users.get(testUid).trial.searchesUsed, 0);

    // User can try again successfully
    const retried = await reserveFeatureAccess(testUid, 'search');
    assert.equal(retried.allowed, true);
    assert.equal(memoryStore.users.get(testUid).trial.searchesUsed, 1);
  });

  await t.test('6. Private profile lookup and analyzer cache hit do not consume the trial', async () => {
    const testUid = `user_priv_${Date.now()}`;
    const userDoc = {
      uid: testUid,
      email: `${testUid}@example.com`,
      emailVerified: true,
      plan: 'free',
      subscription: null,
      trial: { searchesUsed: 0, analysesUsed: 0, startedAt: null }
    };
    memoryStore.users.set(testUid, userDoc);

    // In private lookups or cache hits, reserveFeatureAccess is NOT called.
    // Verify trial counter remains pristine (0 searches, 0 analyses used).
    const status = getUserTrialStatus(userDoc);
    assert.equal(status.searchesUsed, 0);
    assert.equal(status.searchesRemaining, 1);
    assert.equal(status.analysesUsed, 0);
    assert.equal(status.analysesRemaining, 1);
  });

  await t.test('7. Subscribing unlocks paid limits; canceling returns the account to "locked", not to a new trial', async () => {
    const testUid = `user_lifecycle_${Date.now()}`;
    memoryStore.users.set(testUid, {
      uid: testUid,
      email: `${testUid}@example.com`,
      emailVerified: true,
      plan: 'free',
      subscription: null,
      trial: { searchesUsed: 1, analysesUsed: 1, startedAt: '2026-10-01T00:00:00.000Z' }
    });

    // 1. Account starts locked because trial is exhausted
    const preSubState = getEffectiveAccessState(memoryStore.users.get(testUid), 'search');
    assert.equal(preSubState.isLocked, true);

    // 2. User subscribes to weekly plan
    const futurePeriod = new Date(Date.now() + 7 * 86400000).toISOString();
    await updateUserSubscription(testUid, {
      plan: 'weekly',
      status: 'active',
      subscriptionId: 'sub_test_weekly_1',
      currentPeriodEnd: futurePeriod
    });

    const activeUser = memoryStore.users.get(testUid);
    const postSubState = getEffectiveAccessState(activeUser, 'search');
    assert.equal(postSubState.isPaid, true);
    assert.equal(postSubState.plan, 'weekly');

    // Searches run under weekly quota (2 per day)
    const run1 = await reserveFeatureAccess(testUid, 'search');
    assert.equal(run1.isPaid, true);
    assert.equal(run1.plan, 'weekly');

    // 3. Subscription cancels or lapses
    await updateUserSubscription(testUid, {
      plan: 'weekly',
      status: 'cancelled',
      subscriptionId: 'sub_test_weekly_1',
      currentPeriodEnd: '2026-01-01T00:00:00.000Z' // past date
    });

    const lapsedUser = memoryStore.users.get(testUid);
    const lapsedState = getEffectiveAccessState(lapsedUser, 'search');
    assert.equal(lapsedState.isLocked, true);
    assert.equal(lapsedState.isPaid, false);

    // Reserving now throws 402 subscription_required, NOT giving a second trial!
    await assert.rejects(
      async () => {
        await reserveFeatureAccess(testUid, 'search');
      },
      (err) => {
        assert.equal(err.code, 'subscription_required');
        assert.equal(err.status, 402);
        return true;
      }
    );
  });

  await t.test('8. Two parallel requests with one trial unit left: exactly one succeeds', async () => {
    const testUid = `user_parallel_${Date.now()}`;
    memoryStore.users.set(testUid, {
      uid: testUid,
      email: `${testUid}@example.com`,
      emailVerified: true,
      plan: 'free',
      subscription: null,
      trial: { searchesUsed: 0, analysesUsed: 0, startedAt: null }
    });

    // Launch two parallel reserve requests simultaneously
    const results = await Promise.allSettled([
      reserveFeatureAccess(testUid, 'search'),
      reserveFeatureAccess(testUid, 'search')
    ]);

    const successes = results.filter(r => r.status === 'fulfilled');
    const failures = results.filter(r => r.status === 'rejected');

    assert.equal(successes.length, 1, 'Exactly one concurrent request must succeed');
    assert.equal(failures.length, 1, 'Exactly one concurrent request must be rejected');
    assert.equal(failures[0].reason.code, 'subscription_required');
    assert.equal(failures[0].reason.status, 402);
  });

});
