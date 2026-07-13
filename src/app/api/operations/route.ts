import { jsonError, requireUser } from '@/lib/serverAuth'
import { rateLimit } from '@/lib/rateLimit'

export async function POST(request: Request) {
  try {
    rateLimit(request, 'operations', 30)
    const { user, admin } = await requireUser(request), input = await request.json(), action = String(input.action || ''), db = admin.db
    const contractRef = db.collection('contracts').doc(String(input.contractId || '')), contract = await contractRef.get(), data = contract.data()
    if (!contract.exists) return Response.json({ ok: false, error: 'Contract not found' }, { status: 404 })
    const isBuyer = data?.buyerId === user.id, isSeller = data?.supplierId === user.id, isExporter = data?.exporterId === user.id
    if (!isBuyer && !isSeller && !isExporter) return Response.json({ ok: false, error: 'You are not a party to this contract' }, { status: 403 })
    const now = new Date()
    if (action === 'accept' && isSeller && data?.status === 'pending') await contractRef.update({ status: 'accepted', acceptedAt: now, updatedAt: now })
    else if (action === 'cancel' && (isBuyer || isSeller) && ['pending', 'accepted'].includes(data?.status)) await contractRef.update({ status: 'cancelled', cancelledBy: user.id, cancellationReason: String(input.reason || '').slice(0, 500), updatedAt: now })
    else if (action === 'dispute' && (isBuyer || isSeller) && !['cancelled', 'completed', 'refunded'].includes(data?.status)) await contractRef.update({ status: 'disputed', disputedBy: user.id, disputeReason: String(input.reason || '').slice(0, 1000), updatedAt: now })
    else if (action === 'refund' && isBuyer && ['paid', 'disputed'].includes(data?.status)) await contractRef.update({ refundStatus: 'requested', refundReason: String(input.reason || '').slice(0, 1000), updatedAt: now })
    else if (action === 'milestone' && isSeller && ['accepted', 'paid', 'fulfilling'].includes(data?.status)) await contractRef.update({ status: 'fulfilling', fulfilmentMilestone: String(input.milestone || '').slice(0, 120), updatedAt: now })
    else if (action === 'assign-exporter' && isBuyer && data?.status === 'paid') {
      const exporterId = String(input.exporterId || ''), exporter = await db.collection('users').doc(exporterId).get()
      const companyId=exporter.data()?.companyId,company=companyId?await db.collection('companies').doc(companyId).get():null
      if (!exporter.exists || exporter.data()?.role !== 'Exporter' || (exporter.data()?.kycStatus!=='verified' && exporter.data()?.verificationStatus!=='verified' && company?.data()?.kycStatus!=='verified')) return Response.json({ ok: false, error: 'Verified Exporter not found' }, { status: 404 })
      const shipment = db.collection('shipments').doc()
      await db.runTransaction(async transaction => { transaction.update(contractRef, { exporterId, status: 'shipping', updatedAt: now }); transaction.set(shipment, { contractId: contract.id, buyerId: data.buyerId, supplierId: data.supplierId, exporterId, status: 'Assigned', progress: 5, createdAt: now, updatedAt: now }) })
    } else if (action === 'message') {
      const message = String(input.message || '').trim().slice(0, 2000)
      if (!message) return Response.json({ ok: false, error: 'Message is required' }, { status: 400 })
      await db.collection('messages').add({ contractId: contract.id, senderId: user.id, recipientIds: [data.buyerId, data.supplierId, data.exporterId].filter(Boolean).filter((id: string) => id !== user.id), message, createdAt: now })
    } else return Response.json({ ok: false, error: 'Action is not allowed in the current state' }, { status: 409 })
    await db.collection('activityLogs').add({ actorId: user.id, type: 'action_click', label: `${action} contract`, detail: contract.id, role: user.user_metadata.role, createdAt: now })
    return Response.json({ ok: true })
  } catch (error) { return jsonError(error) }
}
