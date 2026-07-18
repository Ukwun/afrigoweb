import { jsonError } from '@/lib/serverAuth'
import { requireStaff } from '@/lib/staffAuth'
import { rateLimit } from '@/lib/rateLimit'

export async function POST(request:Request){try{
  rateLimit(request,'refund-approval',10);const {user,admin}=await requireStaff(request,'refunds:execute'),input=await request.json(),contractRef=admin.db.collection('contracts').doc(String(input.contractId||'')),contract=await contractRef.get(),data=contract.data()
  if(!contract.exists||data?.refundStatus!=='requested')return Response.json({ok:false,error:'No pending refund request exists'},{status:409})
  if(input.decision==='reject'){await contractRef.update({refundStatus:'rejected',refundReviewedBy:user.id,refundReviewReason:String(input.reason||'').slice(0,500),updatedAt:new Date()});return Response.json({ok:true,status:'rejected'})}
  const payments=await admin.db.collection('payments').where('contractId','==',contract.id).where('status','==','paid').limit(1).get(),payment=payments.docs[0],secret=process.env.PAYSTACK_SECRET_KEY
  if(!payment)return Response.json({ok:false,error:'Paid transaction not found'},{status:409});if(!secret)return Response.json({ok:false,error:'Refund provider is not configured'},{status:503})
  const response=await fetch('https://api.paystack.co/refund',{method:'POST',headers:{Authorization:`Bearer ${secret}`,'Content-Type':'application/json'},body:JSON.stringify({transaction:payment.data().providerReference,amount:Math.round(Number(data.amount)*100),currency:data.currency||'NGN',customer_note:String(input.reason||data.refundReason||'Approved marketplace refund').slice(0,255)})}),result=await response.json()
  if(!response.ok||!result.status)return Response.json({ok:false,error:result.message||'Refund execution failed'},{status:422})
  await contractRef.update({refundStatus:'processing',refundProviderId:result.data?.id||null,refundReviewedBy:user.id,updatedAt:new Date()});return Response.json({ok:true,status:'processing'})
}catch(error){return jsonError(error)}}
