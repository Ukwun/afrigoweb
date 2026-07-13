import { jsonError, requireUser } from '@/lib/serverAuth'
import { rateLimit } from '@/lib/rateLimit'
export const dynamic = 'force-dynamic'

const resources = {
  rfqs: { owner: 'buyer_id', roles: ['Buyer'] }, lots: { owner: 'owner_id', roles: ['Seller'] }, bids: { owner: 'supplier_id', roles: ['Seller'] },
  pickups: { owner: 'exporter_id', roles: ['Exporter'] }, compliance_actions: { owner: 'owner_id', roles: ['Exporter'] },
  shipments: { owner: 'exporter_id', roles: ['Exporter'] }, payments: { owner: 'payer_id', roles: ['Buyer'] }
} as const

function resource(url: string) { const name = new URL(url).searchParams.get('resource') as keyof typeof resources; if (!resources[name]) throw new Response(JSON.stringify({ ok:false,error:'Invalid resource' }), { status:400 }); return { name, config: resources[name] } }
function assertRole(role: unknown, roles: readonly string[]) { if (!roles.includes(String(role))) throw new Response(JSON.stringify({ ok:false,error:'This action is not allowed for your role' }), { status:403 }) }

export async function GET(request: Request) {
  try { const { user, admin } = await requireUser(request); const { name } = resource(request.url); const { data, error } = await admin.from(name).select('*').order('created_at',{ascending:false}).limit(100); if(error) throw error; return Response.json({ok:true,data,user:{id:user.id,role:user.user_metadata?.role}}) } catch(error){ return jsonError(error) }
}
export async function POST(request: Request) {
  try { rateLimit(request, 'trade-write', 30) } catch (error) { return jsonError(error) }
  try { const { user, admin } = await requireUser(request); const { name, config } = resource(request.url); assertRole(user.user_metadata?.role, config.roles); const body=await request.json(); delete body.id; delete body.created_at; const row={...body,[config.owner]:user.id}; const {data,error}=await admin.from(name).insert(row).select().single(); if(error) throw error; await admin.from('activity_logs').insert({actor_id:user.id,type:'form_submit',label:`Created ${name}`,detail:data.id,role:user.user_metadata?.role}); return Response.json({ok:true,data},{status:201}) } catch(error){ return jsonError(error) }
}
export async function PATCH(request: Request) {
  try { const { user, admin } = await requireUser(request); const { name, config }=resource(request.url); assertRole(user.user_metadata?.role,config.roles); const body=await request.json(); const id=body.id; if(!id) return Response.json({ok:false,error:'Missing id'},{status:400}); delete body.id; delete body[config.owner]; const {data,error}=await admin.from(name).update(body).eq('id',id).eq(config.owner,user.id).select().single(); if(error) throw error; return Response.json({ok:true,data}) } catch(error){ return jsonError(error) }
}
