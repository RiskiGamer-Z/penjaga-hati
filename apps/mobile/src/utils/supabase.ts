import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ycywlgkzxbfplnceqqxr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljeXdsZ2t6eGJmcGxuY2VxcXhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNDUxNzIsImV4cCI6MjA5MzkyMTE3Mn0.SFaV_CDyc-Lkb2Nz3V-ArXS5mA6G2LG8baE4WDNINr4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Menghindari ketergantungan native AsyncStorage di Expo Go
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
