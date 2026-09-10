import crypto from 'node:crypto';
import type { Request } from 'express';

/** Verify Twilio's X-Twilio-Signature using the exact request URL and parsed form fields. */
export function verifyTwilioSignature(req: Request, url: string, authToken = process.env.TWILIO_AUTH_TOKEN): boolean {
  const signature = req.headers['x-twilio-signature'];
  if (!authToken || typeof signature !== 'string') return false;
  const params = req.body && typeof req.body === 'object' ? req.body : {};
  const data = url + Object.keys(params).sort().map((key) => `${key}${params[key]}`).join('');
  const expected = crypto.createHmac('sha1', authToken).update(data).digest('base64');
  return signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
