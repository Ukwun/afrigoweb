import { jsonError, requireUser } from '@/lib/serverAuth'
import { isValidRole } from '@/lib/roles'

export async function POST(request: Request) {
  try {
    const { user, admin } = await requireUser(request)
    const form = await request.formData()
    const role = user.user_metadata?.role
    if (!isValidRole(role)) return Response.json({ ok:false,error:'Select a valid role first' },{status:400})
    const companyName=String(form.get('companyName')||'').trim(), country=String(form.get('country')||'').trim()
    if(!companyName||!country) return Response.json({ok:false,error:'Company name and country are required'},{status:400})
    const {data:company,error:companyError}=await admin.from('companies').insert({name:companyName,country,owner_id:user.id,kyc_status:'pending'}).select('id').single()
    if(companyError) throw companyError
    const {error:profileError}=await admin.from('users').upsert({id:user.id,email:user.email,display_name:user.user_metadata?.display_name||user.email,role,company_id:company.id,updated_at:new Date().toISOString()})
    if(profileError) throw profileError
    const files=form.getAll('documents').filter((value):value is File=>value instanceof File)
    if(!files.length) return Response.json({ok:false,error:'At least one KYC document is required'},{status:400})
    for(const file of files){
      if(file.size>20*1024*1024||!['application/pdf','image/jpeg','image/png'].includes(file.type)) return Response.json({ok:false,error:`Unsupported file: ${file.name}`},{status:400})
      const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'-'), path=`${user.id}/${crypto.randomUUID()}-${safe}`
      const {error:uploadError}=await admin.storage.from('kyc').upload(path,await file.arrayBuffer(),{contentType:file.type,upsert:false}); if(uploadError) throw uploadError
      const {error:docError}=await admin.from('documents').insert({owner_id:user.id,type:'kyc',status:'Submitted',storage_path:path,meta:{name:file.name,size:file.size,mimeType:file.type}}); if(docError){await admin.storage.from('kyc').remove([path]);throw docError}
    }
    await admin.from('activity_logs').insert({actor_id:user.id,type:'form_submit',label:'Completed onboarding',role,metadata:{company_id:company.id,document_count:files.length}})
    return Response.json({ok:true,companyId:company.id})
  } catch(error){return jsonError(error)}
}
