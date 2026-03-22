/**
 * One-time migration: move all active Basic Weekly subscribers from the old
 * $1.49/week price to the new $1.99/week price at their next billing cycle.
 *
 * - No immediate charge
 * - No proration
 * - Change takes effect on next renewal
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_live_... OLD_PRICE_ID=price_... NEW_PRICE_ID=price_... node scripts/migrate-basic-weekly-price.js
 *
 * Add --dry-run to preview without making changes.
 */

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const OLD_PRICE_ID = process.env.OLD_PRICE_ID;
const NEW_PRICE_ID = process.env.NEW_PRICE_ID;
const DRY_RUN = process.argv.includes('--dry-run');

if (!STRIPE_SECRET_KEY || !OLD_PRICE_ID || !NEW_PRICE_ID) {
  console.error('Missing required environment variables: STRIPE_SECRET_KEY, OLD_PRICE_ID, NEW_PRICE_ID');
  process.exit(1);
}

const BASE_URL = 'https://api.stripe.com/v1';

async function stripeGet(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || `Stripe GET failed: ${path}`);
  }
  return res.json();
}

async function stripePost(path, params) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || `Stripe POST failed: ${path}`);
  }
  return res.json();
}

/**
 * Fetch all active subscriptions on the old price ID, paginating through all results.
 */
async function fetchSubscriptionsOnOldPrice() {
  const subscriptions = [];
  let startingAfter = null;

  while (true) {
    const params = new URLSearchParams({
      price: OLD_PRICE_ID,
      status: 'active',
      limit: '100',
    });
    if (startingAfter) params.set('starting_after', startingAfter);

    const page = await stripeGet(`/subscriptions?${params}`);
    subscriptions.push(...page.data);

    if (!page.has_more) break;
    startingAfter = page.data[page.data.length - 1].id;
  }

  return subscriptions;
}

async function main() {
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE'}`);
  console.log(`Old price: ${OLD_PRICE_ID}`);
  console.log(`New price: ${NEW_PRICE_ID}\n`);

  const subscriptions = await fetchSubscriptionsOnOldPrice();
  console.log(`Found ${subscriptions.length} active subscription(s) on old price.\n`);

  if (subscriptions.length === 0) {
    console.log('Nothing to migrate.');
    return;
  }

  let succeeded = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    const itemId = sub.items?.data?.[0]?.id;
    const customerId = sub.customer;
    const nextRenewal = sub.current_period_end
      ? new Date(sub.current_period_end * 1000).toISOString().split('T')[0]
      : 'unknown';

    if (!itemId) {
      console.warn(`  SKIP  ${sub.id} — no subscription item found`);
      failed++;
      continue;
    }

    if (DRY_RUN) {
      console.log(`  DRY   ${sub.id}  customer=${customerId}  next_renewal=${nextRenewal}`);
      succeeded++;
      continue;
    }

    try {
      await stripePost(`/subscriptions/${sub.id}`, {
        'items[0][id]': itemId,
        'items[0][price]': NEW_PRICE_ID,
        'proration_behavior': 'none',  // no charge now — change applies at next renewal
      });
      console.log(`  OK    ${sub.id}  customer=${customerId}  new price active from ${nextRenewal}`);
      succeeded++;
    } catch (err) {
      console.error(`  FAIL  ${sub.id}  customer=${customerId}  error=${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone. succeeded=${succeeded}  failed=${failed}`);
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
