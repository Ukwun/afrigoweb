import { createClient, SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || ''
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || ''

function isDemoSupabaseConfig(value: string) {
  return !value || /demo|placeholder|example/i.test(value)
}

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey && !isDemoSupabaseConfig(url) && !isDemoSupabaseConfig(anonKey))
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null
  }
  return createClient(url, anonKey)
}
