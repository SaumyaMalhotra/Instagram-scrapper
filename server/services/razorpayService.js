import crypto from 'crypto';
import { config } from '../config.js';

const RAZORPAY_API_BASE = 'https://api.razorpay.com/v1';

/**
 * Generates Basic Auth header for Razorpay API calls
 */
function getRazorpayAuthHeader() {
  const credentials = Buffer.from(`${config.razorpayKeyId}:${config.razorpayKeySecret}`).toString('base64');
  return `Basic ${credentials}`;
}

const PLAN_SPECS = {
  weekly: {
    period: 'weekly',
    interval: 1,
    name: 'InstaScrape Weekly Pass',
    amount: 19900,
    description: 'Weekly Subscription'
  },
  monthly: {
    period: 'monthly',
    interval: 1,
    name: 'InstaScrape Monthly Pro',
    amount: 49900,
    description: 'Monthly Subscription'
  },
  yearly: {
    period: 'yearly',
    interval: 1,
    name: 'InstaScrape Yearly Unlimited',
    amount: 129900,
    description: 'Yearly Subscription'
  }
};

const resolvedPlanCache = new Map();

/**
 * Ensures a valid Razorpay Plan ID exists for the specified plan type.
 * Automatically provisions on Razorpay if not found or if placeholder.
 */
export async function getOrCreatePlan(planType) {
  if (resolvedPlanCache.has(planType)) {
    return resolvedPlanCache.get(planType);
  }

  const spec = PLAN_SPECS[planType];
  if (!spec) {
    throw new Error(`Invalid plan type: "${planType}". Must be weekly, monthly, or yearly.`);
  }

  // 1. Check if configured in env/config and is a real plan ID
  const configuredId = planType === 'weekly'
    ? config.razorpayPlanWeekly
    : planType === 'monthly'
      ? config.razorpayPlanMonthly
      : config.razorpayPlanYearly;

  const isPlaceholder = !configuredId ||
    configuredId.startsWith('plan_weekly_199') ||
    configuredId.startsWith('plan_monthly_499') ||
    configuredId.startsWith('plan_yearly_1299');

  if (!isPlaceholder && configuredId.startsWith('plan_')) {
    resolvedPlanCache.set(planType, configuredId);
    return configuredId;
  }

  // 2. Query Razorpay API for existing plans matching period and amount
  try {
    const listRes = await fetch(`${RAZORPAY_API_BASE}/plans?count=50`, {
      headers: { 'Authorization': getRazorpayAuthHeader() }
    });
    if (listRes.ok) {
      const listData = await listRes.json();
      if (Array.isArray(listData.items)) {
        const existing = listData.items.find(
          (p) => p.period === spec.period && p.interval === spec.interval && p.item?.amount === spec.amount
        );
        if (existing?.id) {
          resolvedPlanCache.set(planType, existing.id);
          return existing.id;
        }
      }
    }
  } catch (err) {
    console.warn(`[Razorpay] Warning fetching existing plans: ${err.message}`);
  }

  // 3. Dynamically create plan in Razorpay
  const createRes = await fetch(`${RAZORPAY_API_BASE}/plans`, {
    method: 'POST',
    headers: {
      'Authorization': getRazorpayAuthHeader(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      period: spec.period,
      interval: spec.interval,
      item: {
        name: spec.name,
        amount: spec.amount,
        currency: config.razorpayCurrency || 'INR',
        description: spec.description
      }
    })
  });

  const createData = await createRes.json();
  if (!createRes.ok) {
    throw new Error(createData.error?.description || `Failed to create Razorpay plan for ${planType} (${createRes.status}).`);
  }

  resolvedPlanCache.set(planType, createData.id);
  return createData.id;
}

/**
 * Creates a recurring subscription in Razorpay
 * @param {'weekly'|'monthly'|'yearly'} planType
 * @param {string} uid - User ID
 * @param {string} email - Verified user email
 */
