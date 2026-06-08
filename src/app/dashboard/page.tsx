'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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

type IncomingItem = {
  id: string
  from: string
  type: string
  message: string
  time: number
  status: 'new' | 'read'
}

type RoleConfig = {
  hero: string
  subtitle: string
  primaryActions: PrimaryAction[]
  kpis: KPI[]
  tasks: DashboardTask[]
  incomingLabel: string
  incomingExample: IncomingItem[]
  crossRoleSection: string
  tools: string[]
}

// BUYER ROLE CONFIG
const BuyerConfig: RoleConfig = {
  hero: 'Buyer Dashboard',
  subtitle: 'Source products • Compare suppliers • Manage purchases',
  primaryActions: [
    { label: 'Create RFQ', detail: 'Send request for quotation to suppliers', icon: '📝', color: 'from-blue-500 to-blue-600' },
    { label: 'Compare Bids', detail: 'Review proposals from multiple sellers', icon: '⚖️', color: 'from-purple-500 to-purple-600' },
    { label: 'Track Shipment', detail: 'Monitor order delivery with exporter', icon: '🚚', color: 'from-green-500 to-green-600' }
  ],
  kpis: [
    { label: 'Active RFQs', value: 24, change: '+12%', trend: 'up', icon: '📊' },
    { label: 'Avg Response', value: '2.4h', change: '-15%', trend: 'up', icon: '⏱️' },
    { label: 'Suppliers', value: 47, change: '+8', trend: 'up', icon: '👥' },
    { label: 'Approval Rate', value: '94%', change: '+3%', trend: 'up', icon: '✅' }
  ],
  tasks: [
    { label: 'Review quotes from 8 suppliers', detail: 'Evaluate pricing and delivery terms', status: 'Pending', progress: 35, icon: '🔍' },
    { label: 'Approve purchase order', detail: 'PO #2847 ready for release', status: 'Pending', progress: 60, icon: '🧾' },
    { label: 'Confirm shipping details', detail: 'ETA and customs documents needed', status: 'In progress', progress: 80, icon: '📦' }
  ],
  incomingLabel: 'Incoming Quotes from Sellers',
  incomingExample: [
    { id: '1', from: 'TechCorp Supplies', type: 'Quote Response', message: 'Quote for 1000 units at $45/unit', time: Date.now() - 300000, status: 'new' },
    { id: '2', from: 'Global Traders', type: 'Quote Response', message: 'Expedited option available +15% cost', time: Date.now() - 600000, status: 'new' }
  ],
  crossRoleSection: 'Exporters Ready to Ship',
  tools: ['View Compliance Docs', 'Check Payment Status', 'Review Shipment Timeline', 'Open Account Notes', 'Message Support Team', 'Export Report']
}

// SELLER ROLE CONFIG
const SellerConfig: RoleConfig = {
  hero: 'Seller Dashboard',
  subtitle: 'Respond to buyers • Manage inventory • Grow sales',
  primaryActions: [
    { label: 'Respond to RFQ', detail: 'Submit competitive quote to buyer', icon: '✉️', color: 'from-emerald-500 to-emerald-600' },
    { label: 'Manage Inventory', detail: 'Update available stock levels', icon: '📦', color: 'from-orange-500 to-orange-600' },
    { label: 'View Analytics', detail: 'Track sales performance metrics', icon: '📈', color: 'from-cyan-500 to-cyan-600' }
  ],
  kpis: [
    { label: 'Pending RFQs', value: 12, change: '+3', trend: 'up', icon: '💬' },
    { label: 'Win Rate', value: '67%', change: '+8%', trend: 'up', icon: '🎯' },
    { label: 'Stock', value: '2.4K units', change: '-120', trend: 'down', icon: '📦' },
    { label: 'This Month', value: '$124K', change: '+22%', trend: 'up', icon: '💰' }
  ],
  tasks: [
    { label: 'Respond to 5 active RFQs', detail: 'Prepare competitive quotes for buyers', status: 'Pending', progress: 40, icon: '💭' },
    { label: 'Upload certifications', detail: 'Quality and origin certificates needed', status: 'Pending', progress: 25, icon: '🏅' },
    { label: 'Confirm warehouse stock', detail: 'Verify availability for 3 pending orders', status: 'In progress', progress: 75, icon: '🏭' }
  ],
  incomingLabel: 'New RFQs from Buyers',
  incomingExample: [
    { id: '1', from: 'RetailCo', type: 'RFQ', message: 'Need 2000 units of Product X', time: Date.now() - 120000, status: 'new' },
    { id: '2', from: 'Electronics Plus', type: 'RFQ', message: 'Bulk order: 5000 units, need samples first', time: Date.now() - 420000, status: 'new' }
  ],
  crossRoleSection: 'Exporters Available for Fulfillment',
  tools: ['View Compliance Docs', 'Check Payment Status', 'Review Shipment Timeline', 'Open Account Notes', 'Message Support Team', 'Export Report']
}

