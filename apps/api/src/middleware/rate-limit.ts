import { Request, Response, NextFunction } from 'express';

const buckets = new Map<string, { count: number; reset: number }>();
export function rateLimit(windowMs = 60_000, max = 120) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const bucket = buckets.get(key);
    if (!bucket || bucket.reset <= now) buckets.set(key, { count: 1, reset: now + windowMs });
    else bucket.count++;
    const current = buckets.get(key)!;
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - current.count));
    if (current.count > max) return res.status(429).json({ success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } });
    next();
  };
}
