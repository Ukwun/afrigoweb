'use client'

import Link from 'next/link'
import { useState } from 'react'
import RoleSelect from '../../modules/auth/RoleSelect'
import { useAuth } from '@/lib/auth'

export default function LoginPage() {
  const { user, isSignedIn, isDemo } = useAuth()
  const [hoverHint, setHoverHint] = useState('Choose a path to start your Afrigo workflow.')
  const role = user?.role || ''

  return (
    <div className="max-w-4xl mx-auto py-12">
      <div className="rounded-[2rem] border border-[var(--afrigo-border)] bg-[var(--afrigo-surface)] p-10 shadow-xl">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.35em] text-[var(--afrigo-secondary-gold)]">Authentication</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-[var(--afrigo-primary-green)]">Sign in, sign up, or preview trade workflows instantly.</h1>
          <p className="max-w-2xl text-[var(--afrigo-text-secondary)]">Afrigo is built for Buyer, Seller, and Exporter teams. Choose a secure login path, or use a role preview to inspect the live dashboard instantly.</p>
        </div>

        {!isSignedIn ? (
          <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Link href="/sign-in" className="rounded-3xl bg-[var(--afrigo-primary-green)] px-6 py-5 text-center text-base font-semibold text-white transition duration-200 hover:bg-[var(--afrigo-primary-green-hover)]">Sign in</Link>
                <Link href="/sign-up" className="rounded-3xl border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] px-6 py-5 text-center text-base font-semibold text-[var(--afrigo-text)] transition duration-200 hover:border-[var(--afrigo-primary-green)] hover:text-[var(--afrigo-primary-green)]">Sign up</Link>
              </div>
              <div className="rounded-[2rem] border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-[var(--afrigo-text)]">Role preview</h2>
                <p className="mt-3 text-[var(--afrigo-text-secondary)]">Launch Afrigo with a Buyer, Seller, or Exporter preview profile to explore the dashboard workflow.</p>
                <div className="mt-5">
                  <RoleSelect />
                </div>
              </div>
            </div>
            <div className="rounded-[2rem] border border-[var(--afrigo-border)] bg-[var(--afrigo-surface)] p-8 shadow-sm">
              <div className="text-sm uppercase tracking-[0.3em] text-[var(--afrigo-secondary-gold)]">Why choose Afrigo</div>
              <ul className="mt-6 space-y-4 text-[var(--afrigo-text-secondary)]">
                <li>• Role-based workflows for live trade operations</li>
                <li>• Secure, fast sign-in for local preview</li>
                <li>• Preview mode for fast workflow exploration and stakeholder review</li>
              </ul>
              <div className="mt-6 rounded-3xl bg-[var(--afrigo-primary-green-light)] p-4 text-sm text-[var(--afrigo-primary-green)]">Tip: Sign up once and select your live role on the next page.</div>
            </div>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="rounded-[2rem] border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] p-8 shadow-sm">
              <p className="text-sm uppercase tracking-[0.28em] text-[var(--afrigo-secondary-gold)]">Welcome back</p>
              <h2 className="mt-4 text-2xl font-semibold text-[var(--afrigo-text)]">Continue your workflow</h2>
              <p className="mt-3 text-[var(--afrigo-text-secondary)]">Your session is active. {role ? 'Your selected role is ' + role : 'You still need to choose a role to unlock the dashboard and onboarding.'}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={role ? '/dashboard' : '/role-selection'} className="rounded-2xl bg-[var(--afrigo-primary-green)] px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-[var(--afrigo-primary-green-hover)]">{role ? 'Open dashboard' : 'Choose my role'}</Link>
                <Link href="/onboarding" className="rounded-2xl border border-[var(--afrigo-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--afrigo-text)] transition duration-200 hover:border-[var(--afrigo-primary-green)]">Open onboarding</Link>
              </div>
            </div>
            <div className="rounded-[2rem] border border-[var(--afrigo-border)] bg-[var(--afrigo-surface)] p-8 shadow-sm">
              <div className="text-sm uppercase tracking-[0.28em] text-[var(--afrigo-secondary-gold)]">Session status</div>
              <p className="mt-4 text-[var(--afrigo-text-secondary)]">Your authenticated session is ready. If you are setting up a live work profile, select a role first so the platform can tailor the workflow.</p>
              <div className="mt-8 rounded-3xl bg-[var(--afrigo-bg)] p-4 text-sm text-[var(--afrigo-text-secondary)]">Hint: Buyer, Seller, and Exporter roles each unlock a different set of analytics and action cards.</div>
            </div>
          </div>
        )}

        <div className="mt-8 rounded-[2rem] border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] p-5 text-sm text-[var(--afrigo-text-secondary)]">
          <span className="font-semibold text-[var(--afrigo-primary-green)]">Hint:</span> {hoverHint}
        </div>
      </div>
    </div>
  )
}
