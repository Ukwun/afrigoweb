import { jsonError, requireUser } from '@/lib/serverAuth'
import { rateLimit } from '@/lib/rateLimit'

const allowedTypes = new Set(['application/pdf', 'image/jpeg', 'image/png'])

export async function POST(request: Request) {
  try {
    rateLimit(request, 'document-upload', 12)
    const { user, admin } = await requireUser(request)
    if (user.user_metadata.role !== 'Exporter') return Response.json({ ok: false, error: 'Exporter role required' }, { status: 403 })
    const form = await request.formData()
    const shipmentId = String(form.get('shipmentId') || '').trim()
    const documentType = String(form.get('documentType') || '').trim()
    const file = form.get('file')
    if (!shipmentId || !documentType || !(file instanceof File)) return Response.json({ ok: false, error: 'Shipment, document type and file are required' }, { status: 400 })
    if (file.size > 20 * 1024 * 1024 || !allowedTypes.has(file.type)) return Response.json({ ok: false, error: 'Only PDF, JPG and PNG files up to 20 MB are accepted' }, { status: 400 })
    const shipment = await admin.db.collection('shipments').doc(shipmentId).get()
    if (!shipment.exists || shipment.data()?.exporterId !== user.id) return Response.json({ ok: false, error: 'Shipment not found or not assigned to you' }, { status: 404 })
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
    const path = `trade-documents/${user.id}/${shipmentId}/${crypto.randomUUID()}-${safeName}`
    await admin.storage.bucket().file(path).save(Buffer.from(await file.arrayBuffer()), { contentType: file.type, resumable: false, metadata: { metadata: { ownerId: user.id, shipmentId } } })
    const record = await admin.db.collection('documents').add({ ownerId: user.id, shipmentId, type: documentType, status: 'Submitted', storagePath: path, meta: { name: file.name, size: file.size, mimeType: file.type }, createdAt: new Date() })
    await admin.db.collection('activityLogs').add({ actorId: user.id, type: 'form_submit', label: `Uploaded ${documentType}`, detail: record.id, role: 'Exporter', createdAt: new Date() })
    return Response.json({ ok: true, data: { id: record.id, shipmentId, type: documentType, status: 'Submitted' } }, { status: 201 })
  } catch (error) {
    return jsonError(error)
  }
}
