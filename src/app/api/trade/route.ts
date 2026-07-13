import { jsonError, requireUser } from '@/lib/serverAuth'
import { rateLimit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'
const resources = {
  rfqs: { owner: 'buyerId', role: 'Buyer' },
  lots: { owner: 'ownerId', role: 'Seller' },
  bids: { owner: 'supplierId', role: 'Seller' },
  pickups: { owner: 'exporterId', role: 'Exporter' },
  compliance_actions: { owner: 'ownerId', role: 'Exporter' }
} as const
type Resource = keyof typeof resources

function getResource(url: string) {
  const name = new URL(url).searchParams.get('resource') as Resource
  if (!resources[name]) throw new Response(JSON.stringify({ ok: false, error: 'Invalid resource' }), { status: 400, headers: { 'content-type': 'application/json' } })
  return { name, config: resources[name] }
}
const text = (value: unknown, max = 240) => String(value || '').trim().slice(0, max)
const positive = (value: unknown) => { const number = Number(value); return Number.isFinite(number) && number > 0 ? number : null }

export async function GET(request: Request) {
  try {
    const { user, admin } = await requireUser(request)
    const { name, config } = getResource(request.url)
    if (user.user_metadata.role !== config.role) return Response.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    const snapshot = await admin.db.collection(name).where(config.owner, '==', user.id).limit(100).get()
    return Response.json({ ok: true, data: snapshot.docs.map(document => ({ id: document.id, ...document.data() })) })
  } catch (error) { return jsonError(error) }
}

export async function POST(request: Request) {
  try {
    rateLimit(request, 'trade-write', 30)
    const { user, admin, profile } = await requireUser(request)
    const { name, config } = getResource(request.url)
    if (user.user_metadata.role !== config.role) return Response.json({ ok: false, error: 'This action is not allowed for your role' }, { status: 403 })
    const input = await request.json()
    let data: Record<string, unknown>

    if (name === 'rfqs') {
      const title = text(input.title, 120), quantity = positive(input.quantity), destination = text(input.destination_country, 80)
      if (!title || !quantity || !destination) return Response.json({ ok: false, error: 'Product, quantity and destination are required' }, { status: 400 })
      data = { title, quantity, unit: text(input.unit, 24) || 'units', destination_country: destination, budget: text(input.budget, 80), deadline: text(input.deadline, 20) || null, description: text(input.description, 1200), buyerName: profile?.displayName || user.email, status: 'Open' }
    } else if (name === 'lots') {
      const title = text(input.title, 120), quantity = positive(input.quantity), price = positive(input.price)
      if (!title || !quantity || !price) return Response.json({ ok: false, error: 'Product, quantity and price are required' }, { status: 400 })
      data = { title, quantity, price, unit: text(input.unit, 24) || 'kg', grade: text(input.grade, 80), origin: text(input.origin, 80), description: text(input.description, 1200), status: 'active' }
    } else if (name === 'bids') {
      const rfqId = text(input.rfqId, 128), lotId = text(input.lotId, 128), price = positive(input.price)
      if (!rfqId || !lotId || !price) return Response.json({ ok: false, error: 'RFQ, inventory lot and price are required' }, { status: 400 })
      const rfq = await admin.db.collection('rfqs').doc(rfqId).get()
      if (!rfq.exists || rfq.data()?.status !== 'Open') return Response.json({ ok: false, error: 'This RFQ is no longer open' }, { status: 409 })
      const lot = await admin.db.collection('lots').doc(lotId).get()
      if (!lot.exists || lot.data()?.ownerId !== user.id || lot.data()?.status !== 'active') return Response.json({ ok: false, error: 'Select one of your active inventory lots' }, { status: 400 })
      if (Number(lot.data()?.quantity) < Number(rfq.data()?.quantity)) return Response.json({ ok: false, error: 'The selected lot does not have enough available inventory' }, { status: 409 })
      const existing = await admin.db.collection('bids').where('rfqId', '==', rfqId).where('supplierId', '==', user.id).limit(1).get()
      if (!existing.empty) return Response.json({ ok: false, error: 'You already submitted a bid for this RFQ' }, { status: 409 })
      data = { rfqId, lotId, reservedQuantity: Number(rfq.data()?.quantity), price, currency: text(input.currency, 8) || 'USD', delivery: text(input.delivery, 120), terms: text(input.terms, 1000), supplierName: profile?.displayName || user.email, status: 'Submitted' }
    } else if (name === 'pickups') {
      const warehouse = text(input.warehouse_location, 180), containers = positive(input.container_count), date = text(input.preferred_date, 20)
      if (!warehouse || !containers || !date) return Response.json({ ok: false, error: 'Warehouse, container count and date are required' }, { status: 400 })
      data = { warehouse_location: warehouse, container_count: Math.floor(containers), estimated_weight: text(input.estimated_weight, 80), preferred_date: date, carrier: text(input.carrier, 120), status: 'Scheduled' }
    } else {
      const category = text(input.category, 120), requirement = text(input.requirement, 300)
      if (!category || !requirement) return Response.json({ ok: false, error: 'Category and requirement are required' }, { status: 400 })
      data = { category, requirement, dueDate: text(input.dueDate, 20) || null, status: 'Pending' }
    }

    const reference = await admin.db.collection(name).add({ ...data, [config.owner]: user.id, createdAt: new Date(), updatedAt: new Date() })
    await admin.db.collection('activityLogs').add({ actorId: user.id, type: 'form_submit', label: `Created ${name}`, detail: reference.id, role: user.user_metadata.role, createdAt: new Date() })
    return Response.json({ ok: true, data: { id: reference.id, ...data } }, { status: 201 })
  } catch (error) { return jsonError(error) }
}

export async function PATCH(request: Request) {
  try {
    rateLimit(request, 'trade-write', 30)
    const { user, admin } = await requireUser(request)
    const { name, config } = getResource(request.url)
    if (user.user_metadata.role !== config.role) return Response.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    const input = await request.json(), reference = admin.db.collection(name).doc(text(input.id, 128)), snapshot = await reference.get()
    if (!snapshot.exists || snapshot.data()?.[config.owner] !== user.id) return Response.json({ ok: false, error: 'Not found' }, { status: 404 })
    const allowed: Record<Resource, string[]> = { rfqs: ['description', 'deadline', 'budget'], lots: ['quantity', 'price', 'grade', 'description', 'status'], bids: ['delivery', 'terms'], pickups: ['preferred_date', 'carrier'], compliance_actions: ['status', 'dueDate'] }
    const updates = Object.fromEntries(allowed[name].filter(key => input[key] !== undefined).map(key => [key, typeof input[key] === 'string' ? text(input[key], 1200) : input[key]]))
    await reference.update({ ...updates, updatedAt: new Date() })
    return Response.json({ ok: true, data: { id: reference.id, ...updates } })
  } catch (error) { return jsonError(error) }
}
