export type SmsRegion = 'IN' | 'US' | 'GB' | string;
export interface SmsComplianceProfile {
  region: SmsRegion;
  principalEntityId?: string;
  senderId?: string;
  templateId?: string;
  consentText?: string;
  registrationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  metadata?: Record<string, unknown>;
}

/** Provider-neutral compliance contract. Indian traffic carries DLT/TRAI identifiers. */
export interface SmsComplianceAdapter {
  validate(profile: SmsComplianceProfile, body: string): { valid: boolean; errors: string[] };
  headers(profile: SmsComplianceProfile): Record<string, string>;
}

export class DefaultSmsCompliance implements SmsComplianceAdapter {
  validate(profile: SmsComplianceProfile, body: string) {
    const errors: string[] = [];
    if (!body.trim()) errors.push('Message body is required');
    if (profile.registrationStatus !== 'verified') errors.push('SMS compliance profile is not verified');
    if (profile.region === 'IN') {
      if (!profile.principalEntityId) errors.push('TRAI/DLT principal entity ID is required');
      if (!profile.senderId) errors.push('DLT sender ID is required');
      if (!profile.templateId) errors.push('DLT template ID is required');
    }
    return { valid: errors.length === 0, errors };
  }
  headers(profile: SmsComplianceProfile): Record<string, string> {
    if (profile.region !== 'IN') return {};
    return {
      'X-DLT-Principal-Entity-Id': profile.principalEntityId!,
      'X-DLT-Sender-Id': profile.senderId!,
      'X-DLT-Template-Id': profile.templateId!
    };
  }
}
