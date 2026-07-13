'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { signIn } from '@/lib/auth'
import { useActivityTracker } from '@/lib/activityTracker'

const MotionDiv = motion.div as any
const MotionButton = motion.button as any

export default function SignInPage() {
  const router = useRouter()
  const tracker = useActivityTracker()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('saving')
    setError('')

    try {
      await signIn({ email, password })
      tracker.log('auth_signin', 'User logged in', email)
      router.push('/role-selection')
    } catch (error: any) {
      setStatus('error')
      setError(error?.message || 'Unable to sign in. Please check your email and password.')
      tracker.log('auth_signin', 'failed', error?.message || 'Unknown error')
    }
  }

  return (
    <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="min-h-screen bg-[var(--afrigo-bg)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center">
        <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }} className="w-full lg:w-1/2">
          <div className="rounded-[2.5rem] border border-[var(--afrigo-border)] bg-[var(--afrigo-surface)] p-10 shadow-2xl sm:p-12">
            <div className="mb-8 space-y-3">
              <p className="text-sm font-semibold uppercase tracking-widest text-[var(--afrigo-secondary-gold)]">← Secure Login</p>
              <h1 className="text-3xl font-black text-[var(--afrigo-primary-green)]">Sign in</h1>
              <p className="text-sm text-[var(--afrigo-text-secondary)]">Use your email and password to access your account. After signing in, select your role to continue.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <label className="block">
                <span className="text-sm font-medium text-[var(--afrigo-text)]">Email address</span>
                <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="mt-2 w-full rounded-2xl border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] px-4 py-3 text-[var(--afrigo-text)] outline-none transition focus:border-[var(--afrigo-primary-green)] focus:ring-2 focus:ring-[var(--afrigo-primary-green)]/20" placeholder="you@example.com" />
              </label>
              <div className="text-right"><Link href="/forgot-password" className="text-sm font-semibold text-[var(--afrigo-primary-green)] hover:underline">Forgot password?</Link></div>

              <label className="block">
                <span className="text-sm font-medium text-[var(--afrigo-text)]">Password</span>
                <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" className="mt-2 w-full rounded-2xl border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] px-4 py-3 text-[var(--afrigo-text)] outline-none transition focus:border-[var(--afrigo-primary-green)] focus:ring-2 focus:ring-[var(--afrigo-primary-green)]/20" placeholder="Your password" />
              </label>

              {error ? <p className="text-sm text-[var(--afrigo-error)]">{error}</p> : null}

              <MotionButton type="submit" whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} className="w-full rounded-full bg-gradient-to-r from-[var(--afrigo-primary-green)] to-[var(--afrigo-primary-green-hover)] px-6 py-4 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70">
                {status === 'saving' ? 'Signing in…' : 'Sign in'}
              </MotionButton>
            </form>

            <div className="mt-6 text-center text-sm text-[var(--afrigo-text-secondary)]">
              <p>New to Afrigo? <Link href="/sign-up" className="font-semibold text-[var(--afrigo-primary-green)] hover:underline">Create account</Link></p>
            </div>
          </div>
        </MotionDiv>
      </div>
    </MotionDiv>
  )
}
