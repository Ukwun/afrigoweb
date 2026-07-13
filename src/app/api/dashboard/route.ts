import { jsonError, requireUser } from '@/lib/serverAuth'
import type { QuerySnapshot } from 'firebase-admin/firestore'

export const dynamic = 'force-dynamic'
const rows = (snapshot: QuerySnapshot) => snapshot.docs.map(document => ({ id: document.id, ...document.data() }))

export async function GET(request: Request) {
  try {
    const { user, admin } = await requireUser(request)
    const role = user.user_metadata.role
    const db = admin.db

    if (role === 'Buyer') {
      const rfqSnapshot = await db.collection('rfqs').where('buyerId', '==', user.id).get()
      const rfqs = rows(rfqSnapshot) as any[]
      const bids: any[] = []
      for (const rfq of rfqs) {
        const bidSnapshot = await db.collection('bids').where('rfqId', '==', rfq.id).get()
        bids.push(...rows(bidSnapshot).map((bid: any) => ({ ...bid, rfqTitle: rfq.title })))
      }
      const contracts = await db.collection('contracts').where('buyerId', '==', user.id).get()
      const shipments = await db.collection('shipments').where('buyerId', '==', user.id).get()
      return Response.json({ ok: true, role, rfqs, bids, contracts: rows(contracts), shipments: rows(shipments) })
    }

    if (role === 'Seller') {
      const [lots, rfqs, bids, contracts] = await Promise.all([
        db.collection('lots').where('ownerId', '==', user.id).get(),
        db.collection('rfqs').where('status', '==', 'Open').limit(100).get(),
        db.collection('bids').where('supplierId', '==', user.id).get(),
        db.collection('contracts').where('supplierId', '==', user.id).get()
      ])
      return Response.json({ ok: true, role, lots: rows(lots), rfqs: rows(rfqs), bids: rows(bids), contracts: rows(contracts) })
    }

    if (role === 'Exporter') {
      const [pickups, shipments, documents, compliance] = await Promise.all([
        db.collection('pickups').where('exporterId', '==', user.id).get(),
        db.collection('shipments').where('exporterId', '==', user.id).get(),
        db.collection('documents').where('ownerId', '==', user.id).get(),
        db.collection('compliance_actions').where('ownerId', '==', user.id).get()
      ])
      const contracts = await db.collection('contracts').where('exporterId', '==', user.id).get()
      return Response.json({ ok: true, role, pickups: rows(pickups), shipments: rows(shipments), documents: rows(documents), compliance: rows(compliance), contracts: rows(contracts) })
    }

    return Response.json({ ok: false, error: 'Select a role first' }, { status: 403 })
  } catch (error) {
    return jsonError(error)
  }
}
