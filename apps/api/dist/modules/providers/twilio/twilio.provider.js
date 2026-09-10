"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwilioProvider = void 0;
class TwilioProvider {
    static async sendSms(to, body, config = {}) {
        const sid = config.accountSid || process.env.TWILIO_ACCOUNT_SID;
        const token = config.authToken || process.env.TWILIO_AUTH_TOKEN;
        const from = config.from || process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_PHONE_NUMBER;
        if (!sid || !token || !from)
            throw new Error('Twilio SMS is not configured');
        if (!to || !body.trim())
            throw new Error('SMS recipient and body are required');
        const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
            method: 'POST', headers: { Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ To: to, From: from, Body: body, ...(config.statusCallback ? { StatusCallback: config.statusCallback } : {}) })
        });
        const data = await response.json();
        if (!response.ok || !data.sid)
            throw new Error(`Twilio SMS failed: ${data.message || response.statusText}`);
        return { id: data.sid, status: data.status };
    }
}
exports.TwilioProvider = TwilioProvider;