export async function createRazorpaySubscription(planType, uid, email) {
  if (!['weekly', 'monthly', 'yearly'].includes(planType)) {
    throw new Error(`Invalid plan type: "${planType}". Must be weekly, monthly, or yearly.`);
  }

  // If running in development with placeholder keys, simulate subscription creation
  if (config.razorpayKeyId === 'rzp_test_placeholder_key') {
    const mockSubId = `sub_mock_${Date.now()}`;
    return {
      subscriptionId: mockSubId,
      keyId: config.razorpayKeyId
    };
  }

  let planId = await getOrCreatePlan(planType);

  const payload = {
    plan_id: planId,
    total_count: 60, // Ongoing recurring billing cycles
    customer_notify: 1,
    quantity: 1,
    notes: {
      uid: String(uid),
      email: String(email),
      plan: planType
    }
  };

  let res = await fetch(`${RAZORPAY_API_BASE}/subscriptions`, {
    method: 'POST',
    headers: {
      'Authorization': getRazorpayAuthHeader(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  let data = await res.json();

  // Self-heal: If the plan ID is invalid or rejected, reset cache, create a fresh plan, and retry once
  if (!res.ok && (data.error?.description?.includes('invalid') || data.error?.description?.includes('could not be found'))) {
    resolvedPlanCache.delete(planType);
    const spec = PLAN_SPECS[planType];
    const freshPlanRes = await fetch(`${RAZORPAY_API_BASE}/plans`, {
      method: 'POST',
      headers: {
        'Authorization': getRazorpayAuthHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        period: spec.period,
        interval: spec.interval,
        item: {
          name: spec.name,
          amount: spec.amount,
          currency: config.razorpayCurrency || 'INR',
          description: spec.description
        }
      })
    });
    const freshPlanData = await freshPlanRes.json();
    if (freshPlanRes.ok && freshPlanData?.id) {
      resolvedPlanCache.set(planType, freshPlanData.id);
      payload.plan_id = freshPlanData.id;
      res = await fetch(`${RAZORPAY_API_BASE}/subscriptions`, {
        method: 'POST',
        headers: {
          'Authorization': getRazorpayAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      data = await res.json();
    }
  }

  if (!res.ok) {
    throw new Error(data.error?.description || `Razorpay subscription creation failed (${res.status}).`);
  }

  return {
    subscriptionId: data.id,
    keyId: config.razorpayKeyId
  };
}

/**
 * Cancels a subscription at cycle end
 * @param {string} subscriptionId
 */
export async function cancelRazorpaySubscription(subscriptionId) {
  if (!subscriptionId) {
    throw new Error('Subscription ID is required to cancel.');
  }

  if (subscriptionId.startsWith('sub_mock_')) {
    return { id: subscriptionId, status: 'cancelled', cancel_at_cycle_end: 1 };
  }

  const res = await fetch(`${RAZORPAY_API_BASE}/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`, {
    method: 'POST',
    headers: {
      'Authorization': getRazorpayAuthHeader(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ cancel_at_cycle_end: 1 })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.description || `Failed to cancel subscription (${res.status}).`);
  }

  return data;
}

/**
 * Verifies Razorpay checkout handler payment signature
 * HMAC SHA-256 of `razorpay_payment_id + "|" + razorpay_subscription_id`
 */
export function verifyPaymentHandlerSignature(paymentId, subscriptionId, receivedSignature) {
  if (!paymentId || !subscriptionId || !receivedSignature) return false;
  if (subscriptionId.startsWith('sub_mock_')) return true;

  const expectedSignature = crypto
    .createHmac('sha256', config.razorpayKeySecret)
    .update(`${paymentId}|${subscriptionId}`)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'utf-8'),
    Buffer.from(receivedSignature, 'utf-8')
  );
}

/**
 * Verifies Razorpay webhook request signature against the raw request body
 */
export function verifyWebhookSignature(rawBody, receivedSignature) {
  if (!rawBody || !receivedSignature) return false;

  const expectedSignature = crypto
    .createHmac('sha256', config.razorpayWebhookSecret)
    .update(rawBody)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf-8'),
      Buffer.from(receivedSignature, 'utf-8')
    );
  } catch {
    return false;
  }
}
