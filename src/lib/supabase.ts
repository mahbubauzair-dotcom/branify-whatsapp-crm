import { createClient } from '@supabase/supabase-js';

// Access environment variables safely in Vite
const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://dxyqcypsssbopgbsqlfv.supabase.co';
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || 
  env.VITE_SUPABASE_PUBLISHABLE_KEY || 
  'sb_publishable_btxaDAzN1MEBJtVYV-q-AA_BLAC21JP';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export const BRANIFY_DEFAULTS = {
  businessName: env.VITE_BRANIFY_DISPLAY_NAME || 'Branify',
  username: env.VITE_BRANIFY_USERNAME || '@branify002',
  phoneNumber: env.VITE_BRANIFY_PHONE_NUMBER || '+92 332 1029333',
  formattedPhone: env.VITE_BRANIFY_PHONE_NUMBER || '+92 332 1029333',
  rawPhone: '923321029333',
  maskedPhone: '+92 332 1029333',
  website: env.VITE_BRANIFY_WEBSITE || 'https://branify.store/',
  slug: 'branify',
};
