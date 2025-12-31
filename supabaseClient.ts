import { createClient } from '@supabase/supabase-js';

// Access environment variables securely
const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL || 'https://dhnucmrwfeblliiyymlw.supabase.co';
const SUPABASE_KEY = (import.meta as any).env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobnVjbXJ3ZmVibGxpaXl5bWx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNDQ2ODYsImV4cCI6MjA4MjcyMDY4Nn0.uxsYS43KYxdB_-Ms7rXzYbuXzWXWfCvLCyinOf_Modo';

// If credentials are missing, we don't crash, but the store will handle the offline state.
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    },
    realtime: {
        params: {
            eventsPerSecond: 10,
        },
    },
});

export const isSupabaseConfigured = () => {
    return SUPABASE_URL.length > 0 && SUPABASE_KEY.length > 0;
};