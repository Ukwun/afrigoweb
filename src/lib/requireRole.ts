import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from './supabaseAdmin'

export async function requireRole(user_id: string, allowedRoles?: string[]) {
  const supabaseAdmin = getSupabaseAdmin()
  // If Supabase admin not configured, allow demo mode (no server enforcement)
  if (!supabaseAdmin) return { demo: true }

  const { data: user } = await supabaseAdmin.from('users').select('*').eq('id', user_id).maybeSingle()

  if (!user) {
    throw new Error('User not found')
  }

  if (allowedRoles && Array.isArray(allowedRoles) && !allowedRoles.includes(user.role)) {
    throw new Error('Forbidden')
  }

  return user
}

export default requireRole
