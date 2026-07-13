import { jsonError, requireUser } from '@/lib/serverAuth'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { user, admin } = await requireUser(request)
    const activity = await request.json()
    if (!activity.type || !activity.label) return Response.json({ ok: false, error: 'Missing required fields' }, { status: 400 })
    const { data, error } = await admin.from('activity_logs').insert({ actor_id: user.id, type: String(activity.type), label: String(activity.label), detail: activity.detail || null, role: user.user_metadata?.role || null, metadata: activity.metadata || {} }).select('id,created_at').single()
    if (error) throw error
    return Response.json({ ok: true, activity: data })
  } catch (error) { return jsonError(error) }
}

export async function GET(request: Request) {
  try {
    const { user, admin } = await requireUser(request)
    const { data, error } = await admin.from('activity_logs').select('id,type,label,detail,role,metadata,created_at').eq('actor_id', user.id).order('created_at', { ascending: false }).limit(50)
    if (error) throw error
    return Response.json({ ok: true, activities: data })
  } catch (error) { return jsonError(error) }
}
