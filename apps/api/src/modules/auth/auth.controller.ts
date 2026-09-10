import { Request, Response } from 'express';
import { supabaseAdmin } from '../../config/supabase';

export const handleSupabaseWebhook = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    
    // Verify payload is from Supabase (Normally using a webhook secret)
    // if (req.headers['x-supabase-signature'] !== expected) ...

    if (payload.type === 'INSERT' && payload.table === 'users' && payload.schema === 'auth') {
      const user = payload.record;
      
      const { error } = await supabaseAdmin.from('users').insert({
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
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
