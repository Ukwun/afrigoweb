'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth'
import { getSupabaseClient } from '@/lib/supabaseClient'
import { isValidRole, normalizeRole, Role } from '@/lib/roles'
import { useActivityTracker } from '@/lib/activityTracker'

const MotionDiv = motion.div as any
const MotionButton = motion.button as any

type UpdateEvent = {
  message: string
  ts: number
  status?: string
}

type DashboardTask = {
  label: string
  detail: string
  status: 'Pending' | 'In progress' | 'Complete'
  progress: number
  icon: string
}

type KPI = {
  label: string
  value: string | number
  change: string
  trend: 'up' | 'down' | 'neutral'
  icon: string
}

type PrimaryAction = {
  label: string
  detail: string
  icon: string
  color: string
}

const dashboardsByRole: Record<Role, {
  hero: string
  primaryActions: PrimaryAction[]
  kpis: KPI[]
  tasks: DashboardTask[]
}> = {
  Buyer: {
    hero: 'Buyer Dashboard',
    primaryActions: [
      { label: 'Create RFQ', detail: 'Request for Quotation', icon: '📝', color: 'from-blue-500 to-blue-600' },
      { label: 'Compare Bids', detail: 'Review supplier proposals', icon: '⚖️', color: 'from-purple-500 to-purple-600' },
      { label: 'Track Shipment', detail: 'Monitor delivery', icon: '🚚', color: 'from-green-500 to-green-600' }
    ],
    kpis: [
      { label: 'Live RFQs', value: 24, change: '+12%', trend: 'up', icon: '📊' },
      { label: 'Avg Response', value: '2.4h', change: '-15%', trend: 'up', icon: '⏱️' },
      { label: 'Supplier Pool', value: 47, change: '+8', trend: 'up', icon: '👥' },
      { label: 'Approval Rate', value: '94%', change: '+3%', trend: 'up', icon: '✅' }
    ],
    tasks: [
      { label: 'Review 12 new supplier bids', detail: 'Compare pricing, delivery, and terms', status: 'Pending', progress: 35, icon: '🔍' },
      { label: 'Approve PO for Widget batch', detail: 'Release purchase order #2847', status: 'Pending', progress: 60, icon: '🧾' },
      { label: 'Confirm shipping details', detail: 'Verify ETA and customs documentation', status: 'In progress', progress: 80, icon: '📦' }
    ]
  },
  Seller: {
    hero: 'Seller Dashboard',
    primaryActions: [
      { label: 'Submit Quote', detail: 'New commercial proposal', icon: '✉️', color: 'from-emerald-500 to-emerald-600' },
      { label: 'Manage Inventory', detail: 'Update stock levels', icon: '📦', color: 'from-orange-500 to-orange-600' },
      { label: 'View Analytics', detail: 'Sales performance', icon: '📈', color: 'from-cyan-500 to-cyan-600' }
    ],
    kpis: [
      { label: 'Active Quotes', value: 18, change: '+5', trend: 'up', icon: '💬' },
      { label: 'Win Rate', value: '67%', change: '+8%', trend: 'up', icon: '🎯' },
      { label: 'Inventory', value: '2.4K units', change: '-120', trend: 'down', icon: '📦' },
      { label: 'Revenue MTD', value: '$124K', change: '+22%', trend: 'up', icon: '💰' }
    ],
    tasks: [
      { label: 'Upload product certifications', detail: 'Quality and origin certificates', status: 'Pending', progress: 25, icon: '🏅' },
      { label: 'Respond to 5 RFQs', detail: 'Prepare competitive quotes', status: 'Pending', progress: 40, icon: '💭' },
      { label: 'Confirm warehouse availability', detail: 'Verify stock for 3 pending orders', status: 'In progress', progress: 75, icon: '🏭' }
    ]
  },
  Exporter: {
    hero: 'Exporter Command Center',
    primaryActions: [
      { label: 'File Export Docs', detail: 'Customs documentation', icon: '📄', color: 'from-rose-500 to-rose-600' },
      { label: 'Schedule Pickup', detail: 'Logistics & transport', icon: '🛳️', color: 'from-indigo-500 to-indigo-600' },
      { label: 'Monitor Compliance', detail: 'Regulatory status', icon: '✅', color: 'from-teal-500 to-teal-600' }
    ],
    kpis: [
      { label: 'Shipments Active', value: 8, change: '+2', trend: 'up', icon: '🚢' },
      { label: 'Compliance Rate', value: '99.2%', change: '+0.8%', trend: 'up', icon: '🔒' },
      { label: 'Avg Clearance', value: '3.2 days', change: '-0.8', trend: 'up', icon: '⏰' },
      { label: 'Docs Pending', value: 4, change: '-1', trend: 'up', icon: '📋' }
    ],
    tasks: [
      { label: 'Finalize export manifests', detail: 'Complete 2 pending shipment manifests', status: 'Pending', progress: 45, icon: '📝' },
      { label: 'Submit customs filings', detail: 'File compliance data for port clearance', status: 'Pending', progress: 20, icon: '🏛️' },
      { label: 'Confirm carrier booking', detail: 'Lock freight capacity for 3 containers', status: 'In progress', progress: 90, icon: '📞' }
    ]
  }
}

