// Cloudflare Worker URL — null = not deployed yet
// Set this after deploying workers/tracking-worker.js
const WORKER_URL = null;

/**
 * Fetch tracking status via Cloudflare Worker proxy.
 * Returns { status, events, history, latest } on success,
 * { notReady: true } if worker isn't configured,
 * { error: string } on failure.
 */
export async function fetchStatus(carrier, number) {
  if (!WORKER_URL) return { notReady: true };

  try {
    const res = await fetch(
      `${WORKER_URL}?carrier=${encodeURIComponent(carrier)}&number=${encodeURIComponent(number)}`
    );
    if (!res.ok) return { error: `HTTP ${res.status}` };
    return await res.json();
  } catch (err) {
    return { error: err.message };
  }
}
