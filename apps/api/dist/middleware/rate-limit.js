"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimit = rateLimit;
const buckets = new Map();
function rateLimit(windowMs = 60_000, max = 120) {
    return (req, res, next) => {
        const key = `${req.ip}:${req.path}`;
        const now = Date.now();
        const bucket = buckets.get(key);
        if (!bucket || bucket.reset <= now)
            buckets.set(key, { count: 1, reset: now + windowMs });
        else
            bucket.count++;
        const current = buckets.get(key);
        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, max - current.count));
        if (current.count > max)
            return res.status(429).json({ success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } });
        next();
    };
}
