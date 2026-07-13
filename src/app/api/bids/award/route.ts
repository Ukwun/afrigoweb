import { jsonError, requireUser } from '@/lib/serverAuth'
import { rateLimit } from '@/lib/rateLimit'

export async function POST(request: Request) {
  try {
    rateLimit(request, 'bid-award', 10)
    const { user, admin } = await requireUser(request)
    if (user.user_metadata.role !== 'Buyer') return Response.json({ ok: false, error: 'Buyer role required' }, { status: 403 })
    const { bidId } = await request.json()
    const db = admin.db, bidRef = db.collection('bids').doc(String(bidId || '')), contractRef = db.collection('contracts').doc()

    await db.runTransaction(async transaction => {
      const bid = await transaction.get(bidRef)
      if (!bid.exists || bid.data()?.status !== 'Submitted') throw new Error('This bid is no longer available')
      const bidData = bid.data()!, rfqRef = db.collection('rfqs').doc(bidData.rfqId), rfq = await transaction.get(rfqRef)
      if (!rfq.exists || rfq.data()?.buyerId !== user.id) throw new Error('You cannot award this bid')
      if (rfq.data()?.status !== 'Open') throw new Error('This RFQ has already been closed')
      const price = Number(bidData.price), quantity = Number(rfq.data()?.quantity)
      if (!Number.isFinite(price) || !Number.isFinite(quantity) || price <= 0 || quantity <= 0) throw new Error('Bid or RFQ amount is invalid')
      if (!bidData.lotId) throw new Error('This legacy bid is not linked to inventory and cannot be awarded')
      const lotRef = db.collection('lots').doc(bidData.lotId), lot = await transaction.get(lotRef)
      if (!lot.exists || lot.data()?.ownerId !== bidData.supplierId || lot.data()?.status !== 'active' || Number(lot.data()?.quantity) < quantity) throw new Error('The inventory lot is no longer available')
      const remaining = Number(lot.data()?.quantity) - quantity
      transaction.set(contractRef, { rfqId: rfq.id, bidId: bid.id, inventoryLotId: lot.id, quantity, buyerId: user.id, supplierId: bidData.supplierId, amount: price * quantity, currency: bidData.currency || 'USD', status: 'pending', paymentStatus: 'not_started', payoutStatus: 'pending', createdAt: new Date(), updatedAt: new Date() })
      transaction.update(lotRef, { quantity: remaining, status: remaining === 0 ? 'archived' : 'active', reservedForContractId: contractRef.id, updatedAt: new Date() })
      transaction.update(bidRef, { status: 'Awarded', updatedAt: new Date() })
      transaction.update(rfqRef, { status: 'Awarded', awardedBidId: bid.id, updatedAt: new Date() })
    })

    await db.collection('activityLogs').add({ actorId: user.id, type: 'form_submit', label: 'Awarded supplier bid', detail: String(bidId), role: 'Buyer', createdAt: new Date() })
    return Response.json({ ok: true, contractId: contractRef.id })
  } catch (error) { return jsonError(error) }
}
