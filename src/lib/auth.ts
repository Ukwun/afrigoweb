'use client'

import { useEffect, useMemo, useState } from 'react'
import { isValidRole, normalizeRole, type Role } from './roles'

export type AuthUser = {
  id: string
  email: string
  displayName: string
  role?: Role
  demo: boolean
}

type StoredAccount = {
  id: string
  email: string
  displayName: string
  password: string
}

const SESSION_KEY = 'afrigo:session'
const ACCOUNTS_KEY = 'afrigo:accounts'

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function parseJSON<T>(value: string | null): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

function createUserId() {
  if (isBrowser() && 'crypto' in window && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `afrigo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function getSessionFromStorage(): AuthUser | null {
  if (!isBrowser()) return null

  const session = parseJSON<AuthUser>(localStorage.getItem(SESSION_KEY))
  if (session && session.id && session.email) {
    return {
      ...session,
      role: normalizeRole(session.role) ?? undefined
    }
  }

  const userId = localStorage.getItem('afrigo:user_id')
  if (!userId) return null

  const email = localStorage.getItem('afrigo:email') || `${userId}@local.local`
  const displayName = localStorage.getItem('afrigo:display_name') || userId
  const role = normalizeRole(localStorage.getItem('afrigo:role')) ?? undefined
  const demo = localStorage.getItem('afrigo:demo') === 'true'

  return { id: userId, email, displayName, role, demo }
}

function persistSession(user: AuthUser) {
  if (!isBrowser()) return
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  localStorage.setItem('afrigo:user_id', user.id)
  localStorage.setItem('afrigo:email', user.email)
  localStorage.setItem('afrigo:display_name', user.displayName)
  localStorage.setItem('afrigo:demo', String(user.demo))

  if (user.role) {
    localStorage.setItem('afrigo:role', user.role)
  } else {
    localStorage.removeItem('afrigo:role')
  }
}

function clearSessionStorage() {
  if (!isBrowser()) return
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem('afrigo:user_id')
  localStorage.removeItem('afrigo:email')
  localStorage.removeItem('afrigo:display_name')
  localStorage.removeItem('afrigo:role')
  localStorage.removeItem('afrigo:demo')
}

function getStoredAccounts(): StoredAccount[] {
  if (!isBrowser()) return []
  return parseJSON<StoredAccount[]>(localStorage.getItem(ACCOUNTS_KEY)) ?? []
}

function saveStoredAccounts(accounts: StoredAccount[]) {
  if (!isBrowser()) return
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
}

export function createLocalAccount({
  firstName,
  lastName,
  email,
  password
}: {
  firstName: string
  lastName: string
  email: string
  password: string
}) {
  if (!isBrowser()) {
    throw new Error('Auth is only available in the browser.')
  }

  const normalizedEmail = String(email).trim().toLowerCase()
  if (!normalizedEmail || !firstName.trim() || !lastName.trim() || !password) {
    throw new Error('Please provide first name, last name, email, and password.')
  }

  const accounts = getStoredAccounts()
  if (accounts.some((account) => account.email === normalizedEmail)) {
    throw new Error('An account with that email already exists.')
  }

  const account: StoredAccount = {
    id: createUserId(),
    email: normalizedEmail,
    displayName: `${firstName.trim()} ${lastName.trim()}`,
    password
  }

  accounts.push(account)
  saveStoredAccounts(accounts)

  const user: AuthUser = {
    id: account.id,
    email: account.email,
    displayName: account.displayName,
    role: undefined,
    demo: false
  }

  persistSession(user)
  return user
}

export function signInLocal({
  email,
  password
}: {
  email: string
  password: string
}) {
  if (!isBrowser()) {
    throw new Error('Auth is only available in the browser.')
  }

  const normalizedEmail = String(email).trim().toLowerCase()
  const accounts = getStoredAccounts()
  const account = accounts.find((item) => item.email === normalizedEmail)

  if (!account) {
    throw new Error('Account not found. Please sign up first.')
  }

  if (account.password !== password) {
    throw new Error('Invalid credentials. Please check your email and password.')
  }

  const user: AuthUser = {
    id: account.id,
    email: account.email,
    displayName: account.displayName,
    role: undefined,
    demo: false
  }

  persistSession(user)
  return user
}

export function createDemoSession(role: string) {
  if (!isValidRole(role)) {
    throw new Error('Invalid role for demo session.')
  }

  const user: AuthUser = {
    id: createUserId(),
    email: `demo+${role.toLowerCase()}@afrigo.local`,
    displayName: `${role} Demo`,
    role,
    demo: true
  }

  persistSession(user)
  return user
}

export function setLocalRole(role: string) {
  if (!isValidRole(role)) {
    throw new Error('Invalid role.')
  }

  const current = getSessionFromStorage()
  if (!current) {
    throw new Error('No active session.')
  }

  const updated: AuthUser = { ...current, role }
  persistSession(updated)
  return updated
}

export function signOutLocal() {
  clearSessionStorage()
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    setUser(getSessionFromStorage())
  }, [])

  const isSignedIn = Boolean(user && !user.demo)
  const isDemo = Boolean(user?.demo)

  const setRole = (role: string) => {
    const updated = setLocalRole(role)
    setUser(updated)
    return updated
  }

  const signOut = () => {
    signOutLocal()
    setUser(null)
  }

  const createDemoSessionClient = (role: string) => {
    const demoUser = createDemoSession(role)
    setUser(demoUser)
    return demoUser
  }

  const refresh = () => {
    setUser(getSessionFromStorage())
  }

  return useMemo(
    () => ({
      user,
      isSignedIn,
      isDemo,
      setRole,
      createDemo: createDemoSessionClient,
      signOut,
      refresh
    }),
    [user, isSignedIn, isDemo]
  )
}
