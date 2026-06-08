import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { normalizeRole } from '@/lib/roles'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { firstName, lastName, email, password } = body

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { ok: false, error: 'Missing first name, last name, email, or password.' },
        { status: 400 }
      )
    }

    const lowerEmail = String(email).trim().toLowerCase()
    const displayName = `${String(firstName).trim()} ${String(lastName).trim()}`
    const userId = crypto.randomUUID()

    const supabaseAdmin = getSupabaseAdmin()
    if (supabaseAdmin) {
      const now = new Date().toISOString()
      const { data: existing } = await supabaseAdmin.from('users').select('id').eq('email', lowerEmail).limit(1).maybeSingle()

      const idToUse = existing?.id || userId
      await supabaseAdmin.from('users').upsert({
        id: idToUse,
        email: lowerEmail,
        display_name: displayName,
        role: null,
        created_at: now,
        updated_at: now
      })

      return NextResponse.json({ ok: true, user: { id: idToUse, email: lowerEmail, display_name: displayName } })
    }

    return NextResponse.json({ ok: true, user: { id: userId, email: lowerEmail, display_name: displayName } })
  } catch (error: any) {
    console.error('Sign up API error', error)
    return NextResponse.json(
      { ok: false, error: error?.message || 'Unable to create your account at this time.' },
      { status: 500 }
    )
  }
}
