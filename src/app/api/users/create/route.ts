import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { isValidRole } from '@/lib/roles'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { user_id, email, role, display_name, company } = body

    if (!user_id) {
      return NextResponse.json({ ok: false, error: 'Missing user_id' }, { status: 400 })
    }

    if (!isValidRole(role)) {
      return NextResponse.json({ ok: false, error: 'invalid role' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      console.warn('⚠️ Supabase not configured - running in demo mode')
      return NextResponse.json({
        ok: true,
        message: 'Demo mode: user would be saved to Supabase in production',
        data: body
      }, { status: 200 })
    }

    const now = new Date().toISOString()

    await supabaseAdmin.from('users').upsert({
      id: user_id,
      email,
      role,
      display_name,
      company,
      created_at: now,
      updated_at: now
    })

    if (company) {
      await supabaseAdmin.from('companies').upsert({
        id: company.id,
        name: company.name,
        created_at: now,
        updated_at: now
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ ok: false, error: err?.message || 'server error' }, { status: 500 })
  }
}
