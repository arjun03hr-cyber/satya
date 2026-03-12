import { createClient } from '@supabase/supabase-js';

// Backend uses SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (no VITE_ prefix).
// VITE_ prefixed variables are Vite build-time replacements - they are UNDEFINED in Node.js.
// The service_role key bypasses RLS, which is safe and necessary for server-side DB operations.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn(
    '⚠️ Server Warning: Missing Supabase environment variables!\n' +
    `  SUPABASE_URL: ${supabaseUrl ? '✅' : '❌ MISSING'}\n` +
    `  SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceRoleKey ? '✅' : '❌ MISSING'}\n` +
    '  Add these to your .env file (without VITE_ prefix).'
  );
}

export const supabaseServer = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceRoleKey || 'placeholder'
);
