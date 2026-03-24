/**
 * TikTok Events API helper
 * Sends server-side conversion events to TikTok's Events API.
 * Failures are logged but never thrown — a failed call must not break the checkout flow.
 */

const TIKTOK_EVENTS_URL = 'https://business-api.tiktok.com/open_api/v1.3/event/track/';
const PIXEL_ID = 'D70T45BC77U98PN6KECG';

/**
 * Send a server-side event to TikTok Events API.
 * @param {object} env - Cloudflare Worker env (must have TIKTOK_EVENTS_TOKEN)
 * @param {string} eventName - TikTok standard event name (e.g. 'Purchase', 'CompleteRegistration')
 * @param {{ event_id: string, timestamp: number, email: string, value?: number, currency?: string }} payload
 */
export async function sendTikTokEvent(env, eventName, payload) {
  const { event_id, timestamp, email, value, currency } = payload;

  const emailHash = await hashSha256(email.trim().toLowerCase());

  const body = {
    pixel_code: PIXEL_ID,
    event: eventName,
    event_id,
    timestamp: new Date(timestamp * 1000).toISOString(),
    context: {
      user: { email: emailHash },
    },
    properties: {
      currency: currency ?? 'USD',
      ...(value !== undefined && { value }),
    },
  };

  try {
    const res = await fetch(TIKTOK_EVENTS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Token': env.TIKTOK_EVENTS_TOKEN,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`TikTok Events API error (${res.status}):`, text);
    }
  } catch (err) {
    console.error('TikTok Events API fetch failed:', err);
  }
}

async function hashSha256(value) {
  const data = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
