import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
export const dynamic='force-dynamic'
export async function GET(){const started=Date.now(),admin=getSupabaseAdmin();if(!admin)return Response.json({ok:false,service:'afrigo',database:'not_configured'},{status:503});const {error}=await admin.from('users').select('id',{head:true,count:'exact'}).limit(1);return Response.json({ok:!error,service:'afrigo',database:error?'unavailable':'ready',latencyMs:Date.now()-started},{status:error?503:200})}
