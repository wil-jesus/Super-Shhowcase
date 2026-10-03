const attempts = new Map<string, number[]>();

export function rateLimit(key: string, maxAttempts: number, windowMs: number) {
  const now = Date.now();
  const recentAttempts = (attempts.get(key) ?? []).filter(
    (timestamp) => now - timestamp < windowMs
  );
  recentAttempts.push(now);
  attempts.set(key, recentAttempts);

  return {
    allowed: recentAttempts.length <= maxAttempts,
    remaining: Math.max(0, maxAttempts - recentAttempts.length),
  };
}