"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSupabaseWebhook = void 0;
const supabase_1 = require("../../config/supabase");
const handleSupabaseWebhook = async (req, res) => {
    try {
        const payload = req.body;
        // Verify payload is from Supabase (Normally using a webhook secret)
        // if (req.headers['x-supabase-signature'] !== expected) ...
        if (payload.type === 'INSERT' && payload.table === 'users' && payload.schema === 'auth') {
            const user = payload.record;
            const { error } = await supabase_1.supabaseAdmin.from('users').insert({
                id: user.id,
                email: user.email,
                first_name: user.raw_user_meta_data?.first_name || '',
                last_name: user.raw_user_meta_data?.last_name || '',
                status: 'active'
            });
            if (error) {
                console.error('Failed to insert user profile:', error);
                return res.status(500).json({ success: false, error: 'Database error' });
            }
        }
        return res.status(200).json({ success: true });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};
exports.handleSupabaseWebhook = handleSupabaseWebhook;
