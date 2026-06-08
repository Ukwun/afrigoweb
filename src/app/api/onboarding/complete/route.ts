import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { isValidRole } from '@/lib/roles'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { user_id, email, role, display_name, company, kyc_documents } = body

    if (!user_id) {
      return NextResponse.json({ ok: false, error: 'Missing user_id' }, { status: 400 })
    }

    if (!email) {
      return NextResponse.json({ ok: false, error: 'Missing email' }, { status: 400 })
    }

    if (!isValidRole(role)) {
      return NextResponse.json({ ok: false, error: 'Invalid role' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      console.warn('⚠️ Supabase not configured - running in demo mode')
      return NextResponse.json({ ok: true, demo: true, data: { email, role, company } })
    }

    const now = new Date().toISOString()
    const companyId = company?.id || crypto.randomUUID()

    await supabaseAdmin.from('companies').upsert({
      id: companyId,
      name: company?.name || 'Afrigo Company',
      country: company?.country || null,
      kyc_status: 'pending',
      created_at: now,
      updated_at: now
    })

    await supabaseAdmin.from('users').upsert({
      id: user_id,
      email,
      display_name,
      role,
      company_id: companyId,
      created_at: now,
      updated_at: now
    })

    if (Array.isArray(kyc_documents) && kyc_documents.length > 0) {
      const docs = kyc_documents.map((doc: any) => ({
        id: crypto.randomUUID(),
        owner_id: user_id,
        type: 'kyc',
        meta: { name: doc.name, size: doc.size, mimeType: doc.type },
        s3_key: null,
        created_at: now
      }))
      await supabaseAdmin.from('documents').insert(docs)
    }

    await supabaseAdmin.from('audit_logs').insert([
      {
        id: crypto.randomUUID(),
        actor_id: user_id,
        action: 'onboarding_complete',
        object: { company_id: companyId, role },
        created_at: now
      }
    ])

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ ok: false, error: error?.message || String(error) }, { status: 500 })
  }
}
