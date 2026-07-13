import { requireUser } from './serverAuth'

export async function requireStaff(request: Request, allowed = ['Admin', 'Compliance']) {
  const context = await requireUser(request)
  const systemRole = String(context.profile?.systemRole || '')
  if (!allowed.includes(systemRole)) throw new Response(JSON.stringify({ ok:false, error:'Staff authorization required' }), { status:403, headers:{'content-type':'application/json'} })
  return { ...context, systemRole }
}
