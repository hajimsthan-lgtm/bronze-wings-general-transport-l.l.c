// Retries a promise-returning function on rate-limit (429) with exponential backoff + jitter.
export async function withRetry(fn, retries = 5) {
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
      const base = retryAfter ? parseFloat(retryAfter) * 1000 : 600 * Math.pow(2, attempt);
      const delay = base + Math.random() * 300; // jitter to spread concurrent retries
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

// Runs multiple .list() calls sequentially with retry (concurrency 1).
export const safeListAll = (tasks) => safeAll(tasks, 1);

// Runs async tasks with limited concurrency + retry to avoid rate-limit bursts.
export async function safeAll(tasks, concurrency = 2) {
  const results = new Array(tasks.length);
  let idx = 0;
  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, async () => {
    while (true) {
      const i = idx++;
      if (i >= tasks.length) break;
      results[i] = await withRetry(tasks[i]);
    }
  });
  await Promise.all(workers);
  return results;
}