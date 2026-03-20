// Sync Worker for background trade tracking polling

let intervalId = null;

self.addEventListener("message", (e) => {
  if (e.data.type === "START") {
    const { interval = 30000, maxRetries = 5 } = e.data.payload || {};
    
    if (intervalId) return; // Prevent multiple intervals

    let retries = 0;

    const poll = async () => {
      try {
        const res = await fetch("/api/trades/sync");
        if (res.ok) {
          const data = await res.json();
          retries = 0; // Reset retries on success

          // Notify frontend only if new trades or closed positions were synced
          if ((data.newTrades && data.newTrades.length > 0) || (data.closedTrades && data.closedTrades.length > 0)) {
            self.postMessage({ type: "SYNC_SUCCESS", payload: data });
          }
        } else {
          throw new Error(`Sync failed with status: ${res.status}`);
        }
      } catch (err) {
        console.error("[SyncWorker] Polling error:", err.message);
        retries++;
        
        // Safety net to stop hammering the backend on persistent errors
        if (retries >= maxRetries) {
          self.postMessage({ type: "SYNC_ERROR", payload: err.message });
          clearInterval(intervalId);
          intervalId = null;
        }
      }
    };

    intervalId = setInterval(poll, interval);
  } else if (e.data.type === "STOP") {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }
});
