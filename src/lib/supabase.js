const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isConfigured = Boolean(
  supabaseUrl && 
  supabaseKey && 
  !supabaseUrl.includes('your-project') && 
  !supabaseKey.includes('your-supabase')
);

let supabase = null;

if (isConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });
  } catch (err) {
    console.warn('⚠️ Supabase initialization failed:', err.message);
  }
} else {
  console.log('ℹ️ Supabase environment variables not configured yet. Server running with in-memory caching fallback.');
}

module.exports = {
  supabase,
  isConfigured
};
