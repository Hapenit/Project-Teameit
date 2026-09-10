"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultSmsCompliance = void 0;
class DefaultSmsCompliance {
    validate(profile, body) {
        const errors = [];
        if (!body.trim())
            errors.push('Message body is required');
        if (profile.registrationStatus !== 'verified')
            errors.push('SMS compliance profile is not verified');
        if (profile.region === 'IN') {
            if (!profile.principalEntityId)
                errors.push('TRAI/DLT principal entity ID is required');
            if (!profile.senderId)
                errors.push('DLT sender ID is required');
            if (!profile.templateId)
                errors.push('DLT template ID is required');
        }
        return { valid: errors.length === 0, errors };
    }
    headers(profile) {
        if (profile.region !== 'IN')
            return {};
        return {
            'X-DLT-Principal-Entity-Id': profile.principalEntityId,
            'X-DLT-Sender-Id': profile.senderId,
            'X-DLT-Template-Id': profile.templateId
        };
    }
}
exports.DefaultSmsCompliance = DefaultSmsCompliance;
