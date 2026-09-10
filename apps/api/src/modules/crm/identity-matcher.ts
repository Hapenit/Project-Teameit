export type IdentityCandidate = { contactId: string; email?: string; phone?: string; provider?: string; providerId?: string };
export type IdentityMatch = { contactId: string; confidence: 'high' | 'medium'; reason: 'provider_id' | 'email' | 'phone' };

export const normalizeEmail = (value?: string) => value?.trim().toLowerCase() || '';
export const normalizePhone = (value?: string) => {
  const digits = (value || '').replace(/\D/g, '');
  return digits ? `+${digits}` : '';
};

/** Deterministic matching: exact tenant-local provider IDs first, then normalized email/phone. */
export function matchIdentity(input: IdentityCandidate, candidates: IdentityCandidate[]): IdentityMatch | null {
  const provider = input.provider && input.providerId
    ? candidates.filter(c => c.provider === input.provider && c.providerId === input.providerId)
    : [];
  if (provider.length === 1) return { contactId: provider[0].contactId, confidence: 'high', reason: 'provider_id' };
  const email = normalizeEmail(input.email);
  const byEmail = email ? candidates.filter(c => normalizeEmail(c.email) === email) : [];
  if (byEmail.length === 1) return { contactId: byEmail[0].contactId, confidence: 'high', reason: 'email' };
  const phone = normalizePhone(input.phone);
  const byPhone = phone ? candidates.filter(c => normalizePhone(c.phone) === phone) : [];
  if (byPhone.length === 1) return { contactId: byPhone[0].contactId, confidence: 'medium', reason: 'phone' };
  return null; // Never merge ambiguous identities.
}
