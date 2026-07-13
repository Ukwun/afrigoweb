import { getSupabaseClient } from './supabaseClient'

export async function authenticatedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const { data } = await getSupabaseClient()!.auth.getSession()
  if (!data.session) throw new Error('Your session expired. Please sign in again.')
  const response = await fetch(input, { ...init, headers: { ...init.headers, Authorization: `Bearer ${data.session.access_token}` } })
  const json = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(json.error || 'Request failed')
  return json
}
