import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseServiceKey) {
  console.warn('Warning: SUPABASE_SERVICE_ROLE_KEY is not set.');
}

// Service role client for backend administrative actions
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// A function to create a Supabase client that acts on behalf of the user, for RLS
export const createUserClient = (authHeader: string) => {
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
    auth: {
      persistSession: false,
    }
  });
};