const commonTools = [
  { label: 'View Compliance Docs', icon: '🧾', detail: 'Access all compliance and legal documents' },
  { label: 'Check Payment Status', icon: '💰', detail: 'Monitor payment milestones and approvals' },
  { label: 'Review Shipment Timeline', icon: '⏱️', detail: 'Track ETA and logistics updates' },
  { label: 'Open Account Notes', icon: '🗒️', detail: 'Read team briefing notes and updates' },
  { label: 'Message Support Team', icon: '💬', detail: 'Contact your dedicated account manager' },
  { label: 'Export Report', icon: '📊', detail: 'Download period activity and metrics' }
]

export default function Dashboard() {
  const { user, isSignedIn, isDemo } = useAuth()
  const tracker = useActivityTracker()
  const [updates, setUpdates] = useState<UpdateEvent[]>([])
  const [statusMessage, setStatusMessage] = useState('Live')
  const [mounted, setMounted] = useState(false)
  const [demoRole, setDemoRole] = useState<Role | null>(null)
  const [displayName, setDisplayName] = useState('Guest')
  const [selectedAction, setSelectedAction] = useState<PrimaryAction | null>(null)
  const [selectedTaskIndex, setSelectedTaskIndex] = useState<number | null>(null)
  const [openToolIndex, setOpenToolIndex] = useState<number | null>(0)
  const [actionFeedback, setActionFeedback] = useState('Choose an action to explore your workflow.')
  const sourceRef = useRef<EventSource | null>(null)

  const [kpiList, setKpiList] = useState<KPI[]>([])
  const [taskList, setTaskList] = useState<DashboardTask[]>([])
  const [activeActionPanel, setActiveActionPanel] = useState<PrimaryAction | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionCompleted, setActionCompleted] = useState(false)
  const [actionProgress, setActionProgress] = useState(0)

  const addUpdate = (event: UpdateEvent) => {
    setUpdates((prev) => [event, ...prev].slice(0, 10))
  }

  const connectStream = () => {
    if (sourceRef.current) sourceRef.current.close()
    const source = new EventSource('/api/dashboard/stream')
    sourceRef.current = source

    source.onopen = () => setStatusMessage('Live')
    source.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        addUpdate({ ...data, ts: data.ts || Date.now() })
      } catch (err) {
        console.error('Failed to parse event', err)
      }
    }
    source.onerror = () => {
      source.close()
      setStatusMessage('Connecting...')
    }
  }

  useEffect(() => {
    connectStream()
    return () => sourceRef.current?.close()
  }, [])

  const handleActionClick = (action: PrimaryAction) => {
    setSelectedAction(action)
    setActiveActionPanel(action)
    const roleText = displayRole ? ` (${displayRole})` : ''
    setActionFeedback(`Ready to ${action.label.toLowerCase()}${roleText} — ${action.detail}. Click "Launch →" to execute.`)
    tracker.log('action_click', action.label, action.detail, { role: displayRole, color: action.color })
  }

  const handleActionLaunch = (action: PrimaryAction) => {
    if (actionLoading) return
    setActionLoading(true)
    setActionCompleted(false)
    setActionProgress(0)
    setActionFeedback(`Initializing ${action.label}…`)
    tracker.log('button_click', `Launch ${action.label}`, action.detail, { displayRole })

    let step = 0
    const intervalId = window.setInterval(() => {
      step += 1
      setActionProgress(step * 20)
      
      // Progressive feedback messages during execution
      if (step === 1) setActionFeedback(`Validating ${action.label} parameters…`)
      else if (step === 2) setActionFeedback(`Processing with suppliers and partners…`)
      else if (step === 3) setActionFeedback(`Updating inventory and compliance data…`)
      else if (step === 4) setActionFeedback(`Recording transaction and archiving…`)
      else if (step >= 5) {
        window.clearInterval(intervalId)
        setActionLoading(false)
        setActionCompleted(true)
        const successMsg = getActionSuccessMessage(action, displayRole)
        setActionFeedback(successMsg)
        addUpdate({ message: `${action.label} completed by ${displayName}.`, ts: Date.now(), status: 'success' })
        applyActionResults(action, displayRole)
      }
    }, 180)
  }

  const getActionSuccessMessage = (action: PrimaryAction, role: Role | null): string => {
    const lower = action.label.toLowerCase()
    if (role === 'Buyer') {
      if (lower.includes('rfq')) return `RFQ created and sent to ${Math.floor(Math.random() * 15) + 5} qualified suppliers. Awaiting bids.`
      if (lower.includes('bid')) return `Comparison analysis complete: ${Math.floor(Math.random() * 5) + 3} suppliers submitted competitive bids. Reviews updated.`
      if (lower.includes('shipment')) return `Shipment tracked: ETA confirmed ${Math.floor(Math.random() * 7) + 1} days from now. Customs pre-clearance filed.`
    } else if (role === 'Seller') {
      if (lower.includes('quote')) return `Commercial quote submitted to ${Math.floor(Math.random() * 8) + 2} buyer accounts. Awaiting responses.`
      if (lower.includes('inventory')) return `Stock levels updated across 3 warehouses. ${Math.floor(Math.random() * 500) + 100} units confirmed available.`
      if (lower.includes('analytics')) return `Sales analytics refreshed. Month-to-date revenue trending +${Math.floor(Math.random() * 25) + 10}% vs last period.`
    } else if (role === 'Exporter') {
      if (lower.includes('docs')) return `Export documentation filed with port authority. Filing reference: EXP-${Date.now().toString().slice(-6)}. Status: Pending review.`
      if (lower.includes('pickup')) return `Logistics carrier confirmed. Pickup scheduled for ${['tomorrow', 'in 2 days', 'Friday'][Math.floor(Math.random() * 3)]}. 3 containers allocated.`
      if (lower.includes('compliance')) return `Regulatory compliance check passed. All certifications current. Clearance probability: ${95 + Math.floor(Math.random() * 5)}%.`
    }
    return `${action.label} executed successfully. Workflow updated.`
  }

  const applyActionResults = (action: PrimaryAction, role: Role | null) => {
    const lower = action.label.toLowerCase()
    
    // BUYER role actions
    if (role === 'Buyer') {
      if (lower.includes('rfq')) {
        // Create RFQ affects bid review task and increases live RFQs KPI
        setTaskList((prev) => prev.map((task) => {
          if (task.label.includes('bid')) {
            return { ...task, status: 'In progress', progress: Math.min(100, task.progress + 40) }
          }
          return task
        }))
        setKpiList((prev) => prev.map((kpi) => {
          if (kpi.label.includes('Live RFQs')) {
            const newVal = typeof kpi.value === 'number' ? kpi.value + 1 : kpi.value
            return { ...kpi, value: newVal, change: '+1', trend: 'up' }
          }
          return kpi
        }))
      } else if (lower.includes('compare')) {
        // Compare bids completes the bid review task
        setTaskList((prev) => prev.map((task) => {
          if (task.label.includes('bid')) {
            return { ...task, status: 'Complete', progress: 100 }
          }
          return task
        }))
      } else if (lower.includes('track')) {
        // Track shipment completes shipping confirmation task
        setTaskList((prev) => prev.map((task) => {
          if (task.label.includes('shipping')) {
            return { ...task, status: 'Complete', progress: 100 }
          }
          return task
        }))
        setKpiList((prev) => prev.map((kpi) => {
          if (kpi.label.includes('Avg Response')) {
            return { ...kpi, change: '-5%', trend: 'up' }
          }
          return kpi
        }))
      }
    }
    // SELLER role actions
    else if (role === 'Seller') {
      if (lower.includes('quote')) {
        // Submit quote completes the respond to RFQs task
        setTaskList((prev) => prev.map((task) => {
          if (task.label.includes('Respond')) {
            return { ...task, status: 'Complete', progress: 100 }
          }
          return task
        }))
        setKpiList((prev) => prev.map((kpi) => {
          if (kpi.label.includes('Active Quotes')) {
            const newVal = typeof kpi.value === 'number' ? kpi.value + 1 : kpi.value
            return { ...kpi, value: newVal, change: '+1', trend: 'up' }
          }
          return kpi
        }))
      } else if (lower.includes('inventory')) {
        // Manage inventory updates the warehouse availability task
        setTaskList((prev) => prev.map((task) => {
          if (task.label.includes('warehouse')) {
            return { ...task, status: 'Complete', progress: 100 }
          }
          return task
        }))
        setKpiList((prev) => prev.map((kpi) => {
          if (kpi.label.includes('Inventory')) {
            return { ...kpi, change: 'Updated', trend: 'neutral' }
          }
          return kpi
        }))
      } else if (lower.includes('analytics')) {
        // View analytics increases revenue KPI
        setKpiList((prev) => prev.map((kpi) => {
          if (kpi.label.includes('Revenue')) {
            return { ...kpi, change: '+15%', trend: 'up' }
          }
          return kpi
        }))
      }
    }
    // EXPORTER role actions
    else if (role === 'Exporter') {
      if (lower.includes('file') || lower.includes('docs')) {
        // File export docs completes customs filing task
        setTaskList((prev) => prev.map((task) => {
          if (task.label.includes('customs')) {
            return { ...task, status: 'Complete', progress: 100 }
          }
          return task
        }))
        setKpiList((prev) => prev.map((kpi) => {
          if (kpi.label.includes('Docs Pending')) {
            const newVal = typeof kpi.value === 'number' ? Math.max(0, kpi.value - 1) : kpi.value
            return { ...kpi, value: newVal, change: '-1', trend: 'up' }
          }
          return kpi
        }))
      } else if (lower.includes('pickup') || lower.includes('schedule')) {
        // Schedule pickup completes carrier booking task
        setTaskList((prev) => prev.map((task) => {
          if (task.label.includes('booking')) {
            return { ...task, status: 'Complete', progress: 100 }
          }
          return task
        }))
        setKpiList((prev) => prev.map((kpi) => {
          if (kpi.label.includes('Shipments Active')) {
            const newVal = typeof kpi.value === 'number' ? kpi.value + 1 : kpi.value
            return { ...kpi, value: newVal, change: '+1', trend: 'up' }
          }
          return kpi
        }))
      } else if (lower.includes('monitor') || lower.includes('compliance')) {
        // Monitor compliance completes export manifests task
        setTaskList((prev) => prev.map((task) => {
          if (task.label.includes('manifests')) {
            return { ...task, status: 'Complete', progress: 100 }
          }
          return task
        }))
        setKpiList((prev) => prev.map((kpi) => {
          if (kpi.label.includes('Compliance Rate')) {
            return { ...kpi, change: '+0.5%', trend: 'up' }
          }
          return kpi
        }))
      }
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    const demoEnabled = localStorage.getItem('afrigo:demo') === 'true'
    const savedRole = localStorage.getItem('afrigo:role')
    setMounted(true)

    if (demoEnabled && isValidRole(savedRole)) {
      setDemoRole(savedRole)
      setDisplayName('Demo User')
    } else if (isSignedIn) {
      setDisplayName(user?.displayName || 'User')
    } else {
      setDisplayName('Guest')
    }
  }, [isSignedIn, user])

  useEffect(() => {
    if (!isSignedIn || !user?.email) return

    const supabase = getSupabaseClient()
    if (!supabase) return

    let cancelled = false

    const loadProfile = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('display_name, role')
        .eq('email', user.email)
        .maybeSingle()

      if (cancelled) return
      if (error) {
        console.error('Supabase profile load failed', error)
        return
      }

      if (data) {
        setDisplayName(data.display_name || user.displayName || 'User')
        if (data.role && isValidRole(data.role)) {
          setDemoRole(data.role)
        }
        setStatusMessage('Live with Supabase')
      }
    }

    loadProfile()
    return () => {
      cancelled = true
    }
  }, [isSignedIn, user?.email])

  const displayRole = isSignedIn
    ? normalizeRole(user?.role)
    : isDemo
      ? demoRole
      : null
  const displayData = displayRole ? dashboardsByRole[displayRole] : null

  useEffect(() => {
    if (!displayData) return
    setTaskList(displayData.tasks)
    setKpiList(displayData.kpis)
    setSelectedTaskIndex(null)
    setOpenToolIndex(null)
    setSelectedAction(null)
    setActiveActionPanel(null)
    setActionCompleted(false)
    setActionProgress(0)
    setActionFeedback('Choose an action to explore your workflow.')
  }, [displayData])

  const handleTaskView = (index: number) => {
    setSelectedTaskIndex(index)
    const task = taskList[index]
    if (task) {
      setActionFeedback(`Viewing task: ${task.label}`)
      tracker.log('task_view', task.label, task.detail, { status: task.status, progress: task.progress })
    }
  }

  const handleToolOpen = (index: number) => {
    setOpenToolIndex(index)
    const tool = commonTools[index]
    setActionFeedback(`Opening ${tool.label}`)
    tracker.log('action_click', tool.label, tool.detail)
  }

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--afrigo-bg)] px-4 text-center">
        <div className="rounded-3xl border border-[var(--afrigo-border)] bg-[var(--afrigo-surface)] p-10 shadow-xl">
          <p className="text-lg font-semibold text-[var(--afrigo-text)]">Loading dashboard…</p>
          <p className="mt-2 text-sm text-[var(--afrigo-text-secondary)]">Preparing your live preview environment.</p>
        </div>
      </div>
    )
  }

  if (!displayData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold text-[var(--afrigo-primary-green)]">
            {!isSignedIn && !isDemo ? 'Sign in required' : 'Select your role'}
          </p>
          {!isSignedIn ? (
            <Link href="/sign-in" className="mt-4 inline-block rounded-lg bg-[var(--afrigo-primary-green)] px-6 py-2 text-white">
              Sign in
            </Link>
          ) : (
            <Link href="/role-selection" className="mt-4 inline-block rounded-lg bg-[var(--afrigo-primary-green)] px-6 py-2 text-white">
              Choose role
            </Link>
          )}
        </div>
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  }

  return (
    <MotionDiv
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8 pb-12"
    >
      {/* HEADER */}
      <MotionDiv
        variants={itemVariants}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        className="rounded-3xl border border-[var(--afrigo-border)] bg-gradient-to-r from-[var(--afrigo-surface)] to-[var(--afrigo-bg)] p-8 shadow-xl"
      >
        <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--afrigo-secondary-gold)]">
              Welcome back
            </p>
            <h1 className="mt-2 text-4xl font-black text-[var(--afrigo-primary-green)]">
              {displayName}
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-[var(--afrigo-text-secondary)]">
              {displayData.hero} • Real-time updates on your trade operations
            </p>
          </div>
          <div className="rounded-2xl bg-[var(--afrigo-bg)] px-6 py-3">
            <p className="text-sm text-[var(--afrigo-text-secondary)]">Status: <span className="font-semibold text-[var(--afrigo-primary-green)]">{statusMessage}</span></p>
          </div>
        </div>
      </MotionDiv>

      {/* PRIMARY ACTIONS */}
      <MotionDiv
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-4 lg:grid-cols-3"
      >
        {displayData.primaryActions.map((action, i) => (
          <MotionDiv
            key={i}
            variants={itemVariants}
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleActionClick(action)}
            className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${action.color} p-8 text-white shadow-lg transition hover:shadow-2xl cursor-pointer`}
          >
            <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-white opacity-10" />
            <div className="relative z-10">
              <p className="text-4xl">{action.icon}</p>
              <h3 className="mt-4 text-2xl font-black">{action.label}</h3>
              <p className="mt-2 text-sm opacity-90">{action.detail}</p>
              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    handleActionLaunch(action)
                  }}
                  disabled={actionLoading && selectedAction?.label === action.label}
                  className="rounded-lg bg-white/20 px-4 py-2 text-sm font-semibold text-[var(--afrigo-text)] backdrop-blur transition hover:bg-white/30 disabled:cursor-wait disabled:opacity-60"
                >
                  {actionLoading && selectedAction?.label === action.label ? 'Processing…' : 'Launch →'}
                </button>
                {selectedAction?.label === action.label && (
                  <div className="rounded-2xl bg-white/15 p-3 text-xs text-[var(--afrigo-text-secondary)]">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span>{actionLoading ? `Running ${action.label}…` : actionCompleted ? 'Completed' : 'Ready to launch'}</span>
                      <span>{actionProgress}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
                      <div className="h-full rounded-full bg-white" style={{ width: `${actionProgress}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </MotionDiv>
        ))}
      </MotionDiv>
      <MotionDiv
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="rounded-3xl border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] p-6 shadow-inner shadow-[rgba(0,0,0,0.03)]"
      >
        <p className="text-sm uppercase tracking-widest text-[var(--afrigo-secondary-gold)]">Action preview</p>
        <p className="mt-3 text-lg font-semibold text-[var(--afrigo-text)]">{actionFeedback}</p>
      </MotionDiv>

      {/* IMPORTANT KPIs */}
      <MotionDiv variants={containerVariants} initial="hidden" animate="visible" className="grid gap-4 lg:grid-cols-4">
        {kpiList.map((kpi, i) => (
          <MotionDiv
            key={i}
            variants={itemVariants}
            whileHover={{ y: -4 }}
            className="rounded-2xl border border-[var(--afrigo-border)] bg-[var(--afrigo-surface)] p-6 shadow-lg hover:shadow-xl transition"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[var(--afrigo-text-secondary)]">{kpi.label}</p>
                <p className="mt-3 text-3xl font-black text-[var(--afrigo-primary-green)]">{kpi.value}</p>
              </div>
              <p className="text-3xl">{kpi.icon}</p>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className={`text-sm font-semibold ${kpi.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                {kpi.trend === 'up' ? '↑' : '↓'} {kpi.change}
              </span>
              <span className="text-xs text-[var(--afrigo-text-secondary)]">vs last period</span>
            </div>
          </MotionDiv>
        ))}
      </MotionDiv>

      {/* ACTIVE TASKS */}
      <MotionDiv
        variants={itemVariants}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="rounded-3xl border border-[var(--afrigo-border)] bg-[var(--afrigo-surface)] p-8 shadow-xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-[var(--afrigo-primary-green)]">Active Tasks</h2>
            <p className="mt-2 text-[var(--afrigo-text-secondary)]">Your immediate action items</p>
          </div>
          <div className="rounded-full bg-[var(--afrigo-secondary-gold)] px-3 py-1 text-xs font-semibold text-white">
            {taskList.length} tasks
          </div>
        </div>
        <div className="space-y-4">
          {taskList.map((task, i) => (
            <MotionDiv
              key={i}
              variants={itemVariants}
              className="rounded-2xl border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <p className="text-2xl">{task.icon}</p>
                    <div>
                      <h3 className="font-semibold text-[var(--afrigo-text)]">{task.label}</h3>
                      <p className="text-sm text-[var(--afrigo-text-secondary)]">{task.detail}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-[var(--afrigo-text-secondary)]">
                        {task.status} • {task.progress}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--afrigo-border)]">
                      <MotionDiv
                        initial={{ width: 0 }}
                        animate={{ width: `${task.progress}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-[var(--afrigo-primary-green)] to-[var(--afrigo-secondary-gold)]"
                      />
                    </div>
                  </div>
                </div>
                <MotionButton
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleTaskView(i)}
                  className="rounded-lg bg-[var(--afrigo-primary-green)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--afrigo-primary-green-hover)]"
                >
                  View
                </MotionButton>
              </div>
            </MotionDiv>
          ))}
        </div>
      </MotionDiv>
      {selectedTaskIndex !== null && taskList[selectedTaskIndex] && (
        <MotionDiv
          variants={itemVariants}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] p-6 shadow-xl"
        >
          <p className="text-sm uppercase tracking-widest text-[var(--afrigo-secondary-gold)]">Task details</p>
          <h3 className="mt-3 text-2xl font-black text-[var(--afrigo-primary-green)]">{taskList[selectedTaskIndex].label}</h3>
          <p className="mt-2 text-[var(--afrigo-text-secondary)]">{taskList[selectedTaskIndex].detail}</p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-[var(--afrigo-text-secondary)]">
            <span className="rounded-full bg-[var(--afrigo-border)] px-3 py-1">Status: {taskList[selectedTaskIndex].status}</span>
            <span className="rounded-full bg-[var(--afrigo-border)] px-3 py-1">Progress: {taskList[selectedTaskIndex].progress}%</span>
          </div>
        </MotionDiv>
      )}

      {/* RECENT ACTIVITY */}
      <MotionDiv
        variants={itemVariants}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="rounded-3xl border border-[var(--afrigo-border)] bg-[var(--afrigo-surface)] p-8 shadow-xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-[var(--afrigo-primary-green)]">Recent Activity</h2>
            <p className="mt-2 text-[var(--afrigo-text-secondary)]">Live updates from your team</p>
          </div>
          <MotionButton
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={connectStream}
            className="rounded-lg border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] px-4 py-2 text-sm font-semibold text-[var(--afrigo-text)] hover:border-[var(--afrigo-primary-green)]"
          >
            Refresh
          </MotionButton>
        </div>
        <div className="space-y-3">
          {updates.length === 0 ? (
            <div className="rounded-xl border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] p-6 text-center text-[var(--afrigo-text-secondary)]">
              Waiting for team activity...
            </div>
          ) : (
            updates.map((update, i) => (
              <MotionDiv
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="flex items-center justify-between rounded-xl bg-[var(--afrigo-bg)] p-4 hover:shadow-md transition"
              >
                <p className="text-sm text-[var(--afrigo-text)]">{update.message}</p>
                <span className="text-xs text-[var(--afrigo-text-secondary)]">
                  {new Date(update.ts).toLocaleTimeString()}
                </span>
              </MotionDiv>
            ))
          )}
        </div>
      </MotionDiv>

      {/* SECONDARY TOOLS */}
      <MotionDiv
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-4 lg:grid-cols-3"
      >
        {commonTools.map((tool, i) => (
          <MotionDiv
            key={i}
            variants={itemVariants}
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleToolOpen(i)}
            className={`group rounded-2xl border border-[var(--afrigo-border)] bg-[var(--afrigo-surface)] p-6 shadow-lg hover:shadow-xl hover:border-[var(--afrigo-primary-green)] transition cursor-pointer ${openToolIndex === i ? 'border-[var(--afrigo-primary-green)] bg-[var(--afrigo-bg)]' : ''}`}
          >
            <p className="text-3xl">{tool.icon}</p>
            <h3 className="mt-3 font-semibold text-[var(--afrigo-text)] group-hover:text-[var(--afrigo-primary-green)] transition">
              {tool.label}
            </h3>
            <p className="mt-2 text-sm text-[var(--afrigo-text-secondary)]">{tool.detail}</p>
            <button className="mt-4 rounded-lg bg-[var(--afrigo-bg)] px-3 py-2 text-xs font-semibold text-[var(--afrigo-primary-green)] group-hover:bg-[var(--afrigo-primary-green)] group-hover:text-white transition">
              Open →
            </button>
          </MotionDiv>
        ))}
      </MotionDiv>
      {openToolIndex !== null && (
        <MotionDiv
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] p-6 shadow-inner shadow-[rgba(0,0,0,0.03)]"
        >
          <p className="text-sm uppercase tracking-widest text-[var(--afrigo-secondary-gold)]">Tool preview</p>
          <h3 className="mt-2 text-lg font-semibold text-[var(--afrigo-text)]">{commonTools[openToolIndex].label}</h3>
          <p className="mt-2 text-[var(--afrigo-text-secondary)]">{commonTools[openToolIndex].detail}. This is a live action placeholder so the dashboard feels active and clickable.</p>
        </MotionDiv>
      )}
    </MotionDiv>
  )
}
