import crypto from 'node:crypto';

const PREFIX = 'v1:';

function key(): Buffer {
  const value = process.env.SERVER_ENCRYPTION_KEY;
  if (!value) throw new Error('SERVER_ENCRYPTION_KEY is required');
  const raw = Buffer.from(value, 'base64');
  if (raw.length === 32) return raw;
  return crypto.createHash('sha256').update(value).digest();
}

export function encryptSecret(value: string | null | undefined): string | null {
  if (value == null) return value as null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `${PREFIX}${iv.toString('base64url')}:${cipher.getAuthTag().toString('base64url')}:${ciphertext.toString('base64url')}`;
}

/** Decrypts new values and preserves compatibility with legacy plaintext rows. */
export function decryptSecret(value: string | null | undefined): string | null {
  if (value == null || !value.startsWith(PREFIX)) return value as null;
  const [, iv, tag, ciphertext] = value.split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64url')), decipher.final()]).toString('utf8');
}

export function encryptJson(value: unknown): string {
  return encryptSecret(JSON.stringify(value))!;
}

export function decryptJson<T>(value: unknown): T {
  return JSON.parse(decryptSecret(String(value))!);
}
