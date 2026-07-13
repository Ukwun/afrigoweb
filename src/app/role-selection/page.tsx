'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth'
import { isValidRole } from '@/lib/roles'
import { useActivityTracker } from '@/lib/activityTracker'

const roles = [
  {
    name: 'Buyer',
    icon: '🛍️',
    description: 'Source products & manage procurement',
    features: ['Compare bids', 'Track suppliers', 'Manage RFQs', 'Monitor shipments']
  },
  {
    name: 'Seller',
    icon: '📦',
    description: 'Pitch offerings & manage inventory',
    features: ['Submit proposals', 'Track inventory', 'Manage contracts', 'View analytics']
  },
  {
    name: 'Exporter',
    icon: '✈️',
    description: 'Manage logistics & compliance',
    features: ['Track shipments', 'Manage documentation', 'Monitor compliance', 'Coordinate teams']
  }
]

const MotionDiv = motion.div as any
const MotionButton = motion.button as any

export default function RoleSelectionPage() {
  const router = useRouter()
  const tracker = useActivityTracker()
  const { user, isSignedIn, isDemo, createDemo, setRole } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const currentRole = user?.role || ''

  useEffect(() => {
    if (isDemo && currentRole) {
      router.prefetch('/dashboard')
    }
  }, [currentRole, router, isDemo])

  const startDemo = (role: string) => {
    if (!isValidRole(role)) {
      setError('Please select a valid preview role.')
      return
    }

    setError('')
    setLoading(role)
    createDemo(role)
    tracker.log('role_select', role, 'Demo mode')
    setLoading(null)
    router.push('/dashboard')
  }

  const selectRole = async (role: string) => {
    if (!isValidRole(role)) {
      setError('Please select a valid role.')
      return
    }

    if (!user?.id) {
      setError('No active session found. Please sign in again.')
      return
    }

    setError('')
    setLoading(role)

    try {
      await setRole(role)
      tracker.log('role_select', role, 'User selected trading role')
      router.push('/dashboard')
    } catch (cause: any) {
      setError(cause?.message || 'Unable to save role. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.3
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  }

  return (
    <MotionDiv
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-[var(--afrigo-bg)] px-4 py-12 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <MotionDiv
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-[var(--afrigo-secondary-gold)]">Choose Your Path</p>
          <h1 className="mt-4 text-5xl font-black text-[var(--afrigo-primary-green)]">Select Your Role</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--afrigo-text-secondary)]">Every trader has a different workflow. Select your role to unlock a dashboard tailored to your trade function and responsibilities.</p>
        </MotionDiv>

        {!isSignedIn ? (
          <>
            <MotionDiv
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mx-auto max-w-md space-y-6 rounded-3xl border border-[var(--afrigo-border)] bg-[var(--afrigo-surface)] p-8 shadow-xl text-center"
            >
              <div>
                <h2 className="text-2xl font-black text-[var(--afrigo-primary-green)]">Sign In Required</h2>
                <p className="mt-3 text-[var(--afrigo-text-secondary)]">You need to sign in to Afrigo before selecting a role. This ensures your preferences are securely saved to your account.</p>
              </div>
              <Link href="/sign-in" className="w-full rounded-2xl bg-gradient-to-r from-[var(--afrigo-primary-green)] to-[var(--afrigo-primary-green-hover)] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl">Sign in to continue</Link>
              <p className="text-sm text-[var(--afrigo-text-secondary)]">Already signed in? Refresh the page to continue.</p>
            </MotionDiv>

            <MotionDiv
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="mx-auto max-w-6xl space-y-8 rounded-3xl border border-[var(--afrigo-border)] bg-[var(--afrigo-surface)] p-8 shadow-xl"
            >
              <div className="text-center">
                <p className="text-sm font-semibold uppercase tracking-widest text-[var(--afrigo-secondary-gold)]">Preview Mode</p>
                <h2 className="mt-3 text-3xl font-black text-[var(--afrigo-primary-green)]">Try Afrigo without signing in</h2>
                <p className="mx-auto mt-4 max-w-2xl text-[var(--afrigo-text-secondary)]">Choose a role and explore the dashboard with preview data instantly.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {roles.map((role) => (
                  <MotionButton
                    key={role.name}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => startDemo(role.name)}
                    className="rounded-3xl border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] px-4 py-5 text-left transition hover:border-[var(--afrigo-primary-green)] hover:bg-[var(--afrigo-primary-green-hover)]/5"
                  >
                    <p className="text-3xl">{role.icon}</p>
                    <p className="mt-4 text-xl font-bold text-[var(--afrigo-primary-green)]">{role.name}</p>
                    <p className="mt-2 text-sm text-[var(--afrigo-text-secondary)]">{role.description}</p>
                    <p className="mt-4 text-sm font-semibold text-[var(--afrigo-secondary-gold)]">Explore this role →</p>
                  </MotionButton>
                ))}
              </div>
            </MotionDiv>
          </>
        ) : (
          <div className="space-y-10">
            {currentRole && (
              <MotionDiv
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="mx-auto max-w-md rounded-2xl border border-[var(--afrigo-primary-green)] bg-gradient-to-r from-[var(--afrigo-primary-green)]/10 to-[var(--afrigo-primary-green-hover)]/5 p-6 text-center"
              >
                <p className="text-sm font-semibold uppercase tracking-widest text-[var(--afrigo-primary-green)]">Current Role</p>
                <p className="mt-3 text-2xl font-black text-[var(--afrigo-primary-green)]">{currentRole}</p>
              </MotionDiv>
            )}

            <MotionDiv
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid gap-6 lg:grid-cols-3"
            >
              {roles.map((role) => (
                <MotionDiv
                  key={role.name}
                  variants={itemVariants}
                  whileHover={{ y: -8 }}
                  className="group relative overflow-hidden rounded-3xl border border-[var(--afrigo-border)] bg-[var(--afrigo-surface)] p-8 shadow-lg transition hover:shadow-2xl"
                >
                  <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-[var(--afrigo-primary-green-light)] opacity-10 blur-3xl transition group-hover:opacity-20" />

                  <div className="relative z-10 space-y-6">
                    <MotionDiv
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                      className="text-6xl"
                    >
                      {role.icon}
                    </MotionDiv>

                    <div className="space-y-3">
                      <h3 className="text-2xl font-black text-[var(--afrigo-primary-green)]">{role.name}</h3>
                      <p className="text-[var(--afrigo-text-secondary)]">{role.description}</p>
                    </div>

                    <ul className="space-y-2 border-t border-[var(--afrigo-border)] pt-6">
                      {role.features.map((feature, i) => (
                        <MotionDiv
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
                          className="flex items-center gap-3 text-sm text-[var(--afrigo-text-secondary)]"
                        >
                          <span className="text-[var(--afrigo-primary-green)]">✓</span>
                          {feature}
                        </MotionDiv>
                      ))}
                    </ul>

                    <MotionButton
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => selectRole(role.name)}
                      disabled={!!loading}
                      className={`w-full rounded-2xl py-3 font-semibold transition ${loading === role.name
                        ? 'cursor-wait bg-[var(--afrigo-text-secondary)] text-white opacity-70'
                        : currentRole === role.name
                        ? 'border-2 border-[var(--afrigo-primary-green)] bg-transparent text-[var(--afrigo-primary-green)]'
                        : 'bg-[var(--afrigo-primary-green)] text-white hover:bg-[var(--afrigo-primary-green-hover)]'}`}
                    >
                      {loading === role.name ? 'Saving...' : currentRole === role.name ? 'Selected' : 'Choose role'}
                    </MotionButton>
                  </div>
                </MotionDiv>
              ))}
            </MotionDiv>

            {error && <p className="text-center text-sm text-[var(--afrigo-error)]">{error}</p>}
          </div>
        )}
      </div>
    </MotionDiv>
  )
}
