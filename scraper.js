// Cloudflare Worker URL — deployed production endpoint.
const WORKER_URL = "https://parcel-tracking-scraper.nsh1l-cf.workers.dev";

/**
 * Fetch one carrier's tracking status via the Worker proxy.
 * Returns the Worker response on success, { notReady: true } when the
 * deployment URL is not configured, or { error: string } on failure.
 */
export async function fetchStatus(carrier, number) {
  if (!WORKER_URL) return { notReady: true };
  return fetchWorker(`?carrier=${encodeURIComponent(carrier)}&number=${encodeURIComponent(number)}`);
}

/**
 * Query every configured carrier through the Worker endpoint.
 * The Worker response contains `hits` only for carriers with tracking data.
 */
export async function fetchAllStatuses(number) {
  if (!WORKER_URL) return { notReady: true };
  return fetchWorker(`?number=${encodeURIComponent(number)}`);
}

async function fetchWorker(query) {
  try {
    const res = await fetch(`${WORKER_URL}${query}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data.error || `HTTP ${res.status}` };
    return data;
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}
