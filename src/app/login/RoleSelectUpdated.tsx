'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { motion } from 'framer-motion'

const roles = ['Buyer', 'Seller', 'Exporter']
const MotionButton = motion.button as any

export default function RoleSelectUpdated() {
  const router = useRouter()
  const [loadingRole, setLoadingRole] = useState<string | null>(null)

  async function pickRole(role: string) {
    setLoadingRole(role)
    const user_id = localStorage.getItem('afrigo:user_id') || crypto.randomUUID()
    localStorage.setItem('afrigo:user_id', user_id)

    try {
      await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id, email: `${user_id}@local.local`, role, display_name: user_id, company: { id: crypto.randomUUID(), name: 'My Company' } })
      })
    } catch (e) {
      console.error(e)
    }

    setLoadingRole(null)
    localStorage.setItem('afrigo:role', role)
    router.push('/dashboard')
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {roles.map((r) => (
        <MotionButton
          key={r}
          whileHover={{ y: -4, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.18 }}
          className={`p-6 bg-[var(--afrigo-surface)] rounded-3xl border border-[var(--afrigo-border)] shadow-sm transition duration-200 ease-out hover:shadow-md text-left ${loadingRole===r ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
          onClick={() => pickRole(r)}
          disabled={!!loadingRole}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-[var(--afrigo-text)]">{r}</h3>
              <p className="text-sm text-[var(--afrigo-text-secondary)] mt-1">Open dashboard for {r} workflows</p>
            </div>
            <div className="ml-4 w-10 h-10 rounded-2xl bg-[var(--afrigo-primary-green-light)] text-[var(--afrigo-primary-green)] flex items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2l3 7h7l-5.5 4 2 8L12 17l-6.5 4 2-8L2 9h7l3-7z"></path></svg>
            </div>
          </div>
          {loadingRole===r && <div className="mt-3 text-sm text-[var(--afrigo-primary-green)]">Saving...</div>}
        </MotionButton>
      ))}
    </div>
  )
}
