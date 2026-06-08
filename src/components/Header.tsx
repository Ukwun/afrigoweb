'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth'

const MotionDiv = motion.div as any
const MotionButton = motion.button as any

export default function Header() {
  const { user, isSignedIn, isDemo, signOut } = useAuth()
  const router = useRouter()

  return (
    <header className="sticky top-0 z-30 bg-[var(--afrigo-surface)]/95 backdrop-blur-xl shadow-sm border-b border-[var(--afrigo-border)]">
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-3 p-4">
        <Link href="/" className="flex items-center gap-3 text-xl font-semibold text-[var(--afrigo-primary-green)]">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-[var(--afrigo-primary-green-light)] text-2xl">A</span>
          Afrigo
        </Link>

        <div className="hidden flex-1 items-center justify-center gap-4 text-sm text-[var(--afrigo-text-secondary)] md:flex">
          <MotionDiv whileHover={{ y: -1 }} transition={{ duration: 0.15 }}>
            <Link href="/dashboard" className="rounded-full px-3 py-2 transition hover:bg-[var(--afrigo-primary-green-light)] hover:text-[var(--afrigo-primary-green)]">Dashboard</Link>
          </MotionDiv>
          <MotionDiv whileHover={{ y: -1 }} transition={{ duration: 0.15 }}>
            <Link href="/onboarding" className="rounded-full px-3 py-2 transition hover:bg-[var(--afrigo-primary-green-light)] hover:text-[var(--afrigo-primary-green)]">Onboarding</Link>
          </MotionDiv>
          <MotionDiv whileHover={{ y: -1 }} transition={{ duration: 0.15 }}>
            <Link href="/login" className="rounded-full px-3 py-2 transition hover:bg-[var(--afrigo-primary-green-light)] hover:text-[var(--afrigo-primary-green)]">Sign in</Link>
          </MotionDiv>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-full bg-[var(--afrigo-primary-green-light)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--afrigo-primary-green)] md:inline-flex">
            {isDemo ? 'Preview session' : 'Instant preview'}
          </div>

          {!isSignedIn ? (
            <Link href="/sign-in">
              <MotionButton whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} initial={{ scale: 0.98 }} animate={{ scale: 1 }} transition={{ duration: 0.15 }} className="rounded-2xl bg-[var(--afrigo-primary-green)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--afrigo-primary-green-hover)]">
                Sign in
              </MotionButton>
            </Link>
          ) : (
            <>
              <div className="hidden rounded-full border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] px-3 py-2 text-sm text-[var(--afrigo-text-secondary)] md:inline-flex">
                {user?.displayName || 'User'}
              </div>
              <MotionButton
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="rounded-2xl border border-[var(--afrigo-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--afrigo-text)] transition hover:bg-[var(--afrigo-bg)]"
                onClick={() => {
                  signOut()
                  router.push('/')
                }}
              >
                Sign out
              </MotionButton>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
