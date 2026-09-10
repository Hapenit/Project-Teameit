"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePhone = exports.normalizeEmail = void 0;
exports.matchIdentity = matchIdentity;
const normalizeEmail = (value) => value?.trim().toLowerCase() || '';
exports.normalizeEmail = normalizeEmail;
const normalizePhone = (value) => {
    const digits = (value || '').replace(/\D/g, '');
    return digits ? `+${digits}` : '';
};
exports.normalizePhone = normalizePhone;
/** Deterministic matching: exact tenant-local provider IDs first, then normalized email/phone. */
function matchIdentity(input, candidates) {
    const provider = input.provider && input.providerId
        ? candidates.filter(c => c.provider === input.provider && c.providerId === input.providerId)
        : [];
    if (provider.length === 1)
        return { contactId: provider[0].contactId, confidence: 'high', reason: 'provider_id' };
    const email = (0, exports.normalizeEmail)(input.email);
    const byEmail = email ? candidates.filter(c => (0, exports.normalizeEmail)(c.email) === email) : [];
    if (byEmail.length === 1)
        return { contactId: byEmail[0].contactId, confidence: 'high', reason: 'email' };
    const phone = (0, exports.normalizePhone)(input.phone);
    const byPhone = phone ? candidates.filter(c => (0, exports.normalizePhone)(c.phone) === phone) : [];
    if (byPhone.length === 1)
        return { contactId: byPhone[0].contactId, confidence: 'medium', reason: 'phone' };
    return null; // Never merge ambiguous identities.
}