// EXPORTER ROLE CONFIG
const ExporterConfig: RoleConfig = {
  hero: 'Exporter Command Center',
  subtitle: 'Handle logistics • Clear customs • Deliver worldwide',
  primaryActions: [
    { label: 'File Export Docs', detail: 'Submit customs documentation', icon: '📄', color: 'from-rose-500 to-rose-600' },
    { label: 'Schedule Pickup', detail: 'Arrange logistics and transport', icon: '🛳️', color: 'from-indigo-500 to-indigo-600' },
    { label: 'Monitor Compliance', detail: 'Track regulatory compliance status', icon: '✅', color: 'from-teal-500 to-teal-600' }
  ],
  kpis: [
    { label: 'Active Shipments', value: 8, change: '+2', trend: 'up', icon: '🚢' },
    { label: 'Compliance Rate', value: '99.2%', change: '+0.8%', trend: 'up', icon: '🔒' },
    { label: 'Avg Clearance', value: '3.2 days', change: '-0.8', trend: 'up', icon: '⏰' },
    { label: 'Pending Docs', value: 4, change: '-1', trend: 'up', icon: '📋' }
  ],
  tasks: [
    { label: 'Finalize export manifests', detail: 'Complete 2 pending shipment documents', status: 'Pending', progress: 45, icon: '📝' },
    { label: 'Submit customs filings', detail: 'Port authority clearance required', status: 'Pending', progress: 20, icon: '🏛️' },
    { label: 'Confirm carrier booking', detail: 'Lock 3 containers for pickup', status: 'In progress', progress: 90, icon: '📞' }
  ],
  incomingLabel: 'Incoming Orders from Buyers & Sellers',
  incomingExample: [
    { id: '1', from: 'RetailCo ← TechCorp Supplies', type: 'Shipment', message: '2000 units ready for export', time: Date.now() - 180000, status: 'new' },
    { id: '2', from: 'Electronics Plus ← Global Traders', type: 'Shipment', message: '5000 units + samples, urgent delivery', time: Date.now() - 540000, status: 'new' }
  ],
  crossRoleSection: 'Connected Buyers & Sellers',
  tools: ['View Compliance Docs', 'Check Payment Status', 'Review Shipment Timeline', 'Open Account Notes', 'Message Support Team', 'Export Report']
}

// Map roles to configs
const roleConfigs: Record<Role, RoleConfig> = {
  'Buyer': BuyerConfig,
  'Seller': SellerConfig,
  'Exporter': ExporterConfig
}

