import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export function createServiceClient(url: string, serviceRoleKey: string): SupabaseClient<Database> {
  if (!url || !serviceRoleKey) throw new Error('Missing server Supabase credentials');
  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
