import { requireUser, jsonError } from '@/lib/serverAuth'
import { rateLimit } from '@/lib/rateLimit'

export async function POST(request: Request) {
  try {
    rateLimit(request, 'payment', 10)
    const { user, admin } = await requireUser(request)
    if (user.user_metadata.role !== 'Buyer') return Response.json({ ok: false, error: 'Buyer role required' }, { status: 403 })
    const { contractId } = await request.json()
    const contract = await admin.db.collection('contracts').doc(String(contractId || '')).get()
    if (!contract.exists || contract.data()?.buyerId !== user.id) return Response.json({ ok: false, error: 'Contract not found' }, { status: 404 })
    if (contract.data()?.status !== 'pending') return Response.json({ ok: false, error: 'This contract is not awaiting payment' }, { status: 409 })
    const amount = Number(contract.data()?.amount), currency = String(contract.data()?.currency || 'NGN')
    if (!Number.isFinite(amount) || amount <= 0) return Response.json({ ok: false, error: 'Contract amount is invalid' }, { status: 409 })
    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) return Response.json({ ok: false, error: 'Payment provider is not configured' }, { status: 503 })
    const reference = `afrigo_${crypto.randomUUID().replace(/-/g, '')}`
    const response = await fetch('https://api.paystack.co/transaction/initialize', { method: 'POST', headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email, amount: String(Math.round(amount * 100)), currency, reference, callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`, metadata: JSON.stringify({ contractId: contract.id, userId: user.id }) }) })
    const result = await response.json()
    if (!response.ok || !result.status) throw new Error(result.message || 'Unable to initialize payment')
    await admin.db.collection('payments').add({ contractId: contract.id, payerId: user.id, provider: 'paystack', providerReference: reference, amount, currency, status: 'pending', createdAt: new Date() })
    return Response.json({ ok: true, authorizationUrl: result.data.authorization_url, reference })
  } catch (error) { return jsonError(error) }
}
