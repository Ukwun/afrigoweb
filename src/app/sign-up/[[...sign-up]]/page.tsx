'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { signUp } from '@/lib/auth'
import { useActivityTracker } from '@/lib/activityTracker'

const MotionDiv = motion.div as any
const MotionButton = motion.button as any

export default function SignUpPage() {
  const router = useRouter()
  const tracker = useActivityTracker()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('saving')
    setError('')

    try {
      const result = await signUp({ firstName, lastName, email, password })

      // Track successful signup
      tracker.log('auth_signup', `${firstName} ${lastName}`, email)
      if (result.needsVerification) {
        setStatus('success')
        setError('Account created. Check your email and verify your address before signing in.')
      } else {
        router.push('/role-selection')
      }
    } catch (error: any) {
      setStatus('error')
      setError(error?.message || 'Unable to create account. Please try again.')
      tracker.log('auth_signup', 'failed', error?.message || 'Unknown error')
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(98,181,92,0.15),_transparent_30%),var(--afrigo-bg)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-8 lg:flex-row lg:items-center">
        <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:gap-8">
          <div className="rounded-[2.5rem] border border-[var(--afrigo-border)] bg-[var(--afrigo-surface)] p-10 shadow-2xl">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-[var(--afrigo-primary-green)] to-[var(--afrigo-primary-green-hover)] text-4xl font-black text-white shadow-xl">A</div>
            <div className="mt-6 space-y-4">
              <h2 className="text-4xl font-black text-[var(--afrigo-primary-green)]">Join Afrigo</h2>
              <p className="text-lg leading-relaxed text-[var(--afrigo-text-secondary)]">Create your account to start your export trading journey. Choose your role and unlock a workspace tailored to your trade function.</p>
            </div>
            <div className="mt-8 space-y-4">
              {[
                { icon: '✓', title: 'Create Account', desc: 'Fast registration for local preview' },
                { icon: '🎯', title: 'Select Role', desc: 'Buyer, Seller, or Exporter workflows' },
                { icon: '🚀', title: 'Start Trading', desc: 'Open your dashboard instantly' }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 rounded-3xl border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] p-5 shadow-sm">
                  <span className="text-3xl">{item.icon}</span>
                  <div>
                    <p className="font-semibold text-[var(--afrigo-text)]">{item.title}</p>
                    <p className="text-sm text-[var(--afrigo-text-secondary)]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 text-sm text-[var(--afrigo-text-secondary)]">
              <p>
                Already have an account? <Link href="/sign-in" className="font-semibold text-[var(--afrigo-primary-green)] hover:underline">Sign in</Link>
              </p>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2">
          <div className="overflow-hidden rounded-[2.5rem] border border-[var(--afrigo-border)] bg-[var(--afrigo-surface)] p-8 shadow-[0_32px_80px_rgba(20,44,12,0.08)] sm:p-10">
            <div className="mb-8 space-y-3">
              <p className="text-sm font-semibold uppercase tracking-widest text-[var(--afrigo-secondary-gold)]">→ Create Account</p>
              <h1 className="text-3xl font-black text-[var(--afrigo-primary-green)]">Sign up</h1>
              <p className="text-sm text-[var(--afrigo-text-secondary)]">Join the platform trusted by export traders worldwide. Registration takes just minutes.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-[var(--afrigo-text)]">First name</span>
                  <input value={firstName} onChange={(event) => setFirstName(event.target.value)} className="mt-2 w-full rounded-2xl border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] px-4 py-3 text-[var(--afrigo-text)] outline-none transition focus:border-[var(--afrigo-primary-green)] focus:ring-2 focus:ring-[var(--afrigo-primary-green)]/20" placeholder="First name" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-[var(--afrigo-text)]">Last name</span>
                  <input value={lastName} onChange={(event) => setLastName(event.target.value)} className="mt-2 w-full rounded-2xl border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] px-4 py-3 text-[var(--afrigo-text)] outline-none transition focus:border-[var(--afrigo-primary-green)] focus:ring-2 focus:ring-[var(--afrigo-primary-green)]/20" placeholder="Last name" />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-medium text-[var(--afrigo-text)]">Email address</span>
                <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="mt-2 w-full rounded-2xl border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] px-4 py-3 text-[var(--afrigo-text)] outline-none transition focus:border-[var(--afrigo-primary-green)] focus:ring-2 focus:ring-[var(--afrigo-primary-green)]/20" placeholder="you@example.com" />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-[var(--afrigo-text)]">Password</span>
                <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" className="mt-2 w-full rounded-2xl border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] px-4 py-3 text-[var(--afrigo-text)] outline-none transition focus:border-[var(--afrigo-primary-green)] focus:ring-2 focus:ring-[var(--afrigo-primary-green)]/20" placeholder="Create a password" />
              </label>

              {error ? <p role="status" className={`rounded-xl p-3 text-sm ${status === 'success' ? 'bg-[var(--afrigo-success-light)] text-[var(--afrigo-success)]' : 'bg-[var(--afrigo-error-light)] text-[var(--afrigo-error)]'}`}>{error}</p> : null}

              <div className="space-y-4">
                <MotionButton type="submit" whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} className="w-full rounded-full bg-gradient-to-r from-[var(--afrigo-primary-green)] to-[var(--afrigo-primary-green-hover)] px-6 py-4 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70">
                  {status === 'saving' ? 'Creating account…' : 'Create account'}
                </MotionButton>
                <p className="text-center text-sm text-[var(--afrigo-text-secondary)]">Already have an account? <Link href="/sign-in" className="font-semibold text-[var(--afrigo-primary-green)] hover:underline">Sign in</Link></p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
