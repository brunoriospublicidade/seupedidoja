import { createClient } from '@supabase/supabase-js';

// Support for both Vite (import.meta.env) and Node (process.env)
// Support for both Vite and Node
const supabaseUrl = (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_URL : (import.meta as any).env?.VITE_SUPABASE_URL) as string;
const supabaseAnonKey = (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_ANON_KEY : (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // If we are in node and variables are missing, it might be because they aren't loaded yet
  console.warn('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
