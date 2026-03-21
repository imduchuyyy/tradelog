// Sync Worker — smart polling for trade sync
//
// Calls GET /api/trades/sync at a regular interval (default 60s).
// Only notifies the main thread when there are actual new or closed trades.
// Each backend call is a short-lived serverless function that uses ccxt REST
// with enableRateLimit — safe for Vercel and exchange rate limits.

/** @type {ReturnType<typeof setTimeout> | null} */
let timerId = null;
let stopped = false;

/** @type {number} */
let interval = 60000;

/** @type {number} */
let retries = 0;
const MAX_RETRIES = 5;
const BASE_DELAY = 5000;

async function sync() {
  if (stopped) return;

  try {
    const res = await fetch("/api/trades/sync");

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    retries = 0; // healthy

    const hasNew = data.newTrades && data.newTrades.length > 0;
    const hasClosed = data.closedTrades && data.closedTrades.length > 0;
    const hasErrors = data.errors && data.errors.length > 0;

    // Only notify frontend when something actually changed
    if (hasNew || hasClosed) {
      self.postMessage({ type: "SYNC_RESULT", payload: data });
    }

    if (hasErrors) {
      self.postMessage({ type: "SYNC_ERROR", payload: data.errors[0] });
    }
  } catch (err) {
    retries++;
    console.error(`[SyncWorker] Poll error (attempt ${retries}/${MAX_RETRIES}):`, err.message);

    if (retries >= MAX_RETRIES) {
      self.postMessage({
        type: "SYNC_ERROR",
        payload: "Sync failed after multiple retries",
      });
      // Stop polling — the user can manually retry via the UI
      stopped = true;
      return;
    }
  }

  // Schedule next poll — use exponential backoff on errors, normal interval otherwise
  if (!stopped) {
    const delay = retries > 0
      ? Math.min(BASE_DELAY * Math.pow(2, retries - 1), 120000)
      : interval;
    timerId = setTimeout(sync, delay);
  }
}

// ─── Message handling from main thread ───────────────────────────────────────

self.addEventListener("message", (e) => {
  if (e.data.type === "START") {
    interval = e.data.payload?.interval || 60000;
    stopped = false;
    retries = 0;

    // Start first poll after a short delay (initial sync is done by the
    // main thread directly, the worker handles background refreshes)
    timerId = setTimeout(sync, interval);
  } else if (e.data.type === "STOP") {
    stopped = true;
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  }
});
