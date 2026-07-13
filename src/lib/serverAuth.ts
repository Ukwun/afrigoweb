import { getSupabaseAdmin } from './supabaseAdmin'

export async function requireUser(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) throw new Response(JSON.stringify({ ok: false, error: 'Authentication required' }), { status: 401, headers: { 'content-type': 'application/json' } })
  const admin = getSupabaseAdmin()
  if (!admin) throw new Response(JSON.stringify({ ok: false, error: 'Server authentication is not configured' }), { status: 503, headers: { 'content-type': 'application/json' } })
  const { data, error } = await admin.auth.getUser(token)
  if (error || !data.user) throw new Response(JSON.stringify({ ok: false, error: 'Invalid or expired session' }), { status: 401, headers: { 'content-type': 'application/json' } })
  return { user: data.user, admin }
}

export function jsonError(error: unknown) {
  if (error instanceof Response) return error
  console.error(error)
  return Response.json({ ok: false, error: error instanceof Error ? error.message : 'Server error' }, { status: 500 })
}
