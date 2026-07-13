'use client'
import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabaseClient'

export default function ForgotPassword(){
  const [email,setEmail]=useState(''),[message,setMessage]=useState(''),[saving,setSaving]=useState(false)
  async function submit(event:FormEvent){event.preventDefault();setSaving(true);setMessage('');const client=getSupabaseClient();if(!client){setMessage('Password recovery is not configured.');setSaving(false);return}const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:`${location.origin}/reset-password`});setMessage(error?.message||'Check your email for a secure password reset link.');setSaving(false)}
  return <div className="mx-auto flex min-h-[70vh] max-w-md items-center"><form onSubmit={submit} className="w-full rounded-[2rem] border border-[var(--afrigo-border)] bg-white p-8 shadow-xl"><p className="text-sm font-semibold uppercase tracking-widest text-[var(--afrigo-secondary-gold)]">Account recovery</p><h1 className="mt-3 text-3xl font-black text-[var(--afrigo-primary-green)]">Reset your password</h1><p className="mt-3 text-sm text-[var(--afrigo-text-secondary)]">We will send a time-limited recovery link to your verified email.</p><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" className="mt-6 w-full rounded-2xl border border-[var(--afrigo-border)] px-4 py-3"/><button disabled={saving} className="mt-4 w-full rounded-2xl bg-[var(--afrigo-primary-green)] px-5 py-3 font-semibold text-white disabled:opacity-60">{saving?'Sending…':'Send recovery link'}</button>{message&&<p role="status" className="mt-4 text-sm text-[var(--afrigo-text-secondary)]">{message}</p>}<Link href="/sign-in" className="mt-6 block text-center text-sm font-semibold text-[var(--afrigo-primary-green)]">Back to sign in</Link></form></div>
}
