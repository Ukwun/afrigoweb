import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { isValidRole } from '@/lib/roles'
import { requireRole } from '@/lib/requireRole'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { user_id, role } = body
    if (!user_id) {
      return NextResponse.json({ ok: false, error: 'Missing user_id' }, { status: 400 })
    }

    if (!isValidRole(role)) {
      return NextResponse.json({ ok: false, error: 'invalid role' }, { status: 400 })
    }

    // Ensure the user exists (or allow demo mode when Supabase isn't configured)
    await requireRole(user_id)

    const supabaseAdmin = getSupabaseAdmin()
    if (supabaseAdmin) {
      const now = new Date().toISOString()
      await supabaseAdmin.from('users').upsert({
        id: user_id,
        role,
        updated_at: now
      })
    }

    return NextResponse.json({ ok: true, role })
  } catch (e: any) {
    console.error('select-role route error', e)
    return NextResponse.json({ ok: false, error: e?.message || 'server error' }, { status: 500 })
  }
}
