export async function sendTransactionalEmail(to:string[],subject:string,html:string){
  const key=process.env.RESEND_API_KEY,from=process.env.TRANSACTIONAL_EMAIL_FROM
  if(!key||!from)return {sent:false,reason:'not_configured'}
  const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[...new Set(to.filter(Boolean))],subject,html})})
  const result=await response.json();if(!response.ok)throw new Error(result.message||'Notification delivery failed');return {sent:true,id:result.id}
}