const toolsData: Record<string, { title: string; icon: string; items: any[] }> = {
  'View Compliance Docs': {
    title: 'Compliance Documents',
    icon: '🧾',
    items: [
      { label: 'Certificate of Origin', status: 'Valid', issued: '2024-06-01', details: 'Issued by Chamber of Commerce' },
      { label: 'Quality Certification', status: 'Valid', issued: 'ISO 9001:2015', details: 'Expires 2025-12-31' },
      { label: 'Factory Audit Report', status: 'Current', issued: '2024-05-15', details: 'Last inspection passed' }
    ]
  },
  'Check Payment Status': {
    title: 'Payment Milestones',
    icon: '💰',
    items: [
      { label: 'Deposit (30%)', status: '✓ Paid', value: '$15,000', date: '2024-05-20' },
      { label: 'Production (50%)', status: '⏳ Due', value: '$25,000', date: '2024-06-15' },
      { label: 'Final (20%)', status: '⊘ Pending', value: '$10,000', date: 'On shipment' }
    ]
  },
  'Review Shipment Timeline': {
    title: 'Shipment Tracking',
    icon: '⏱️',
    items: [
      { label: 'Order Confirmed', status: 'Complete', date: 'May 20, 2024', icon: '✓' },
      { label: 'In Production', status: 'In Progress', date: 'Est. June 10', icon: '⚙' },
      { label: 'Shipped', status: 'Pending', date: 'Est. June 15', icon: '📦' }
    ]
  },
  'Open Account Notes': {
    title: 'Account Notes',
    icon: '🗒️',
    items: [
      { author: 'Account Manager', date: 'Jun 7, 2024', note: 'Expedited shipment approved. $500 surcharge.' },
      { author: 'Quality Team', date: 'Jun 5, 2024', note: 'Final QC passed. All units meet specs.' },
      { author: 'Logistics', date: 'May 28, 2024', note: 'Special packaging for fragile items confirmed.' }
    ]
  },
  'Message Support Team': {
    title: 'Support Contacts',
    icon: '💬',
    items: [
      { name: 'Sarah Chen', role: 'Account Manager', status: 'Available now', response: '2min' },
      { name: 'James Wilson', role: 'Logistics Specialist', status: 'Back in 30min', response: '5min' },
      { name: 'Maria Garcia', role: 'Customer Success', status: 'Available', response: '3min' }
    ]
  },
  'Export Report': {
    title: 'Activity Report',
    icon: '📊',
    items: [
      { metric: 'Total Orders', value: '12', period: 'May 2024' },
      { metric: 'Total Value', value: '$450,000', period: 'May 2024' },
      { metric: 'Avg Response Time', value: '2.1h', period: 'May 2024' }
    ]
  }
}

