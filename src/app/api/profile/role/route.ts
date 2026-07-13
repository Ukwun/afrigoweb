import { jsonError, requireUser } from '@/lib/serverAuth'
import { isValidRole } from '@/lib/roles'
import { rateLimit } from '@/lib/rateLimit'

export async function POST(request:Request){try{rateLimit(request,'role-selection',10);const{user,admin}=await requireUser(request),{role}=await request.json();if(!isValidRole(role))return Response.json({ok:false,error:'Choose Buyer, Seller, or Exporter.'},{status:400});await admin.db.collection('users').doc(user.id).set({email:user.email,role,updatedAt:new Date()},{merge:true});await admin.db.collection('activityLogs').add({actorId:user.id,type:'role_select',label:`Selected ${role} role`,role,createdAt:new Date()});return Response.json({ok:true,role})}catch(error){return jsonError(error)}}
