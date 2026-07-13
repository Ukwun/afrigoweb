import { jsonError, requireUser } from '@/lib/serverAuth'
import { rateLimit } from '@/lib/rateLimit'

export async function POST(request:Request){try{
  rateLimit(request,'settlement',5); const {user,admin,profile}=await requireUser(request)
  if(user.user_metadata.role!=='Seller')return Response.json({ok:false,error:'Seller role required'},{status:403})
  const {accountNumber,bankCode}=await request.json(), account=String(accountNumber||'').replace(/\D/g,''), bank=String(bankCode||'').trim(), secret=process.env.PAYSTACK_SECRET_KEY
  if(account.length<8||!bank)return Response.json({ok:false,error:'Valid account number and bank code are required'},{status:400})
  if(!secret)return Response.json({ok:false,error:'Payout provider is not configured'},{status:503})
  const response=await fetch('https://api.paystack.co/transferrecipient',{method:'POST',headers:{Authorization:`Bearer ${secret}`,'Content-Type':'application/json'},body:JSON.stringify({type:'nuban',name:profile?.displayName||user.email,account_number:account,bank_code:bank,currency:'NGN'})}), result=await response.json()
  if(!response.ok||!result.status)return Response.json({ok:false,error:result.message||'Could not verify settlement account'},{status:422})
  await admin.db.collection('users').doc(user.id).set({settlement:{recipientCode:result.data.recipient_code,accountLast4:account.slice(-4),bankCode:bank,verifiedAt:new Date()},updatedAt:new Date()},{merge:true})
  return Response.json({ok:true,accountLast4:account.slice(-4),bankCode:bank})
}catch(error){return jsonError(error)}}