export default function Dashboard() {
  const { user, isSignedIn, isDemo } = useAuth()
  const tracker = useActivityTracker()
  const [updates, setUpdates] = useState<UpdateEvent[]>([])
  const [statusMessage, setStatusMessage] = useState('Live')
  const [mounted, setMounted] = useState(false)
  const [demoRole, setDemoRole] = useState<Role | null>(null)
  const [displayName, setDisplayName] = useState('Guest')
  const [kpiList, setKpiList] = useState<KPI[]>([])
  const [taskList, setTaskList] = useState<DashboardTask[]>([])
  const [incomingItems, setIncomingItems] = useState<IncomingItem[]>([])
  const [selectedTaskIndex, setSelectedTaskIndex] = useState<number | null>(null)
  const [activeToolKey, setActiveToolKey] = useState<string | null>(null)
  const [activeActionModal, setActiveActionModal] = useState<PrimaryAction | null>(null)
  const [actionModalStep, setActionModalStep] = useState(0)
  const [actionModalData, setActionModalData] = useState<Record<string, string>>({})
  const [incomingPanelOpen, setIncomingPanelOpen] = useState(false)
  const sourceRef = useRef<EventSource | null>(null)

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

  const displayRole = isSignedIn ? normalizeRole(user?.role) : isDemo ? demoRole : null
  const config = displayRole ? roleConfigs[displayRole] : null

  useEffect(() => {
    if (!displayRole || !config) return
    setKpiList([...config.kpis])
    setTaskList([...config.tasks])
    setIncomingItems(config.incomingExample.map(item => ({ ...item })))
    setSelectedTaskIndex(null)
    setActiveToolKey(null)
    setActiveActionModal(null)
  }, [displayRole, config])

  const handleActionOpen = (action: PrimaryAction) => {
    setActiveActionModal(action)
    setActionModalStep(0)
    setActionModalData({})
    tracker.log('action_click', action.label, action.detail, { role: displayRole })
  }

  const handleActionSubmit = (action: PrimaryAction) => {
    setActionModalStep(1)
    tracker.log('button_click', `Submit ${action.label}`, JSON.stringify(actionModalData), { role: displayRole })

    setTimeout(() => {
      setActionModalStep(2)
      const successMsg = getActionSuccessMessage(action, displayRole)
      addUpdate({ message: `${action.label} completed. ${successMsg}`, ts: Date.now(), status: 'success' })
      applyActionResults(action, displayRole)
      // Add incoming activity from other roles after action
      if (displayRole === 'Buyer' && action.label === 'Create RFQ') {
        setTimeout(() => {
          addUpdate({ message: 'TechCorp Supplies responded to your RFQ with a quote.', ts: Date.now(), status: 'info' })
        }, 2000)
      }
    }, 1200)

    setTimeout(() => {
      setActiveActionModal(null)
      setIncomingPanelOpen(true)
    }, 2500)
  }

  const getActionSuccessMessage = (action: PrimaryAction, role: Role | null): string => {
    const lower = action.label.toLowerCase()
    if (role === 'Buyer') {
      if (lower.includes('rfq')) return `RFQ #${Math.random().toString().slice(-4).toUpperCase()} sent to ${Math.floor(Math.random() * 15) + 5} suppliers.`
      if (lower.includes('compare')) return `Best price: $${(45 + Math.random() * 20).toFixed(2)}/unit from top 3 suppliers.`
      if (lower.includes('track')) return `Tracking activated. ETA: ${Math.floor(Math.random() * 7) + 1} days from now.`
    } else if (role === 'Seller') {
      if (lower.includes('respond')) return `Quote submitted for ${Math.floor(Math.random() * 5000) + 500} units at competitive price.`
      if (lower.includes('inventory')) return `${Math.floor(Math.random() * 500) + 200} units added to available stock.`
      if (lower.includes('analytics')) return `Revenue trending +${Math.floor(Math.random() * 25) + 10}% vs last month.`
    } else if (role === 'Exporter') {
      if (lower.includes('file')) return `Docs filed as EXP-${Date.now().toString().slice(-5)}. Pending port review.`
      if (lower.includes('schedule')) return `Pickup scheduled for ${['tomorrow', 'Friday', 'Monday'][Math.floor(Math.random() * 3)]}.`
      if (lower.includes('monitor')) return `Compliance check passed. Clearance: ${95 + Math.floor(Math.random() * 5)}%.`
    }
    return `Completed successfully.`
  }

  const applyActionResults = (action: PrimaryAction, role: Role | null) => {
    const lower = action.label.toLowerCase()
    setTaskList((prev) => prev.map((task) => {
      const taskLower = task.label.toLowerCase()
      if (lower.includes('rfq') && taskLower.includes('bid')) return { ...task, status: 'In progress', progress: Math.min(100, task.progress + 40) }
      if (lower.includes('compare') && taskLower.includes('bid')) return { ...task, status: 'Complete', progress: 100 }
      if (lower.includes('track') && taskLower.includes('shipping')) return { ...task, status: 'Complete', progress: 100 }
      if (lower.includes('respond') && taskLower.includes('respond')) return { ...task, status: 'Complete', progress: 100 }
      if (lower.includes('inventory') && taskLower.includes('warehouse')) return { ...task, status: 'Complete', progress: 100 }
      if (lower.includes('file') && taskLower.includes('manifests')) return { ...task, status: 'Complete', progress: 100 }
      if (lower.includes('schedule') && taskLower.includes('booking')) return { ...task, status: 'Complete', progress: 100 }
      if (lower.includes('monitor') && taskLower.includes('customs')) return { ...task, status: 'Complete', progress: 100 }
      return task
    }))

    setKpiList((prev) => prev.map((kpi) => {
      if (lower.includes('rfq') && kpi.label.includes('RFQs')) return { ...kpi, value: typeof kpi.value === 'number' ? kpi.value + 1 : kpi.value, change: '+1', trend: 'up' }
      if (lower.includes('respond') && kpi.label.includes('Pending')) return { ...kpi, value: typeof kpi.value === 'number' ? Math.max(0, kpi.value - 1) : kpi.value, change: '-1', trend: 'up' }
      if (lower.includes('file') && kpi.label.includes('Docs')) return { ...kpi, value: typeof kpi.value === 'number' ? Math.max(0, kpi.value - 1) : kpi.value, change: '-1', trend: 'up' }
      return kpi
    }))
  }

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--afrigo-bg)] px-4">
        <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <p className="text-lg font-semibold text-[var(--afrigo-text)]">Loading dashboard…</p>
        </MotionDiv>
      </div>
    )
  }

  if (!config || !displayRole) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Link href="/role-selection" className="rounded-lg bg-[var(--afrigo-primary-green)] px-6 py-2 text-white">
          Choose role
        </Link>
      </div>
    )
  }

  const toolKeys = config.tools

  return (
    <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-8 pb-12">
      {/* HEADER */}
      <MotionDiv initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }} className="rounded-3xl border border-[var(--afrigo-border)] bg-gradient-to-r from-[var(--afrigo-surface)] to-[var(--afrigo-bg)] p-8 shadow-xl">
        <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--afrigo-secondary-gold)]">Welcome back</p>
            <h1 className="mt-2 text-4xl font-black text-[var(--afrigo-primary-green)]">{displayName}</h1>
            <p className="mt-1 text-[var(--afrigo-text)]">{config.hero}</p>
            <p className="mt-1 text-sm text-[var(--afrigo-text-secondary)]">{config.subtitle}</p>
          </div>
          <div className="flex gap-3">
            {incomingItems.filter(item => item.status === 'new').length > 0 && (
              <MotionButton
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIncomingPanelOpen(!incomingPanelOpen)}
                className="relative rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 text-sm font-semibold text-white hover:shadow-lg transition"
              >
                <MotionDiv animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-600 flex items-center justify-center text-xs font-bold text-white">
                  {incomingItems.filter(item => item.status === 'new').length}
                </MotionDiv>
                Incoming
              </MotionButton>
            )}
            <div className="rounded-2xl bg-[var(--afrigo-bg)] px-6 py-3">
              <p className="text-sm text-[var(--afrigo-text-secondary)]">Status: <span className="font-semibold text-[var(--afrigo-primary-green)]">{statusMessage}</span></p>
            </div>
          </div>
        </div>
      </MotionDiv>

      {/* INCOMING ACTIVITY PANEL */}
      <AnimatePresence>
        {incomingPanelOpen && (
          <MotionDiv
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-3xl border border-orange-500 bg-gradient-to-r from-orange-500/10 to-red-500/10 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-[var(--afrigo-primary-green)]">{config.incomingLabel}</h3>
              <MotionButton whileTap={{ scale: 0.95 }} onClick={() => setIncomingPanelOpen(false)} className="text-[var(--afrigo-text-secondary)] hover:text-[var(--afrigo-text)]">
                ✕
              </MotionButton>
            </div>
            <div className="space-y-3">
              {incomingItems.map((item, idx) => (
                <MotionDiv
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ x: 4 }}
                  onClick={() => setIncomingItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'read' } : i))}
                  className={`rounded-xl border p-4 cursor-pointer transition ${item.status === 'new' ? 'border-orange-500 bg-[var(--afrigo-surface)] hover:shadow-md' : 'border-[var(--afrigo-border)] bg-[var(--afrigo-bg)]'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {item.status === 'new' && <MotionDiv animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="h-2 w-2 rounded-full bg-orange-500" />}
                        <p className="font-semibold text-[var(--afrigo-text)]">{item.from}</p>
                      </div>
                      <p className="text-xs text-[var(--afrigo-secondary-gold)] mt-1">{item.type}</p>
                      <p className="text-sm text-[var(--afrigo-text-secondary)] mt-2">{item.message}</p>
                    </div>
                    <span className="text-xs text-[var(--afrigo-text-secondary)] whitespace-nowrap">{Math.floor((Date.now() - item.time) / 60000)}m ago</span>
                  </div>
                </MotionDiv>
              ))}
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>

      {/* PRIMARY ACTIONS */}
      <div className="grid gap-4 lg:grid-cols-3">
        {config.primaryActions.map((action, i) => (
          <MotionDiv
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleActionOpen(action)}
            className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${action.color} p-8 text-white shadow-lg hover:shadow-2xl cursor-pointer transition`}
          >
            <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-white opacity-10 group-hover:scale-150 transition-transform duration-300" />
            <div className="relative z-10">
              <MotionDiv animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 3, repeat: Infinity }} className="text-5xl mb-3">
                {action.icon}
              </MotionDiv>
              <h3 className="text-2xl font-black">{action.label}</h3>
              <p className="mt-2 text-sm opacity-90">{action.detail}</p>
              <MotionButton
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mt-4 rounded-lg bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur transition hover:bg-white/30"
              >
                Launch →
              </MotionButton>
            </div>
          </MotionDiv>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid gap-4 lg:grid-cols-4">
        {kpiList.map((kpi, i) => (
          <MotionDiv
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="rounded-2xl border border-[var(--afrigo-border)] bg-[var(--afrigo-surface)] p-6 shadow-lg hover:shadow-xl transition cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[var(--afrigo-text-secondary)]">{kpi.label}</p>
                <MotionDiv initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }} className="mt-3 text-3xl font-black text-[var(--afrigo-primary-green)]">
                  {kpi.value}
                </MotionDiv>
              </div>
              <MotionDiv animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-3xl">
                {kpi.icon}
              </MotionDiv>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className={`text-sm font-semibold ${kpi.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                {kpi.trend === 'up' ? '↑' : '↓'} {kpi.change}
              </span>
            </div>
          </MotionDiv>
        ))}
      </div>

      {/* ACTIVE TASKS */}
      <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="rounded-3xl border border-[var(--afrigo-border)] bg-[var(--afrigo-surface)] p-8 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-[var(--afrigo-primary-green)]">Active Tasks</h2>
            <p className="mt-2 text-[var(--afrigo-text-secondary)]">Your immediate action items</p>
          </div>
          <div className="rounded-full bg-[var(--afrigo-secondary-gold)] px-3 py-1 text-xs font-semibold text-white">{taskList.length} tasks</div>
        </div>
        <div className="space-y-4">
          {taskList.map((task, i) => (
            <MotionDiv
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ x: 4 }}
              className="rounded-2xl border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] p-6 hover:shadow-md transition cursor-pointer"
              onClick={() => setSelectedTaskIndex(selectedTaskIndex === i ? null : i)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <MotionDiv animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} className="text-2xl">
                      {task.icon}
                    </MotionDiv>
                    <div>
                      <h3 className="font-semibold text-[var(--afrigo-text)]">{task.label}</h3>
                      <p className="text-sm text-[var(--afrigo-text-secondary)]">{task.detail}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-[var(--afrigo-text-secondary)]">{task.status} • {task.progress}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--afrigo-border)]">
                      <MotionDiv initial={{ width: 0 }} animate={{ width: `${task.progress}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} className="h-full bg-gradient-to-r from-[var(--afrigo-primary-green)] to-[var(--afrigo-secondary-gold)]" />
                    </div>
                  </div>
                </div>
              </div>
              {selectedTaskIndex === i && (
                <MotionDiv initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 pt-4 border-t border-[var(--afrigo-border)]">
                  <p className="text-sm text-[var(--afrigo-text-secondary)]">Full Details: {task.detail}</p>
                  <p className="mt-2 text-xs text-[var(--afrigo-text-secondary)]">Current Status: {task.status}</p>
                </MotionDiv>
              )}
            </MotionDiv>
          ))}
        </div>
      </MotionDiv>

      {/* TOOLS */}
      <div className="grid gap-4 lg:grid-cols-3">
        {toolKeys.map((toolKey, i) => {
          const toolData = toolsData[toolKey]
          return (
            <MotionDiv
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveToolKey(activeToolKey === toolKey ? null : toolKey)}
              className={`group rounded-2xl border transition cursor-pointer shadow-lg hover:shadow-xl p-6 ${activeToolKey === toolKey ? 'border-[var(--afrigo-primary-green)] bg-[var(--afrigo-primary-green)]/5 ring-2 ring-[var(--afrigo-primary-green)]/20' : 'border-[var(--afrigo-border)] bg-[var(--afrigo-surface)] hover:border-[var(--afrigo-primary-green)]'}`}
            >
              <MotionDiv animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2.5, repeat: Infinity }} className="text-4xl mb-3">
                {toolData?.icon}
              </MotionDiv>
              <h3 className="font-semibold text-[var(--afrigo-text)] group-hover:text-[var(--afrigo-primary-green)] transition">{toolKey}</h3>
              <MotionButton
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mt-4 rounded-lg bg-[var(--afrigo-bg)] px-3 py-2 text-xs font-semibold text-[var(--afrigo-primary-green)] group-hover:bg-[var(--afrigo-primary-green)] group-hover:text-white transition"
              >
                {activeToolKey === toolKey ? 'Close ✕' : 'Open →'}
              </MotionButton>
            </MotionDiv>
          )
        })}
      </div>

      {/* TOOL CONTENT PANEL */}
      <AnimatePresence>
        {activeToolKey && (
          <MotionDiv initial={{ opacity: 0, y: 20, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: 20, height: 0 }} className="rounded-3xl border border-[var(--afrigo-primary-green)] bg-gradient-to-r from-[var(--afrigo-primary-green)]/5 to-[var(--afrigo-secondary-gold)]/5 p-8 shadow-lg">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-widest text-[var(--afrigo-secondary-gold)]">Tool Panel</p>
                <h3 className="mt-2 text-2xl font-black text-[var(--afrigo-primary-green)]">{toolsData[activeToolKey]?.title}</h3>
              </div>
              <MotionButton whileTap={{ scale: 0.95 }} onClick={() => setActiveToolKey(null)} className="rounded-full bg-[var(--afrigo-primary-green)] p-2 text-white hover:opacity-90">
                ✕
              </MotionButton>
            </div>
            <div className="space-y-3">
              {toolsData[activeToolKey]?.items.map((item: any, idx: number) => (
                <MotionDiv
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ x: 4 }}
                  className="rounded-xl border border-[var(--afrigo-border)] bg-[var(--afrigo-surface)] p-4 hover:shadow-md transition"
                >
                  {item.label && (
                    <>
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-[var(--afrigo-text)]">{item.label}</p>
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-[var(--afrigo-primary-green)]/20 text-[var(--afrigo-primary-green)]">{item.status || item.value || item.role}</span>
                      </div>
                      {item.details && <p className="mt-1 text-xs text-[var(--afrigo-text-secondary)]">{item.details}</p>}
                      {item.date && <p className="mt-1 text-xs text-[var(--afrigo-text-secondary)]">{item.date}</p>}
                      {item.issued && <p className="mt-1 text-xs text-[var(--afrigo-text-secondary)]">{item.issued}</p>}
                    </>
                  )}
                  {item.metric && (
                    <div className="flex items-center justify-between">
                      <p className="text-[var(--afrigo-text)]">{item.metric}</p>
                      <p className="text-2xl font-black text-[var(--afrigo-primary-green)]">{item.value}</p>
                    </div>
                  )}
                  {item.note && (
                    <>
                      <p className="text-xs font-semibold text-[var(--afrigo-secondary-gold)]">{item.author} • {item.date}</p>
                      <p className="mt-2 text-sm text-[var(--afrigo-text)]">{item.note}</p>
                    </>
                  )}
                  {item.name && (
                    <div>
                      <p className="font-semibold text-[var(--afrigo-text)]">{item.name}</p>
                      <p className="text-xs text-[var(--afrigo-text-secondary)]">{item.role}</p>
                      <p className="mt-2 text-xs text-green-500">• {item.status}</p>
                      <MotionButton
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="mt-2 w-full rounded-lg bg-[var(--afrigo-primary-green)] py-1 text-xs font-semibold text-white hover:opacity-90"
                      >
                        Chat
                      </MotionButton>
                    </div>
                  )}
                </MotionDiv>
              ))}
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>

      {/* ACTIVITY FEED */}
      <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="rounded-3xl border border-[var(--afrigo-border)] bg-[var(--afrigo-surface)] p-8 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-black text-[var(--afrigo-primary-green)]">Recent Activity</h2>
          <MotionButton whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={connectStream} className="rounded-lg border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] px-4 py-2 text-sm font-semibold hover:border-[var(--afrigo-primary-green)]">
            Refresh
          </MotionButton>
        </div>
        <div className="space-y-3">
          {updates.length === 0 ? (
            <div className="rounded-xl border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] p-6 text-center text-[var(--afrigo-text-secondary)]">
              Waiting for activity...
            </div>
          ) : (
            updates.map((update, i) => (
              <MotionDiv
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="flex items-center justify-between rounded-xl bg-[var(--afrigo-bg)] p-4 hover:shadow-md transition border border-[var(--afrigo-border)]/50 hover:border-[var(--afrigo-primary-green)]"
              >
                <p className="text-sm text-[var(--afrigo-text)]">{update.message}</p>
                <span className="text-xs text-[var(--afrigo-text-secondary)]">{new Date(update.ts).toLocaleTimeString()}</span>
              </MotionDiv>
            ))
          )}
        </div>
      </MotionDiv>

      {/* ACTION MODAL */}
      <AnimatePresence>
        {activeActionModal && (
          <>
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveActionModal(null)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />
            <MotionDiv
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 100 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="rounded-3xl border border-[var(--afrigo-border)] bg-[var(--afrigo-surface)] p-8 shadow-2xl max-w-lg w-full">
                {actionModalStep === 0 && (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className="text-sm uppercase tracking-widest text-[var(--afrigo-secondary-gold)]">Execute Action</p>
                        <h2 className="mt-3 text-2xl font-black text-[var(--afrigo-primary-green)]">{activeActionModal.label}</h2>
                      </div>
                      <p className="text-4xl">{activeActionModal.icon}</p>
                    </div>

                    <p className="text-[var(--afrigo-text-secondary)]">{activeActionModal.detail}</p>

                    <div className="mt-6 space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-[var(--afrigo-text)] mb-2">Details</label>
                        <input
                          type="text"
                          placeholder="Enter details..."
                          onChange={(e) => setActionModalData({ ...actionModalData, details: e.target.value })}
                          className="w-full rounded-lg border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] px-4 py-3 text-[var(--afrigo-text)] focus:outline-none focus:border-[var(--afrigo-primary-green)] focus:ring-2 focus:ring-[var(--afrigo-primary-green)]/20 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-[var(--afrigo-text)] mb-2">Quantity / Amount</label>
                        <input
                          type="number"
                          placeholder="0"
                          onChange={(e) => setActionModalData({ ...actionModalData, quantity: e.target.value })}
                          className="w-full rounded-lg border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] px-4 py-3 text-[var(--afrigo-text)] focus:outline-none focus:border-[var(--afrigo-primary-green)] focus:ring-2 focus:ring-[var(--afrigo-primary-green)]/20 transition"
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                      <MotionButton
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveActionModal(null)}
                        className="flex-1 rounded-lg border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] py-3 font-semibold text-[var(--afrigo-text)] hover:border-[var(--afrigo-primary-green)] hover:text-[var(--afrigo-primary-green)] transition"
                      >
                        Cancel
                      </MotionButton>
                      <MotionButton
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleActionSubmit(activeActionModal)}
                        className="flex-1 rounded-lg bg-gradient-to-r from-[var(--afrigo-primary-green)] to-[var(--afrigo-secondary-gold)] py-3 font-semibold text-white hover:opacity-90 shadow-lg hover:shadow-xl transition"
                      >
                        Submit & Execute
                      </MotionButton>
                    </div>
                  </>
                )}

                {actionModalStep === 1 && (
                  <div className="text-center py-8">
                    <MotionDiv initial={{ scale: 0 }} animate={{ scale: 1, rotate: 360 }} transition={{ type: 'spring', stiffness: 100 }} className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-[var(--afrigo-primary-green)] to-[var(--afrigo-secondary-gold)] flex items-center justify-center text-3xl">
                      ⚙️
                    </MotionDiv>
                    <p className="font-semibold text-[var(--afrigo-text)] text-lg">Processing...</p>
                    <p className="mt-2 text-sm text-[var(--afrigo-text-secondary)]">Executing {activeActionModal.label}</p>
                    <MotionDiv initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 1.2 }} className="mt-4 h-1 rounded-full bg-gradient-to-r from-[var(--afrigo-primary-green)] to-[var(--afrigo-secondary-gold)]" />
                  </div>
                )}

                {actionModalStep === 2 && (
                  <div className="text-center py-8">
                    <MotionDiv initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 100 }} className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-500 flex items-center justify-center text-3xl">
                      ✓
                    </MotionDiv>
                    <p className="font-semibold text-[var(--afrigo-text)] text-lg">Success!</p>
                    <p className="mt-2 text-sm text-[var(--afrigo-text-secondary)]">{getActionSuccessMessage(activeActionModal, displayRole)}</p>
                  </div>
                )}
              </div>
            </MotionDiv>
          </>
        )}
      </AnimatePresence>
    </MotionDiv>
  )
}
