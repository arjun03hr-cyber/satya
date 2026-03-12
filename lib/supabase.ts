import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase configuration is missing. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.');
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');

// Helper to check if credentials exist
export const isSupabaseConfigured = () => {
    return !!supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co' && 
           !!supabaseAnonKey && supabaseAnonKey !== 'placeholder';
};
