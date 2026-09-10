"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyTwilioSignature = verifyTwilioSignature;
const node_crypto_1 = __importDefault(require("node:crypto"));
/** Verify Twilio's X-Twilio-Signature using the exact request URL and parsed form fields. */
function verifyTwilioSignature(req, url, authToken = process.env.TWILIO_AUTH_TOKEN) {
    const signature = req.headers['x-twilio-signature'];
    if (!authToken || typeof signature !== 'string')
        return false;
    const params = req.body && typeof req.body === 'object' ? req.body : {};
    const data = url + Object.keys(params).sort().map((key) => `${key}${params[key]}`).join('');
    const expected = node_crypto_1.default.createHmac('sha1', authToken).update(data).digest('base64');
    return signature.length === expected.length && node_crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
