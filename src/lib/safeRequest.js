// Retries a promise-returning function on rate-limit (429) with exponential backoff + jitter.
export async function withRetry(fn, retries = 8) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isRateLimit =
        err?.message?.includes('Rate limit') ||
        err?.code === 429 ||
        err?.response?.status === 429;
      if (!isRateLimit || attempt === retries) throw err;
      // Respect Retry-After header when available, else exponential backoff with jitter.
      const retryAfter = err?.response?.headers?.['retry-after'];
      const base = retryAfter ? parseFloat(retryAfter) * 1000 : 800 * Math.pow(2, attempt);
      const delay = base + Math.random() * 500; // jitter to spread concurrent retries
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

// Runs multiple .list() calls sequentially with retry (concurrency 1).
export const safeListAll = (tasks) => safeAll(tasks, 1);

// Small delay between sequential requests to avoid rate-limit bursts.
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// Runs async tasks with limited concurrency + retry to avoid rate-limit bursts.
export async function safeAll(tasks, concurrency = 2) {
  const results = new Array(tasks.length);
  let idx = 0;
  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, async () => {
    while (true) {
      const i = idx++;
      if (i >= tasks.length) break;
      results[i] = await withRetry(tasks[i]);
      // small breather between sequential requests to spread load
      if (i < tasks.length - 1) await delay(250);
    }
  });
  await Promise.all(workers);
  return results;
}