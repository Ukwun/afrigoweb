import { createClient, SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || ''

function isDemoSupabaseConfig(value: string) {
  return !value || /demo|placeholder|example/i.test(value)
}

export function getSupabaseAdmin(): SupabaseClient | null {
  if (!url || !serviceRoleKey) {
    return null
  }

  if (isDemoSupabaseConfig(url) || isDemoSupabaseConfig(serviceRoleKey)) {
    console.warn('Supabase admin not configured for production; demo mode active.')
    return null
  }

  return createClient(url, serviceRoleKey)
}
