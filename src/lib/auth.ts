'use client'

import { useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient'
import { isValidRole, normalizeRole, type Role } from './roles'

export type AuthUser = { id: string; email: string; displayName: string; role?: Role; demo: boolean }
const SESSION_KEY = 'afrigo:preview-session'

function previewSession(): AuthUser | null {
  if (typeof window === 'undefined') return null
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') } catch { return null }
}

function fromSupabase(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email || '',
    displayName: user.user_metadata?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Afrigo user',
    role: normalizeRole(user.user_metadata?.role) || undefined,
    demo: false
  }
}

export async function signUp({ firstName, lastName, email, password }: { firstName: string; lastName: string; email: string; password: string }) {
  if (!isSupabaseConfigured()) throw new Error('Account registration is not configured yet. Add the Supabase environment keys to continue.')
  const client = getSupabaseClient()!
  const { data, error } = await client.auth.signUp({ email: email.trim().toLowerCase(), password, options: { data: { display_name: `${firstName.trim()} ${lastName.trim()}` } } })
  if (error) throw error
  return { user: data.user ? fromSupabase(data.user) : null, needsVerification: !data.session }
}

export async function signIn({ email, password }: { email: string; password: string }) {
  if (!isSupabaseConfigured()) throw new Error('Sign in is not configured yet. Add the Supabase environment keys to continue.')
  const { data, error } = await getSupabaseClient()!.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
  if (error) throw error
  return fromSupabase(data.user)
}

export function createDemoSession(role: string) {
  if (!isValidRole(role)) throw new Error('Invalid preview role.')
  const user: AuthUser = { id: `preview-${role.toLowerCase()}`, email: `preview+${role.toLowerCase()}@afrigo.local`, displayName: `${role} preview`, role, demo: true }
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  window.dispatchEvent(new Event('afrigo-auth-change'))
  return user
}

export async function updateRole(role: string) {
  if (!isValidRole(role)) throw new Error('Invalid role.')
  const preview = previewSession()
  if (preview) {
    const updated = { ...preview, role }
    localStorage.setItem(SESSION_KEY, JSON.stringify(updated))
    window.dispatchEvent(new Event('afrigo-auth-change'))
    return updated
  }
  const client = getSupabaseClient()
  if (!client) throw new Error('Authentication is not configured.')
  const { data, error } = await client.auth.updateUser({ data: { role } })
  if (error) throw error
  return fromSupabase(data.user)
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const client = getSupabaseClient()
    const refresh = async () => {
      const preview = previewSession()
      if (preview) { setUser(preview); setLoading(false); return }
      if (!client) { setUser(null); setLoading(false); return }
      const { data } = await client.auth.getUser()
      setUser(data.user ? fromSupabase(data.user) : null)
      setLoading(false)
    }
    refresh()
    window.addEventListener('afrigo-auth-change', refresh)
    const subscription = client?.auth.onAuthStateChange((_event, session) => { if (!previewSession()) setUser(session?.user ? fromSupabase(session.user) : null); setLoading(false) }).data.subscription
    return () => { window.removeEventListener('afrigo-auth-change', refresh); subscription?.unsubscribe() }
  }, [])
  const signOut = async () => { localStorage.removeItem(SESSION_KEY); await getSupabaseClient()?.auth.signOut(); setUser(null) }
  return useMemo(() => ({ user, loading, isSignedIn: Boolean(user && !user.demo), isDemo: Boolean(user?.demo), setRole: updateRole, createDemo: createDemoSession, signOut, refresh: () => window.dispatchEvent(new Event('afrigo-auth-change')) }), [user, loading])
}
