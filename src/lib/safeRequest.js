// Retries a promise-returning function on rate-limit (429) with exponential backoff.
export async function withRetry(fn, retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isRateLimit =
        err?.message?.includes('Rate limit') ||
        err?.code === 429 ||
        err?.response?.status === 429;
      if (!isRateLimit || attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 400 * Math.pow(2, attempt)));
    }
  }
}

// Runs async tasks with limited concurrency + retry to avoid rate-limit bursts.
export async function safeAll(tasks, concurrency = 3) {
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