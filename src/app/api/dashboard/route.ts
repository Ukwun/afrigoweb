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
      const rfqSnapshot = await db.collection('rfqs').where('buyerId', '==', user.id).limit(100).get()
      const rfqs = rows(rfqSnapshot) as any[]
      const bids: any[] = []
      const titleById=new Map(rfqs.map(rfq=>[rfq.id,rfq.title]))
      for(let index=0;index<rfqs.length;index+=30){const ids=rfqs.slice(index,index+30).map(rfq=>rfq.id);if(ids.length){const bidSnapshot=await db.collection('bids').where('rfqId','in',ids).limit(300).get();bids.push(...rows(bidSnapshot).map((bid:any)=>({...bid,rfqTitle:titleById.get(bid.rfqId)})))}}
      const contracts = await db.collection('contracts').where('buyerId', '==', user.id).limit(100).get()
      const shipments = await db.collection('shipments').where('buyerId', '==', user.id).limit(100).get()
      const exportersSnapshot = await db.collection('users').where('role', '==', 'Exporter').limit(100).get()
      const exporters:any[]=[]
      for(const item of rows(exportersSnapshot) as any[]){const company=item.companyId?await db.collection('companies').doc(item.companyId).get():null;if(item.kycStatus==='verified'||item.verificationStatus==='verified'||company?.data()?.kycStatus==='verified')exporters.push({id:item.id,displayName:item.displayName||company?.data()?.name||'Verified Exporter',country:item.country||company?.data()?.country||''})}
      return Response.json({ ok: true, role, rfqs, bids, contracts: rows(contracts), shipments: rows(shipments), exporters })
    }

    if (role === 'Seller') {
      const [lots, rfqs, bids, contracts] = await Promise.all([
        db.collection('lots').where('ownerId', '==', user.id).limit(100).get(),
        db.collection('rfqs').where('status', '==', 'Open').limit(100).get(),
        db.collection('bids').where('supplierId', '==', user.id).limit(200).get(),
        db.collection('contracts').where('supplierId', '==', user.id).limit(100).get()
      ])
      const bidRows:any[] = rows(bids), contractRows:any[] = rows(contracts)
      const completed = contractRows.filter(item => item.status === 'completed' && item.paymentStatus === 'paid')
      const won = bidRows.filter(item => item.status === 'Awarded').length
      const payouts = await db.collection('payouts').where('sellerId', '==', user.id).limit(100).get()
      const payoutRows:any[] = rows(payouts)
      const metrics = { totalBids:bidRows.length, winRate:bidRows.length ? Math.round((won/bidRows.length)*100) : 0, revenue:completed.reduce((sum,item)=>sum+Number(item.amount||0),0), completedContracts:completed.length, paidOut:payoutRows.filter(item=>item.status==='success').reduce((sum,item)=>sum+Number(item.amount||0),0) }
      return Response.json({ ok: true, role, lots: rows(lots), rfqs: rows(rfqs), bids: bidRows, contracts: contractRows, payouts:payoutRows, metrics })
    }

    if (role === 'Exporter') {
      const [pickups, shipments, documents, compliance] = await Promise.all([
        db.collection('pickups').where('exporterId', '==', user.id).limit(100).get(),
        db.collection('shipments').where('exporterId', '==', user.id).limit(100).get(),
        db.collection('documents').where('ownerId', '==', user.id).limit(100).get(),
        db.collection('compliance_actions').where('ownerId', '==', user.id).limit(100).get()
      ])
      const contracts = await db.collection('contracts').where('exporterId', '==', user.id).limit(100).get()
      return Response.json({ ok: true, role, pickups: rows(pickups), shipments: rows(shipments), documents: rows(documents), compliance: rows(compliance), contracts: rows(contracts) })
    }

    return Response.json({ ok: false, error: 'Select a role first' }, { status: 403 })
  } catch (error) {
    return jsonError(error)
  }
}
