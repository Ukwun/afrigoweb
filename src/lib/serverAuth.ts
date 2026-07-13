import { firebaseAdmin } from './firebaseAdmin'

const jsonResponse = (error: string, status: number) => new Response(JSON.stringify({ ok: false, error }), { status, headers: { 'content-type': 'application/json' } })

export async function requireUser(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) throw jsonResponse('Authentication required', 401)

  let admin: ReturnType<typeof firebaseAdmin>
  try {
    admin = firebaseAdmin()
  } catch (error) {
    console.error('Firebase Admin configuration error', error instanceof Error ? error.message : error)
    throw jsonResponse('The production data service is not configured. Contact Afrigo support.', 503)
  }

  try {
    const decoded = await admin.auth.verifyIdToken(token, true)
    const profile = (await admin.db.collection('users').doc(decoded.uid).get()).data()
    return { user: { id: decoded.uid, uid: decoded.uid, email: decoded.email || '', user_metadata: { role: profile?.role, display_name: profile?.displayName } }, admin, profile }
  } catch {
    throw jsonResponse('Your session expired. Sign in again.', 401)
  }
}

export function jsonError(error: unknown) {
  if (error instanceof Response) return error
  console.error(error)
  return Response.json({ ok: false, error: error instanceof Error ? error.message : 'Server error' }, { status: 500 })
}
