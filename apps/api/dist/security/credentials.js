"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptSecret = encryptSecret;
exports.decryptSecret = decryptSecret;
exports.encryptJson = encryptJson;
exports.decryptJson = decryptJson;
const node_crypto_1 = __importDefault(require("node:crypto"));
const PREFIX = 'v1:';
function key() {
    const value = process.env.SERVER_ENCRYPTION_KEY;
    if (!value)
        throw new Error('SERVER_ENCRYPTION_KEY is required');
    const raw = Buffer.from(value, 'base64');
    if (raw.length === 32)
        return raw;
    return node_crypto_1.default.createHash('sha256').update(value).digest();
}
function encryptSecret(value) {
    if (value == null)
        return value;
    const iv = node_crypto_1.default.randomBytes(12);
    const cipher = node_crypto_1.default.createCipheriv('aes-256-gcm', key(), iv);
    const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    return `${PREFIX}${iv.toString('base64url')}:${cipher.getAuthTag().toString('base64url')}:${ciphertext.toString('base64url')}`;
}
/** Decrypts new values and preserves compatibility with legacy plaintext rows. */
function decryptSecret(value) {
    if (value == null || !value.startsWith(PREFIX))
        return value;
    const [, iv, tag, ciphertext] = value.split(':');
    const decipher = node_crypto_1.default.createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64url'));
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64url')), decipher.final()]).toString('utf8');
}
function encryptJson(value) {
    return encryptSecret(JSON.stringify(value));
}
function decryptJson(value) {
    return JSON.parse(decryptSecret(String(value)));
}
