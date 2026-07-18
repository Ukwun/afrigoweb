import { requireUser } from './serverAuth'
import { hasCapability,isStaffRole,OWNER_EMAIL,type StaffRole } from './staffRoles'

export async function requireStaff(request:Request,capability?:string){
  const context=await requireUser(request),email=context.user.email.toLowerCase()
  const role:StaffRole|undefined=email===OWNER_EMAIL?'super_admin':isStaffRole(context.user.claims.operationalRole)?context.user.claims.operationalRole:undefined
  if(!role||!context.user.emailVerified||capability&&!hasCapability(role,capability))throw new Response(JSON.stringify({ok:false,error:!context.user.emailVerified?'Verify your company email before accessing staff operations.':'You do not have permission for this operation.'}),{status:403,headers:{'content-type':'application/json'}})
  return{...context,staffRole:role}
}

export async function requireSuperAdmin(request:Request){const context=await requireStaff(request);if(context.staffRole!=='super_admin')throw new Response(JSON.stringify({ok:false,error:'Super administrator authorization required.'}),{status:403,headers:{'content-type':'application/json'}});return context}
