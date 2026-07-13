'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/lib/auth'
import { normalizeRole, Role } from '@/lib/roles'
import { authenticatedFetch } from '@/lib/apiClient'
import TradeOperations from '@/components/TradeOperations'

const MotionDiv = motion.div as any
const MotionButton = motion.button as any

type UpdateEvent = { message: string; ts: number; status?: string }

// ============================================================================
// BUYER DASHBOARD TYPES & DATA
// ============================================================================

type BuyerRFQ = {
  id: string
  title: string
  quantity: number
  unit: string
  destination: string
  deadline: string
  budget: string
  status: 'Draft' | 'Open' | 'Bid Received' | 'Awarded'
  bidCount: number
}

type BuyerBid = {
  id: string
  supplierId: string
  supplierName: string
  rating: number
  price: number
  delivery: string
  terms: string
}

type BuyerShipment = {
  id: string
  status: 'Processing' | 'In Transit' | 'Customs Clearance' | 'Delivered'
  carrier: string
  eta: string
  location: string
  progress: number
}

// ============================================================================
// SELLER DASHBOARD TYPES & DATA
// ============================================================================

type SellerLot = {
  id: string
  product: string
  quantity: number
  unit: string
  grade: string
  price: number
  origin: string
  inStock: boolean
  photo?: string
}

type SellerRFQRequest = {
  id: string
  buyerId: string
  buyerName: string
  product: string
  quantity: number
  deadline: string
  status: 'New' | 'Quoted' | 'Won' | 'Lost'
}

type SellerAnalytics = {
  totalBids: number
  winRate: number
  revenueThisMonth: number
  topCustomer: string
  responseTime: number
}

// ============================================================================
// EXPORTER DASHBOARD TYPES & DATA
// ============================================================================

type ExportDoc = {
  id: string
  type: 'COO' | 'Invoice' | 'Packing List' | 'BoL' | 'Customs'
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected'
  shipmentId: string
  uploadedAt?: string
}

type ExportPickup = {
  id: string
  warehouseLocation: string
  containerCount: number
  estimatedWeight: string
  preferredDate: string
  carrier?: string
  status: 'Scheduled' | 'Confirmed' | 'In Transit' | 'Delivered'
}

type ComplianceItem = {
  id: string
  category: string
  requirement: string
  status: 'Pending' | 'Completed' | 'Verified'
  dueDate: string
}

// ============================================================================
// ROLE-SPECIFIC CONFIGS
// ============================================================================

const BuyerConfig = {
  hero: 'Buyer Dashboard',
  subtitle: 'Source products • Request quotes • Manage purchases from global suppliers',
  actions: [
    {
      id: 'create-rfq',
      label: 'Create RFQ',
      detail: 'Post a new request for quotation to find suppliers',
      icon: '📋',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'compare-bids',
      label: 'Compare Bids',
      detail: 'Review and compare proposals from multiple suppliers',
      icon: '⚖️',
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'track-shipment',
      label: 'Track Shipment',
      detail: 'Monitor your orders from warehouse to destination',
      icon: '🚢',
      color: 'from-green-500 to-green-600'
    }
  ]
}

const SellerConfig = {
  hero: 'Seller Dashboard',
  subtitle: 'Manage inventory • Respond to buyers • Grow your sales',
  actions: [
    {
      id: 'respond-rfq',
      label: 'Respond to RFQ',
      detail: 'Browse buyer requests and submit competitive quotes',
      icon: '✉️',
      color: 'from-emerald-500 to-emerald-600'
    },
    {
      id: 'manage-inventory',
      label: 'Manage Inventory',
      detail: 'Add, update, and organize your product lots',
      icon: '📦',
      color: 'from-orange-500 to-orange-600'
    },
    {
      id: 'view-analytics',
      label: 'View Analytics',
      detail: 'Track performance metrics and win rates',
      icon: '📊',
      color: 'from-cyan-500 to-cyan-600'
    }
  ]
}

const ExporterConfig = {
  hero: 'Exporter Command Center',
  subtitle: 'Manage logistics • Clear customs • Ensure compliance',
  actions: [
    {
      id: 'file-export-docs',
      label: 'File Export Docs',
      detail: 'Upload and manage customs documentation',
      icon: '📄',
      color: 'from-rose-500 to-rose-600'
    },
    {
      id: 'schedule-pickup',
      label: 'Schedule Pickup',
      detail: 'Book logistics and coordinate warehouse pickups',
      icon: '🛳️',
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      id: 'monitor-compliance',
      label: 'Monitor Compliance',
      detail: 'Track regulatory requirements and certifications',
      icon: '✅',
      color: 'from-teal-500 to-teal-600'
    }
  ]
}

const RoleConfigs = {
  'Buyer': BuyerConfig,
  'Seller': SellerConfig,
  'Exporter': ExporterConfig
}

export default function Dashboard() {
  const { user, isSignedIn, isDemo } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [displayName, setDisplayName] = useState('Guest')
  const [updates, setUpdates] = useState<UpdateEvent[]>([])
  const [statusMessage, setStatusMessage] = useState('Live')
  const [activeActionId, setActiveActionId] = useState<string | null>(null)
  const [activeStep, setActiveStep] = useState(0)

  // Buyer State
  const [buyerRFQs, setBuyerRFQs] = useState<BuyerRFQ[]>([
    { id: '1', title: 'Coffee Beans - Arabica', quantity: 5000, unit: 'kg', destination: 'Germany', deadline: '2026-07-15', budget: '$25,000-$30,000', status: 'Bid Received', bidCount: 8 },
    { id: '2', title: 'Cocoa Butter - Premium Grade', quantity: 2000, unit: 'kg', destination: 'Belgium', deadline: '2026-07-30', budget: '$18,000-$22,000', status: 'Open', bidCount: 3 }
  ])
  const [buyerBids, setBuyerBids] = useState<BuyerBid[]>([
    { id: '1', supplierId: 's1', supplierName: 'Premium Coffee Co', rating: 4.8, price: 28, delivery: '15 days', terms: 'PayPal, 30% upfront' },
    { id: '2', supplierId: 's2', supplierName: 'African Traders Inc', rating: 4.5, price: 26, delivery: '18 days', terms: 'Bank transfer, 50% upfront' },
    { id: '3', supplierId: 's3', supplierName: 'Global Export Ltd', rating: 4.9, price: 29, delivery: '12 days', terms: 'Escrow, 20% upfront' }
  ])
  const [buyerShipments, setBuyerShipments] = useState<BuyerShipment[]>([
    { id: '1', status: 'In Transit', carrier: 'DHL Global', eta: 'June 15, 2026', location: 'En route to Germany', progress: 65 },
    { id: '2', status: 'Customs Clearance', carrier: 'FedEx', eta: 'June 18, 2026', location: 'Port of Hamburg', progress: 45 }
  ])
  const [buyerCreateRFQForm, setBuyerCreateRFQForm] = useState({ product: '', quantity: '', destination: '', budget: '', deadline: '' })
  const [buyerSelectedBid, setBuyerSelectedBid] = useState<BuyerBid | null>(null)

  // Seller State
  const [sellerLots, setSellerLots] = useState<SellerLot[]>([
    { id: '1', product: 'Premium Robusta Coffee', quantity: 8000, unit: 'kg', grade: 'Grade A', price: 28, origin: 'Uganda', inStock: true },
    { id: '2', product: 'Organic Cocoa Butter', quantity: 3000, unit: 'kg', grade: 'Organic Certified', price: 19, origin: 'Ghana', inStock: true },
    { id: '3', product: 'Shea Butter', quantity: 5000, unit: 'kg', grade: 'Pure Grade', price: 12, origin: 'Burkina Faso', inStock: false }
  ])
  const [sellerRFQs, setSellerRFQs] = useState<SellerRFQRequest[]>([
    { id: '1', buyerId: 'b1', buyerName: 'German Imports GmbH', product: 'Coffee Beans', quantity: 5000, deadline: '2026-07-15', status: 'New' },
    { id: '2', buyerId: 'b2', buyerName: 'Belgian Trade Co', product: 'Cocoa Butter', quantity: 2000, deadline: '2026-07-30', status: 'New' }
  ])
  const sellerAnalytics: SellerAnalytics = isDemo
    ? { totalBids: 24, winRate: 62, revenueThisMonth: 125000, topCustomer: 'German Imports GmbH', responseTime: 2 }
    : { totalBids: sellerRFQs.filter(item => item.status === 'Quoted').length, winRate: 0, revenueThisMonth: 0, topCustomer: 'No completed contracts yet', responseTime: 0 }
  const [sellerCreateLotForm, setSellerCreateLotForm] = useState({ product: '', quantity: '', grade: '', price: '', origin: '' })
  const [sellerQuoteForm, setSellerQuoteForm] = useState({ rfqId: '', lotId: '', price: '', delivery: '', terms: '' })
  const [sellerSelectedRFQ, setSellerSelectedRFQ] = useState<SellerRFQRequest | null>(null)

  // Exporter State
  const [exporterDocs, setExporterDocs] = useState<ExportDoc[]>([
    { id: '1', type: 'Invoice', status: 'Draft', shipmentId: 'SHP001', uploadedAt: undefined },
    { id: '2', type: 'COO', status: 'Submitted', shipmentId: 'SHP001', uploadedAt: '2026-06-07' },
    { id: '3', type: 'Packing List', status: 'Approved', shipmentId: 'SHP001', uploadedAt: '2026-06-06' }
  ])
  const [exporterPickups, setExporterPickups] = useState<ExportPickup[]>([
    { id: '1', warehouseLocation: 'Kampala Central Hub', containerCount: 2, estimatedWeight: '5,000 kg', preferredDate: '2026-06-12', carrier: 'DHL Global', status: 'Confirmed' },
    { id: '2', warehouseLocation: 'Accra Port Warehouse', containerCount: 1, estimatedWeight: '2,000 kg', preferredDate: '2026-06-15', status: 'Scheduled' }
  ])
  const [exporterCompliance, setExporterCompliance] = useState<ComplianceItem[]>([
    { id: '1', category: 'Product Certification', requirement: 'ISO 9001', status: 'Completed', dueDate: '2026-06-30' },
    { id: '2', category: 'Customs', requirement: 'HS Code Declaration', status: 'Pending', dueDate: '2026-06-10' },
    { id: '3', category: 'Origin', requirement: 'Certificate of Origin', status: 'Verified', dueDate: '2026-06-30' }
  ])
  const [exporterDocForm, setExporterDocForm] = useState<{ docType: string; file: File | null; shipmentId: string }>({ docType: 'Invoice', file: null, shipmentId: '' })
  const [exporterPickupForm, setExporterPickupForm] = useState({ warehouse: '', containers: '', weight: '', date: '', carrier: '' })

  const addUpdate = (message: string) => {
    setUpdates(prev => [{ message, ts: Date.now() }, ...prev].slice(0, 10))
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (isDemo) {
      setDisplayName(user?.displayName || 'Preview Trader')
    } else if (isSignedIn) {
      setBuyerRFQs([])
      setBuyerBids([])
      setBuyerShipments([])
      setSellerLots([])
      setSellerRFQs([])
      setExporterDocs([])
      setExporterPickups([])
      setExporterCompliance([])
      setDisplayName(user?.displayName || 'User')
    }
    setMounted(true)
  }, [isSignedIn, isDemo, user])

  useEffect(() => {
    if (!isSignedIn || !user?.role) return
    setStatusMessage('Syncing…')
    void (async () => {
      try {
        const result = await authenticatedFetch('/api/dashboard')
        if (user.role === 'Buyer') {
          setBuyerRFQs(result.rfqs.map((r: any) => ({ id:r.id,title:r.title,quantity:r.quantity,unit:r.unit,destination:r.destination_country,deadline:r.deadline||'',budget:r.budget||'',status:r.status,bidCount:result.bids.filter((b:any)=>b.rfqId===r.id).length })))
          setBuyerBids(result.bids.map((b:any)=>({id:b.id,supplierId:b.supplierId,supplierName:b.supplierName||'Verified supplier',rating:b.rating||0,price:b.price,delivery:b.delivery||'',terms:typeof b.terms==='string'?b.terms:JSON.stringify(b.terms||{})})))
        } else if (user.role === 'Seller') {
          setSellerLots(result.lots.map((r: any) => ({ id:r.id,product:r.title,quantity:r.quantity,unit:r.unit,grade:r.grade||'',price:r.price||0,origin:r.origin||'',inStock:r.status==='active' })))
          setSellerRFQs(result.rfqs.map((r:any)=>({id:r.id,buyerId:r.buyerId,buyerName:r.buyerName||'Verified buyer',product:r.title,quantity:r.quantity,deadline:r.deadline||'',status:'New'})))
        } else {
          setExporterPickups(result.pickups.map((r: any) => ({ id:r.id,warehouseLocation:r.warehouse_location,containerCount:r.container_count,estimatedWeight:r.estimated_weight||'',preferredDate:r.preferred_date,carrier:r.carrier,status:r.status })))
          setExporterDocs(result.documents.map((r:any)=>({id:r.id,type:r.type,status:r.status,shipmentId:r.shipmentId,uploadedAt:r.createdAt?new Date(r.createdAt._seconds*1000).toISOString().split('T')[0]:undefined})))
          setExporterCompliance(result.compliance.map((r:any)=>({id:r.id,category:r.category,requirement:r.requirement,status:r.status,dueDate:r.dueDate||''})))
        }
        setStatusMessage('Live')
      } catch (error: any) {
        setStatusMessage('Data connection required')
        addUpdate(error.message || 'Unable to load your workspace data.')
        return
      }

      try {
        const activity = await authenticatedFetch('/api/analytics/activity')
        setUpdates((activity.activities || []).map((item: any) => ({ message: item.label, ts: new Date(item.created_at).getTime() })))
      } catch {
        addUpdate('Activity history is temporarily unavailable. Your trade data is still connected.')
      }
    })()
  }, [isSignedIn, user?.role])

  const displayRole = normalizeRole(user?.role)
  const config = displayRole ? RoleConfigs[displayRole as keyof typeof RoleConfigs] : null

  if (!mounted) return <div className="flex min-h-screen items-center justify-center bg-[var(--afrigo-bg)]"><p className="text-lg font-semibold text-[var(--afrigo-text)]">Loading...</p></div>

  if (!config || !displayRole) {
    return <div className="flex min-h-screen items-center justify-center"><Link href="/role-selection" className="rounded-lg bg-[var(--afrigo-primary-green)] px-6 py-2 text-white">Choose role</Link></div>
  }

  // ============================================================================
  // BUYER MODALS & HANDLERS
  // ============================================================================

  const handleBuyerCreateRFQ = async () => {
    if (!buyerCreateRFQForm.product || !buyerCreateRFQForm.quantity) return
    setActiveStep(1)
    if (isSignedIn) {
      try {
        const result = await authenticatedFetch('/api/trade?resource=rfqs', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ title:buyerCreateRFQForm.product, quantity:Number(buyerCreateRFQForm.quantity), unit:'units', destination_country:buyerCreateRFQForm.destination, budget:buyerCreateRFQForm.budget, deadline:buyerCreateRFQForm.deadline||null, status:'Open' }) })
        setBuyerRFQs(prev => [...prev, { id:result.data.id,title:result.data.title,quantity:result.data.quantity,unit:result.data.unit,destination:result.data.destination_country,deadline:result.data.deadline||'',budget:result.data.budget||'',status:result.data.status,bidCount:0 }])
        addUpdate(`RFQ posted: ${result.data.title}`); setActiveStep(2); setTimeout(()=>setActiveActionId(null),900)
      } catch(error:any){addUpdate(error.message);setActiveStep(0)}
      return
    }
    setTimeout(() => {
      setActiveStep(2)
      addUpdate(`✓ RFQ posted: ${buyerCreateRFQForm.product} (${buyerCreateRFQForm.quantity} units)`)
      setBuyerRFQs(prev => [...prev, {
        id: String(Math.random()),
        title: buyerCreateRFQForm.product,
        quantity: parseInt(buyerCreateRFQForm.quantity),
        unit: 'units',
        destination: buyerCreateRFQForm.destination,
        deadline: buyerCreateRFQForm.deadline,
        budget: buyerCreateRFQForm.budget,
        status: 'Open',
        bidCount: 0
      }])
    }, 1500)
    setTimeout(() => setActiveActionId(null), 3000)
  }

  const handleBuyerSelectBid = async (bid: BuyerBid) => {
    setActiveStep(1)
    if (isSignedIn) {
      try { await authenticatedFetch('/api/bids/award',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({bidId:bid.id})});setActiveStep(2);addUpdate(`Bid awarded to ${bid.supplierName}`);setBuyerBids(prev=>prev.filter(item=>item.id!==bid.id));setTimeout(()=>setActiveActionId(null),900) }
      catch(error:any){addUpdate(error.message);setActiveStep(0)}
      return
    }
    setTimeout(() => {
      setActiveStep(2)
      addUpdate(`✓ Bid awarded to ${bid.supplierName} at $${bid.price}/unit`)
      setBuyerBids(prev => prev.filter(b => b.id !== bid.id))
    }, 1500)
    setTimeout(() => setActiveActionId(null), 3000)
  }

  // ============================================================================
  // SELLER MODALS & HANDLERS
  // ============================================================================

  const handleSellerCreateLot = async () => {
    if (!sellerCreateLotForm.product || !sellerCreateLotForm.quantity) return
    setActiveStep(1)
    if (isSignedIn) {
      try {
        const result=await authenticatedFetch('/api/trade?resource=lots',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:sellerCreateLotForm.product,quantity:Number(sellerCreateLotForm.quantity),unit:'kg',grade:sellerCreateLotForm.grade,price:Number(sellerCreateLotForm.price),origin:sellerCreateLotForm.origin,status:'active'})})
        setSellerLots(prev=>[...prev,{id:result.data.id,product:result.data.title,quantity:result.data.quantity,unit:result.data.unit,grade:result.data.grade||'',price:result.data.price||0,origin:result.data.origin||'',inStock:true}]);addUpdate(`Lot added: ${result.data.title}`);setActiveStep(2);setTimeout(()=>setActiveActionId(null),900)
      }catch(error:any){addUpdate(error.message);setActiveStep(0)}
      return
    }
    setTimeout(() => {
      setActiveStep(2)
      addUpdate(`✓ Lot added: ${sellerCreateLotForm.product} (${sellerCreateLotForm.quantity} kg)`)
      setSellerLots(prev => [...prev, {
        id: String(Math.random()),
        product: sellerCreateLotForm.product,
        quantity: parseInt(sellerCreateLotForm.quantity),
        unit: 'kg',
        grade: sellerCreateLotForm.grade,
        price: parseInt(sellerCreateLotForm.price),
        origin: sellerCreateLotForm.origin,
        inStock: true
      }])
    }, 1500)
    setTimeout(() => setActiveActionId(null), 3000)
  }

  const handleSellerSubmitQuote = async () => {
    if (!sellerSelectedRFQ || !sellerQuoteForm.price || !sellerQuoteForm.lotId) { addUpdate('Select an inventory lot with enough available stock.'); return }
    setActiveStep(1)
    if (isSignedIn) {
      try { await authenticatedFetch('/api/trade?resource=bids',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({rfqId:sellerSelectedRFQ.id,lotId:sellerQuoteForm.lotId,supplierName:user?.displayName||'Verified supplier',price:Number(sellerQuoteForm.price),delivery:sellerQuoteForm.delivery,terms:sellerQuoteForm.terms,status:'Submitted'})});setActiveStep(2);addUpdate(`Quote submitted for ${sellerSelectedRFQ.product}`);setSellerRFQs(prev=>prev.map(r=>r.id===sellerSelectedRFQ.id?{...r,status:'Quoted'}:r));setSellerSelectedRFQ(null);setTimeout(()=>setActiveActionId(null),900) }
      catch(error:any){addUpdate(error.message);setActiveStep(0)}
      return
    }
    setTimeout(() => {
      setActiveStep(2)
      addUpdate(`✓ Quote submitted to ${sellerSelectedRFQ.buyerName}: $${sellerQuoteForm.price}/unit`)
      setSellerRFQs(prev => prev.map(r => r.id === sellerSelectedRFQ.id ? { ...r, status: 'Quoted' } : r))
      setSellerSelectedRFQ(null)
    }, 1500)
    setTimeout(() => setActiveActionId(null), 3000)
  }

  // ============================================================================
  // EXPORTER MODALS & HANDLERS
  // ============================================================================

  const handleExporterUploadDoc = async () => {
    if (!exporterDocForm.docType || !exporterDocForm.file) return
    setActiveStep(1)
    if (isSignedIn) {
      try {
        const payload = new FormData()
        payload.set('documentType', exporterDocForm.docType)
        payload.set('shipmentId', exporterDocForm.shipmentId)
        payload.set('file', exporterDocForm.file)
        const result = await authenticatedFetch('/api/documents/upload', { method: 'POST', body: payload })
        setExporterDocs(prev => [...prev, { id: result.data.id, type: result.data.type, status: result.data.status, shipmentId: result.data.shipmentId, uploadedAt: new Date().toISOString().split('T')[0] }])
        addUpdate(`${exporterDocForm.docType} uploaded securely`)
        setActiveStep(2)
        setTimeout(() => setActiveActionId(null), 900)
      } catch (error: any) { addUpdate(error.message); setActiveStep(0) }
      return
    }
    setTimeout(() => {
      setActiveStep(2)
      addUpdate(`✓ ${exporterDocForm.docType} submitted for ${exporterDocForm.shipmentId}`)
      setExporterDocs(prev => prev.map(d => d.type === exporterDocForm.docType ? { ...d, status: 'Submitted', uploadedAt: new Date().toISOString().split('T')[0] } : d))
    }, 1500)
    setTimeout(() => setActiveActionId(null), 3000)
  }

  const handleExporterSchedulePickup = async () => {
    if (!exporterPickupForm.warehouse || !exporterPickupForm.date) return
    setActiveStep(1)
    if (isSignedIn) {
      try {
        const result=await authenticatedFetch('/api/trade?resource=pickups',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({warehouse_location:exporterPickupForm.warehouse,container_count:Number(exporterPickupForm.containers),estimated_weight:exporterPickupForm.weight,preferred_date:exporterPickupForm.date,carrier:exporterPickupForm.carrier,status:'Scheduled'})})
        setExporterPickups(prev=>[...prev,{id:result.data.id,warehouseLocation:result.data.warehouse_location,containerCount:result.data.container_count,estimatedWeight:result.data.estimated_weight||'',preferredDate:result.data.preferred_date,carrier:result.data.carrier,status:result.data.status}]);addUpdate(`Pickup scheduled for ${result.data.warehouse_location}`);setActiveStep(2);setTimeout(()=>setActiveActionId(null),900)
      }catch(error:any){addUpdate(error.message);setActiveStep(0)}
      return
    }
    setTimeout(() => {
      setActiveStep(2)
      addUpdate(`✓ Pickup scheduled for ${exporterPickupForm.warehouse} on ${exporterPickupForm.date}`)
      setExporterPickups(prev => [...prev, {
        id: String(Math.random()),
        warehouseLocation: exporterPickupForm.warehouse,
        containerCount: parseInt(exporterPickupForm.containers),
        estimatedWeight: exporterPickupForm.weight,
        preferredDate: exporterPickupForm.date,
        carrier: exporterPickupForm.carrier,
        status: 'Scheduled'
      }])
    }, 1500)
    setTimeout(() => setActiveActionId(null), 3000)
  }

  return (
    <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-12">
      {/* HEADER */}
      <MotionDiv initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-[var(--afrigo-border)] bg-gradient-to-r from-[var(--afrigo-surface)] to-[var(--afrigo-bg)] p-8 shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--afrigo-secondary-gold)]">Trading Platform</p>
            <h1 className="mt-2 text-4xl font-black text-[var(--afrigo-primary-green)]">{displayName}</h1>
            <p className="mt-1 text-[var(--afrigo-text)]">{config.hero}</p>
            <p className="mt-1 text-sm text-[var(--afrigo-text-secondary)]">{config.subtitle}</p>
          </div>
          <div className="rounded-2xl bg-[var(--afrigo-bg)] px-6 py-3">
            <p className="text-sm text-[var(--afrigo-text-secondary)]">Status: <span className="font-semibold text-[var(--afrigo-primary-green)]">{statusMessage}</span></p>
          </div>
        </div>
      </MotionDiv>

      {/* PRIMARY ACTIONS */}
      <div className="grid gap-4 lg:grid-cols-3">
        {config.actions.map((action, i) => (
          <MotionDiv
            key={action.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -8, scale: 1.02 }}
            onClick={() => { setActiveActionId(action.id); setActiveStep(0) }}
            className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${action.color} p-8 text-white shadow-lg hover:shadow-2xl cursor-pointer transition`}
          >
            <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-white opacity-10 group-hover:scale-150 transition-transform duration-300" />
            <div className="relative z-10">
              <MotionDiv animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 3, repeat: Infinity }} className="text-5xl mb-3">{action.icon}</MotionDiv>
              <h3 className="text-2xl font-black">{action.label}</h3>
              <p className="mt-2 text-sm opacity-90">{action.detail}</p>
              <MotionButton whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="mt-4 rounded-lg bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur transition hover:bg-white/30">
                Launch →
              </MotionButton>
            </div>
          </MotionDiv>
        ))}
      </div>

      {/* BUYER ACTION MODALS */}
      {displayRole === 'Buyer' && (
        <>
          {/* CREATE RFQ MODAL */}
          <AnimatePresence>
            {activeActionId === 'create-rfq' && (
              <>
                <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveActionId(null)} className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
                <MotionDiv initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div className="rounded-3xl border border-[var(--afrigo-border)] bg-[var(--afrigo-surface)] p-8 shadow-2xl max-w-lg w-full">
                    {activeStep === 0 && (
                      <>
                        <div className="mb-6">
                          <p className="text-sm uppercase tracking-widest text-[var(--afrigo-secondary-gold)]">Create New Request</p>
                          <h2 className="mt-3 text-2xl font-black text-[var(--afrigo-primary-green)]">Post RFQ</h2>
                        </div>
                        <div className="space-y-4">
                          <input type="text" placeholder="Product name" value={buyerCreateRFQForm.product} onChange={(e) => setBuyerCreateRFQForm({...buyerCreateRFQForm, product: e.target.value})} className="w-full rounded-lg border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] px-4 py-3 text-[var(--afrigo-text)] focus:outline-none focus:border-[var(--afrigo-primary-green)] focus:ring-2 focus:ring-[var(--afrigo-primary-green)]/20" />
                          <input type="number" placeholder="Quantity needed" value={buyerCreateRFQForm.quantity} onChange={(e) => setBuyerCreateRFQForm({...buyerCreateRFQForm, quantity: e.target.value})} className="w-full rounded-lg border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] px-4 py-3 text-[var(--afrigo-text)] focus:outline-none focus:border-[var(--afrigo-primary-green)] focus:ring-2 focus:ring-[var(--afrigo-primary-green)]/20" />
                          <input type="text" placeholder="Destination country" value={buyerCreateRFQForm.destination} onChange={(e) => setBuyerCreateRFQForm({...buyerCreateRFQForm, destination: e.target.value})} className="w-full rounded-lg border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] px-4 py-3 text-[var(--afrigo-text)] focus:outline-none focus:border-[var(--afrigo-primary-green)] focus:ring-2 focus:ring-[var(--afrigo-primary-green)]/20" />
                          <input type="text" placeholder="Budget range" value={buyerCreateRFQForm.budget} onChange={(e) => setBuyerCreateRFQForm({...buyerCreateRFQForm, budget: e.target.value})} className="w-full rounded-lg border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] px-4 py-3 text-[var(--afrigo-text)] focus:outline-none focus:border-[var(--afrigo-primary-green)] focus:ring-2 focus:ring-[var(--afrigo-primary-green)]/20" />
                          <input type="date" value={buyerCreateRFQForm.deadline} onChange={(e) => setBuyerCreateRFQForm({...buyerCreateRFQForm, deadline: e.target.value})} className="w-full rounded-lg border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] px-4 py-3 text-[var(--afrigo-text)] focus:outline-none focus:border-[var(--afrigo-primary-green)] focus:ring-2 focus:ring-[var(--afrigo-primary-green)]/20" />
                        </div>
                        <div className="mt-6 flex gap-3">
                          <MotionButton whileTap={{ scale: 0.95 }} onClick={() => setActiveActionId(null)} className="flex-1 rounded-lg border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] py-3 font-semibold text-[var(--afrigo-text)] hover:border-[var(--afrigo-primary-green)] hover:text-[var(--afrigo-primary-green)]">Cancel</MotionButton>
                          <MotionButton whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={handleBuyerCreateRFQ} className="flex-1 rounded-lg bg-gradient-to-r from-[var(--afrigo-primary-green)] to-[var(--afrigo-secondary-gold)] py-3 font-semibold text-white hover:opacity-90">Post RFQ</MotionButton>
                        </div>
                      </>
                    )}
                    {activeStep === 1 && (
                      <div className="text-center py-8">
                        <MotionDiv initial={{ scale: 0 }} animate={{ scale: 1, rotate: 360 }} transition={{ type: 'spring', stiffness: 100 }} className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-3xl">🔍</MotionDiv>
                        <p className="font-semibold text-[var(--afrigo-text)] text-lg">Publishing RFQ...</p>
                        <MotionDiv initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 1.2 }} className="mt-4 h-1 rounded-full bg-gradient-to-r from-blue-500 to-blue-600" />
                      </div>
                    )}
                    {activeStep === 2 && (
                      <div className="text-center py-8">
                        <MotionDiv initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 100 }} className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-500 flex items-center justify-center text-3xl">✓</MotionDiv>
                        <p className="font-semibold text-[var(--afrigo-text)] text-lg">RFQ Posted!</p>
                        <p className="mt-2 text-sm text-[var(--afrigo-text-secondary)]">Published to verified suppliers in your network</p>
                      </div>
                    )}
                  </div>
                </MotionDiv>
              </>
            )}
          </AnimatePresence>

          {/* COMPARE BIDS MODAL */}
          <AnimatePresence>
            {activeActionId === 'compare-bids' && (
              <>
                <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveActionId(null)} className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
                <MotionDiv initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div className="rounded-3xl border border-[var(--afrigo-border)] bg-[var(--afrigo-surface)] p-8 shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                    {activeStep === 0 && (
                      <>
                        <div className="mb-6 flex items-center justify-between">
                          <div>
                            <p className="text-sm uppercase tracking-widest text-[var(--afrigo-secondary-gold)]">Received Bids</p>
                            <h2 className="mt-3 text-2xl font-black text-[var(--afrigo-primary-green)]">Compare Proposals</h2>
                          </div>
                          <MotionButton whileTap={{ scale: 0.95 }} onClick={() => setActiveActionId(null)} className="text-[var(--afrigo-text-secondary)] hover:text-[var(--afrigo-text)]">✕</MotionButton>
                        </div>
                        <div className="space-y-3">
                          {buyerBids.map((bid, idx) => (
                            <MotionDiv key={bid.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} whileHover={{ scale: 1.02 }} className="rounded-xl border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] p-4 cursor-pointer hover:border-[var(--afrigo-primary-green)] transition">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-[var(--afrigo-text)]">{bid.supplierName}</p>
                                    <div className="flex">
                                      {[...Array(5)].map((_, i) => (
                                        <span key={i} className={i < Math.floor(bid.rating) ? 'text-yellow-400' : 'text-[var(--afrigo-text-secondary)]'}>★</span>
                                      ))}
                                    </div>
                                    <span className="text-xs text-[var(--afrigo-text-secondary)]">({bid.rating})</span>
                                  </div>
                                  <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                                    <div>
                                      <p className="text-xs text-[var(--afrigo-text-secondary)]">Price</p>
                                      <p className="font-bold text-[var(--afrigo-primary-green)]">${bid.price}/unit</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-[var(--afrigo-text-secondary)]">Delivery</p>
                                      <p className="font-semibold text-[var(--afrigo-text)]">{bid.delivery}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-[var(--afrigo-text-secondary)]">Terms</p>
                                      <p className="font-semibold text-[var(--afrigo-text)]">{bid.terms.split(',')[0]}</p>
                                    </div>
                                  </div>
                                </div>
                                <MotionButton whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { setBuyerSelectedBid(bid); handleBuyerSelectBid(bid) }} className="rounded-lg bg-[var(--afrigo-primary-green)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                                  Select
                                </MotionButton>
                              </div>
                            </MotionDiv>
                          ))}
                        </div>
                      </>
                    )}
                    {activeStep === 1 && buyerSelectedBid && (
                      <div className="text-center py-8">
                        <MotionDiv initial={{ scale: 0 }} animate={{ scale: 1, rotate: 360 }} transition={{ type: 'spring', stiffness: 100 }} className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center text-3xl">⚖️</MotionDiv>
                        <p className="font-semibold text-[var(--afrigo-text)] text-lg">Processing Selection...</p>
                        <MotionDiv initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 1.2 }} className="mt-4 h-1 rounded-full bg-gradient-to-r from-purple-500 to-purple-600" />
                      </div>
                    )}
                    {activeStep === 2 && buyerSelectedBid && (
                      <div className="text-center py-8">
                        <MotionDiv initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 100 }} className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-500 flex items-center justify-center text-3xl">✓</MotionDiv>
                        <p className="font-semibold text-[var(--afrigo-text)] text-lg">Bid Awarded!</p>
                        <p className="mt-2 text-sm text-[var(--afrigo-text-secondary)]">Contract initiated with {buyerSelectedBid.supplierName}</p>
                        <p className="mt-1 text-xs text-[var(--afrigo-text-secondary)]">Total: ${buyerSelectedBid.price} × 5000 units = ${(buyerSelectedBid.price * 5000).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </MotionDiv>
              </>
            )}
          </AnimatePresence>

          {/* TRACK SHIPMENT MODAL */}
          <AnimatePresence>
            {activeActionId === 'track-shipment' && (
              <>
                <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveActionId(null)} className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
                <MotionDiv initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div className="rounded-3xl border border-[var(--afrigo-border)] bg-[var(--afrigo-surface)] p-8 shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <p className="text-sm uppercase tracking-widest text-[var(--afrigo-secondary-gold)]">Live Tracking</p>
                        <h2 className="mt-3 text-2xl font-black text-[var(--afrigo-primary-green)]">Your Shipments</h2>
                      </div>
                      <MotionButton whileTap={{ scale: 0.95 }} onClick={() => setActiveActionId(null)} className="text-[var(--afrigo-text-secondary)] hover:text-[var(--afrigo-text)]">✕</MotionButton>
                    </div>
                    <div className="space-y-4">
                      {buyerShipments.map((shipment, idx) => (
                        <MotionDiv key={shipment.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} className="rounded-xl border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="font-semibold text-[var(--afrigo-text)]">{shipment.carrier}</p>
                              <p className="text-xs text-[var(--afrigo-text-secondary)]">{shipment.location}</p>
                            </div>
                            <MotionDiv className={`px-3 py-1 rounded-full text-xs font-semibold ${shipment.status === 'Delivered' ? 'bg-green-500/20 text-green-600' : 'bg-blue-500/20 text-blue-600'}`}>
                              {shipment.status}
                            </MotionDiv>
                          </div>
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-xs mb-2">
                              <span className="text-[var(--afrigo-text-secondary)]">Progress</span>
                              <span className="font-semibold text-[var(--afrigo-primary-green)]">{shipment.progress}%</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--afrigo-border)]">
                              <MotionDiv initial={{ width: 0 }} animate={{ width: `${shipment.progress}%` }} transition={{ duration: 0.8 }} className="h-full bg-gradient-to-r from-green-500 to-green-600" />
                            </div>
                          </div>
                          <p className="text-xs text-[var(--afrigo-text-secondary)]">ETA: {shipment.eta}</p>
                        </MotionDiv>
                      ))}
                    </div>
                  </div>
                </MotionDiv>
              </>
            )}
          </AnimatePresence>
        </>
      )}

      {/* SELLER ACTION MODALS */}
      {displayRole === 'Seller' && (
        <>
          {/* RESPOND TO RFQ MODAL */}
          <AnimatePresence>
            {activeActionId === 'respond-rfq' && (
              <>
                <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveActionId(null)} className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
                <MotionDiv initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div className="rounded-3xl border border-[var(--afrigo-border)] bg-[var(--afrigo-surface)] p-8 shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                    {activeStep === 0 && (
                      <>
                        <div className="mb-6 flex items-center justify-between">
                          <div>
                            <p className="text-sm uppercase tracking-widest text-[var(--afrigo-secondary-gold)]">Open Opportunities</p>
                            <h2 className="mt-3 text-2xl font-black text-[var(--afrigo-primary-green)]">Respond to RFQs</h2>
                          </div>
                          <MotionButton whileTap={{ scale: 0.95 }} onClick={() => setActiveActionId(null)} className="text-[var(--afrigo-text-secondary)] hover:text-[var(--afrigo-text)]">✕</MotionButton>
                        </div>
                        {sellerSelectedRFQ ? (
                          <div className="space-y-4">
                            <div className="rounded-xl border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] p-4">
                              <p className="text-xs text-[var(--afrigo-text-secondary)]">Buyer: {sellerSelectedRFQ.buyerName}</p>
                              <p className="font-semibold text-[var(--afrigo-text)] mt-1">{sellerSelectedRFQ.product}</p>
                              <p className="text-sm text-[var(--afrigo-text-secondary)] mt-1">Qty: {sellerSelectedRFQ.quantity} units • Deadline: {sellerSelectedRFQ.deadline}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-[var(--afrigo-text)] mb-2">Inventory lot</label>
                              <select value={sellerQuoteForm.lotId} onChange={(e) => setSellerQuoteForm({...sellerQuoteForm, lotId: e.target.value})} className="mb-4 w-full rounded-lg border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] px-4 py-3 text-[var(--afrigo-text)]">
                                <option value="">Select available stock</option>
                                {sellerLots.filter(lot=>lot.inStock && lot.quantity >= (sellerSelectedRFQ?.quantity||0)).map(lot=><option key={lot.id} value={lot.id}>{lot.product} - {lot.quantity.toLocaleString()} {lot.unit}</option>)}
                              </select>
                              <label className="block text-sm font-semibold text-[var(--afrigo-text)] mb-2">Your Quote (per unit)</label>
                              <input type="number" placeholder="$25.00" value={sellerQuoteForm.price} onChange={(e) => setSellerQuoteForm({...sellerQuoteForm, price: e.target.value})} className="w-full rounded-lg border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] px-4 py-3 text-[var(--afrigo-text)] focus:outline-none focus:border-[var(--afrigo-primary-green)] focus:ring-2 focus:ring-[var(--afrigo-primary-green)]/20" />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-[var(--afrigo-text)] mb-2">Delivery Timeline</label>
                              <input type="text" placeholder="15 days" value={sellerQuoteForm.delivery} onChange={(e) => setSellerQuoteForm({...sellerQuoteForm, delivery: e.target.value})} className="w-full rounded-lg border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] px-4 py-3 text-[var(--afrigo-text)] focus:outline-none focus:border-[var(--afrigo-primary-green)] focus:ring-2 focus:ring-[var(--afrigo-primary-green)]/20" />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-[var(--afrigo-text)] mb-2">Payment Terms</label>
                              <input type="text" placeholder="50% upfront, 50% on delivery" value={sellerQuoteForm.terms} onChange={(e) => setSellerQuoteForm({...sellerQuoteForm, terms: e.target.value})} className="w-full rounded-lg border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] px-4 py-3 text-[var(--afrigo-text)] focus:outline-none focus:border-[var(--afrigo-primary-green)] focus:ring-2 focus:ring-[var(--afrigo-primary-green)]/20" />
                            </div>
                            <div className="flex gap-3">
                              <MotionButton whileTap={{ scale: 0.95 }} onClick={() => setSellerSelectedRFQ(null)} className="flex-1 rounded-lg border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] py-3 font-semibold text-[var(--afrigo-text)] hover:border-[var(--afrigo-primary-green)] hover:text-[var(--afrigo-primary-green)]">Back</MotionButton>
                              <MotionButton whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={handleSellerSubmitQuote} className="flex-1 rounded-lg bg-gradient-to-r from-[var(--afrigo-primary-green)] to-[var(--afrigo-secondary-gold)] py-3 font-semibold text-white hover:opacity-90">Submit Quote</MotionButton>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {sellerRFQs.map((rfq, idx) => (
                              <MotionDiv key={rfq.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} whileHover={{ scale: 1.02 }} onClick={() => setSellerSelectedRFQ(rfq)} className="rounded-xl border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] p-4 cursor-pointer hover:border-[var(--afrigo-primary-green)] transition">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="text-xs text-[var(--afrigo-text-secondary)]">{rfq.buyerName}</p>
                                    <p className="font-semibold text-[var(--afrigo-text)] mt-1">{rfq.product}</p>
                                    <p className="text-sm text-[var(--afrigo-text-secondary)] mt-1">{rfq.quantity} units • {rfq.deadline}</p>
                                  </div>
                                  <MotionDiv className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-600">
                                    New
                                  </MotionDiv>
                                </div>
                              </MotionDiv>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                    {activeStep === 1 && (
                      <div className="text-center py-8">
                        <MotionDiv initial={{ scale: 0 }} animate={{ scale: 1, rotate: 360 }} transition={{ type: 'spring', stiffness: 100 }} className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center text-3xl">✉️</MotionDiv>
                        <p className="font-semibold text-[var(--afrigo-text)] text-lg">Submitting Quote...</p>
                        <MotionDiv initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 1.2 }} className="mt-4 h-1 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600" />
                      </div>
                    )}
                    {activeStep === 2 && (
                      <div className="text-center py-8">
                        <MotionDiv initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 100 }} className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-500 flex items-center justify-center text-3xl">✓</MotionDiv>
                        <p className="font-semibold text-[var(--afrigo-text)] text-lg">Quote Sent!</p>
                        <p className="mt-2 text-sm text-[var(--afrigo-text-secondary)]">Your proposal is now visible to {sellerSelectedRFQ?.buyerName}</p>
                      </div>
                    )}
                  </div>
                </MotionDiv>
              </>
            )}
          </AnimatePresence>

          {/* MANAGE INVENTORY MODAL */}
          <AnimatePresence>
            {activeActionId === 'manage-inventory' && (
              <>
                <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveActionId(null)} className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
                <MotionDiv initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div className="rounded-3xl border border-[var(--afrigo-border)] bg-[var(--afrigo-surface)] p-8 shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <p className="text-sm uppercase tracking-widest text-[var(--afrigo-secondary-gold)]">Your Inventory</p>
                        <h2 className="mt-3 text-2xl font-black text-[var(--afrigo-primary-green)]">Manage Lots</h2>
                      </div>
                      <MotionButton whileTap={{ scale: 0.95 }} onClick={() => setActiveActionId(null)} className="text-[var(--afrigo-text-secondary)] hover:text-[var(--afrigo-text)]">✕</MotionButton>
                    </div>
                    {activeStep === 0 && (
                      <div className="space-y-4">
                        <div className="space-y-3 mb-6">
                          {sellerLots.map((lot, idx) => (
                            <MotionDiv key={lot.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} className="rounded-xl border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-semibold text-[var(--afrigo-text)]">{lot.product}</p>
                                  <p className="text-xs text-[var(--afrigo-text-secondary)] mt-1">{lot.origin} • Grade: {lot.grade}</p>
                                  <div className="flex gap-4 mt-2 text-sm">
                                    <span>📦 {lot.quantity.toLocaleString()} {lot.unit}</span>
                                    <span className="text-[var(--afrigo-primary-green)] font-semibold">${lot.price}/{lot.unit}</span>
                                  </div>
                                </div>
                                <MotionDiv className={`px-3 py-1 rounded-full text-xs font-semibold ${lot.inStock ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'}`}>
                                  {lot.inStock ? 'In Stock' : 'Out'}
                                </MotionDiv>
                              </div>
                            </MotionDiv>
                          ))}
                        </div>
                        <div className="rounded-xl border-2 border-dashed border-[var(--afrigo-border)] p-4 text-center">
                          <p className="text-[var(--afrigo-text-secondary)] mb-3">Add New Lot</p>
                          <input type="text" placeholder="Product name" value={sellerCreateLotForm.product} onChange={(e) => setSellerCreateLotForm({...sellerCreateLotForm, product: e.target.value})} className="w-full rounded-lg border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] px-4 py-2 text-sm text-[var(--afrigo-text)] focus:outline-none focus:border-[var(--afrigo-primary-green)] mb-2" />
                          <div className="grid grid-cols-2 gap-2">
                            <input type="number" placeholder="Quantity" value={sellerCreateLotForm.quantity} onChange={(e) => setSellerCreateLotForm({...sellerCreateLotForm, quantity: e.target.value})} className="rounded-lg border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] px-3 py-2 text-sm text-[var(--afrigo-text)] focus:outline-none focus:border-[var(--afrigo-primary-green)]" />
                            <input type="text" placeholder="Grade" value={sellerCreateLotForm.grade} onChange={(e) => setSellerCreateLotForm({...sellerCreateLotForm, grade: e.target.value})} className="rounded-lg border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] px-3 py-2 text-sm text-[var(--afrigo-text)] focus:outline-none focus:border-[var(--afrigo-primary-green)]" />
                            <input type="number" placeholder="Price" value={sellerCreateLotForm.price} onChange={(e) => setSellerCreateLotForm({...sellerCreateLotForm, price: e.target.value})} className="rounded-lg border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] px-3 py-2 text-sm text-[var(--afrigo-text)] focus:outline-none focus:border-[var(--afrigo-primary-green)]" />
                            <input type="text" placeholder="Origin" value={sellerCreateLotForm.origin} onChange={(e) => setSellerCreateLotForm({...sellerCreateLotForm, origin: e.target.value})} className="rounded-lg border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] px-3 py-2 text-sm text-[var(--afrigo-text)] focus:outline-none focus:border-[var(--afrigo-primary-green)]" />
                          </div>
                          <MotionButton whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={handleSellerCreateLot} className="mt-3 w-full rounded-lg bg-gradient-to-r from-[var(--afrigo-primary-green)] to-[var(--afrigo-secondary-gold)] py-2 text-sm font-semibold text-white hover:opacity-90">
                            Add Lot
                          </MotionButton>
                        </div>
                      </div>
                    )}
                    {activeStep === 1 && (
                      <div className="text-center py-8">
                        <MotionDiv initial={{ scale: 0 }} animate={{ scale: 1, rotate: 360 }} transition={{ type: 'spring', stiffness: 100 }} className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center text-3xl">📦</MotionDiv>
                        <p className="font-semibold text-[var(--afrigo-text)] text-lg">Adding to Inventory...</p>
                        <MotionDiv initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 1.2 }} className="mt-4 h-1 rounded-full bg-gradient-to-r from-orange-500 to-orange-600" />
                      </div>
                    )}
                    {activeStep === 2 && (
                      <div className="text-center py-8">
                        <MotionDiv initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 100 }} className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-500 flex items-center justify-center text-3xl">✓</MotionDiv>
                        <p className="font-semibold text-[var(--afrigo-text)] text-lg">Lot Added!</p>
                        <p className="mt-2 text-sm text-[var(--afrigo-text-secondary)]">Now visible to buyers seeking your products</p>
                      </div>
                    )}
                  </div>
                </MotionDiv>
              </>
            )}
          </AnimatePresence>

          {/* VIEW ANALYTICS MODAL */}
          <AnimatePresence>
            {activeActionId === 'view-analytics' && (
              <>
                <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveActionId(null)} className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
                <MotionDiv initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div className="rounded-3xl border border-[var(--afrigo-border)] bg-[var(--afrigo-surface)] p-8 shadow-2xl max-w-2xl w-full">
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <p className="text-sm uppercase tracking-widest text-[var(--afrigo-secondary-gold)]">Performance Data</p>
                        <h2 className="mt-3 text-2xl font-black text-[var(--afrigo-primary-green)]">Your Analytics</h2>
                      </div>
                      <MotionButton whileTap={{ scale: 0.95 }} onClick={() => setActiveActionId(null)} className="text-[var(--afrigo-text-secondary)] hover:text-[var(--afrigo-text)]">✕</MotionButton>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }} className="rounded-xl border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] p-4">
                        <p className="text-xs text-[var(--afrigo-text-secondary)]">Total Bids</p>
                        <MotionDiv initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="text-3xl font-black text-[var(--afrigo-primary-green)] mt-2">{sellerAnalytics.totalBids}</MotionDiv>
                        <p className="text-xs text-green-600 mt-1">+4 this week</p>
                      </MotionDiv>
                      <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] p-4">
                        <p className="text-xs text-[var(--afrigo-text-secondary)]">Win Rate</p>
                        <MotionDiv initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="text-3xl font-black text-[var(--afrigo-primary-green)] mt-2">{sellerAnalytics.winRate}%</MotionDiv>
                        <p className="text-xs text-green-600 mt-1">+8% vs last month</p>
                      </MotionDiv>
                      <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] p-4">
                        <p className="text-xs text-[var(--afrigo-text-secondary)]">This Month</p>
                        <MotionDiv initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="text-3xl font-black text-[var(--afrigo-primary-green)] mt-2">${(sellerAnalytics.revenueThisMonth / 1000).toFixed(0)}K</MotionDiv>
                        <p className="text-xs text-green-600 mt-1">+22% growth</p>
                      </MotionDiv>
                      <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-xl border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] p-4">
                        <p className="text-xs text-[var(--afrigo-text-secondary)]">Avg Response</p>
                        <MotionDiv initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="text-3xl font-black text-[var(--afrigo-primary-green)] mt-2">{sellerAnalytics.responseTime}h</MotionDiv>
                        <p className="text-xs text-green-600 mt-1">Industry avg: 4h</p>
                      </MotionDiv>
                    </div>
                  </div>
                </MotionDiv>
              </>
            )}
          </AnimatePresence>
        </>
      )}

      {/* EXPORTER ACTION MODALS */}
      {displayRole === 'Exporter' && (
        <>
          {/* FILE EXPORT DOCS MODAL */}
          <AnimatePresence>
            {activeActionId === 'file-export-docs' && (
              <>
                <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveActionId(null)} className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
                <MotionDiv initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div className="rounded-3xl border border-[var(--afrigo-border)] bg-[var(--afrigo-surface)] p-8 shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <p className="text-sm uppercase tracking-widest text-[var(--afrigo-secondary-gold)]">Document Management</p>
                        <h2 className="mt-3 text-2xl font-black text-[var(--afrigo-primary-green)]">Export Documents</h2>
                      </div>
                      <MotionButton whileTap={{ scale: 0.95 }} onClick={() => setActiveActionId(null)} className="text-[var(--afrigo-text-secondary)] hover:text-[var(--afrigo-text)]">✕</MotionButton>
                    </div>
                    {activeStep === 0 && (
                      <div className="space-y-4">
                        <div className="space-y-3 mb-6">
                          {exporterDocs.map((doc, idx) => (
                            <MotionDiv key={doc.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} className="rounded-xl border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="font-semibold text-[var(--afrigo-text)]">{doc.type}</p>
                                  <p className="text-xs text-[var(--afrigo-text-secondary)] mt-1">{doc.shipmentId}</p>
                                </div>
                                <MotionDiv className={`px-3 py-1 rounded-full text-xs font-semibold ${doc.status === 'Approved' ? 'bg-green-500/20 text-green-600' : doc.status === 'Submitted' ? 'bg-blue-500/20 text-blue-600' : 'bg-yellow-500/20 text-yellow-600'}`}>
                                  {doc.status}
                                </MotionDiv>
                              </div>
                            </MotionDiv>
                          ))}
                        </div>
                        <div className="rounded-xl border-2 border-dashed border-[var(--afrigo-border)] p-4">
                          <p className="text-[var(--afrigo-text-secondary)] mb-3 font-semibold">Upload New Document</p>
                          <select value={exporterDocForm.docType} onChange={(e) => setExporterDocForm({...exporterDocForm, docType: e.target.value})} className="w-full rounded-lg border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] px-4 py-3 text-sm text-[var(--afrigo-text)] focus:outline-none focus:border-[var(--afrigo-primary-green)] mb-3">
                            <option>Invoice</option>
                            <option>COO</option>
                            <option>Packing List</option>
                            <option>BoL</option>
                            <option>Customs</option>
                          </select>
                          <input type="text" placeholder="Shipment ID" value={exporterDocForm.shipmentId} onChange={(e) => setExporterDocForm({...exporterDocForm, shipmentId: e.target.value})} className="w-full rounded-lg border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] px-4 py-3 text-sm text-[var(--afrigo-text)] focus:outline-none focus:border-[var(--afrigo-primary-green)] mb-3" />
                          <label className="mb-3 block cursor-pointer rounded-lg border-2 border-dashed border-[var(--afrigo-border)] p-4 text-center transition hover:border-[var(--afrigo-primary-green)]">
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={event => setExporterDocForm({...exporterDocForm,file:event.target.files?.[0]||null})}/>
                            <span className="text-sm text-[var(--afrigo-text-secondary)]">{exporterDocForm.file ? exporterDocForm.file.name : 'Choose a PDF, JPG or PNG document'}</span>
                          </label>
                          <MotionButton whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={handleExporterUploadDoc} className="w-full rounded-lg bg-gradient-to-r from-[var(--afrigo-primary-green)] to-[var(--afrigo-secondary-gold)] py-3 text-sm font-semibold text-white hover:opacity-90">
                            Upload & Submit
                          </MotionButton>
                        </div>
                      </div>
                    )}
                    {activeStep === 1 && (
                      <div className="text-center py-8">
                        <MotionDiv initial={{ scale: 0 }} animate={{ scale: 1, rotate: 360 }} transition={{ type: 'spring', stiffness: 100 }} className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 flex items-center justify-center text-3xl">📄</MotionDiv>
                        <p className="font-semibold text-[var(--afrigo-text)] text-lg">Uploading Document...</p>
                        <MotionDiv initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 1.2 }} className="mt-4 h-1 rounded-full bg-gradient-to-r from-rose-500 to-rose-600" />
                      </div>
                    )}
                    {activeStep === 2 && (
                      <div className="text-center py-8">
                        <MotionDiv initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 100 }} className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-500 flex items-center justify-center text-3xl">✓</MotionDiv>
                        <p className="font-semibold text-[var(--afrigo-text)] text-lg">Document Submitted!</p>
                        <p className="mt-2 text-sm text-[var(--afrigo-text-secondary)]">Awaiting customs clearance</p>
                      </div>
                    )}
                  </div>
                </MotionDiv>
              </>
            )}
          </AnimatePresence>

          {/* SCHEDULE PICKUP MODAL */}
          <AnimatePresence>
            {activeActionId === 'schedule-pickup' && (
              <>
                <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveActionId(null)} className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
                <MotionDiv initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div className="rounded-3xl border border-[var(--afrigo-border)] bg-[var(--afrigo-surface)] p-8 shadow-2xl max-w-2xl w-full">
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <p className="text-sm uppercase tracking-widest text-[var(--afrigo-secondary-gold)]">Logistics Coordination</p>
                        <h2 className="mt-3 text-2xl font-black text-[var(--afrigo-primary-green)]">Schedule Pickup</h2>
                      </div>
                      <MotionButton whileTap={{ scale: 0.95 }} onClick={() => setActiveActionId(null)} className="text-[var(--afrigo-text-secondary)] hover:text-[var(--afrigo-text)]">✕</MotionButton>
                    </div>
                    {activeStep === 0 && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-[var(--afrigo-text)] mb-2">Warehouse Location</label>
                          <input type="text" placeholder="e.g., Kampala Central Hub" value={exporterPickupForm.warehouse} onChange={(e) => setExporterPickupForm({...exporterPickupForm, warehouse: e.target.value})} className="w-full rounded-lg border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] px-4 py-3 text-[var(--afrigo-text)] focus:outline-none focus:border-[var(--afrigo-primary-green)] focus:ring-2 focus:ring-[var(--afrigo-primary-green)]/20" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-semibold text-[var(--afrigo-text)] mb-2">Containers</label>
                            <input type="number" placeholder="1" value={exporterPickupForm.containers} onChange={(e) => setExporterPickupForm({...exporterPickupForm, containers: e.target.value})} className="w-full rounded-lg border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] px-4 py-3 text-[var(--afrigo-text)] focus:outline-none focus:border-[var(--afrigo-primary-green)] focus:ring-2 focus:ring-[var(--afrigo-primary-green)]/20" />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-[var(--afrigo-text)] mb-2">Est. Weight</label>
                            <input type="text" placeholder="e.g., 5,000 kg" value={exporterPickupForm.weight} onChange={(e) => setExporterPickupForm({...exporterPickupForm, weight: e.target.value})} className="w-full rounded-lg border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] px-4 py-3 text-[var(--afrigo-text)] focus:outline-none focus:border-[var(--afrigo-primary-green)] focus:ring-2 focus:ring-[var(--afrigo-primary-green)]/20" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-[var(--afrigo-text)] mb-2">Preferred Date</label>
                          <input type="date" value={exporterPickupForm.date} onChange={(e) => setExporterPickupForm({...exporterPickupForm, date: e.target.value})} className="w-full rounded-lg border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] px-4 py-3 text-[var(--afrigo-text)] focus:outline-none focus:border-[var(--afrigo-primary-green)] focus:ring-2 focus:ring-[var(--afrigo-primary-green)]/20" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-[var(--afrigo-text)] mb-2">Preferred Carrier</label>
                          <input type="text" placeholder="e.g., DHL Global, FedEx, etc." value={exporterPickupForm.carrier} onChange={(e) => setExporterPickupForm({...exporterPickupForm, carrier: e.target.value})} className="w-full rounded-lg border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] px-4 py-3 text-[var(--afrigo-text)] focus:outline-none focus:border-[var(--afrigo-primary-green)] focus:ring-2 focus:ring-[var(--afrigo-primary-green)]/20" />
                        </div>
                        <div className="flex gap-3">
                          <MotionButton whileTap={{ scale: 0.95 }} onClick={() => setActiveActionId(null)} className="flex-1 rounded-lg border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] py-3 font-semibold text-[var(--afrigo-text)] hover:border-[var(--afrigo-primary-green)] hover:text-[var(--afrigo-primary-green)]">Cancel</MotionButton>
                          <MotionButton whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={handleExporterSchedulePickup} className="flex-1 rounded-lg bg-gradient-to-r from-[var(--afrigo-primary-green)] to-[var(--afrigo-secondary-gold)] py-3 font-semibold text-white hover:opacity-90">Schedule</MotionButton>
                        </div>
                      </div>
                    )}
                    {activeStep === 1 && (
                      <div className="text-center py-8">
                        <MotionDiv initial={{ scale: 0 }} animate={{ scale: 1, rotate: 360 }} transition={{ type: 'spring', stiffness: 100 }} className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 flex items-center justify-center text-3xl">🛳️</MotionDiv>
                        <p className="font-semibold text-[var(--afrigo-text)] text-lg">Booking Pickup...</p>
                        <MotionDiv initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 1.2 }} className="mt-4 h-1 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600" />
                      </div>
                    )}
                    {activeStep === 2 && (
                      <div className="text-center py-8">
                        <MotionDiv initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 100 }} className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-500 flex items-center justify-center text-3xl">✓</MotionDiv>
                        <p className="font-semibold text-[var(--afrigo-text)] text-lg">Pickup Scheduled!</p>
                        <p className="mt-2 text-sm text-[var(--afrigo-text-secondary)]">Confirmation sent to {exporterPickupForm.carrier || 'logistics partner'}</p>
                      </div>
                    )}
                  </div>
                </MotionDiv>
              </>
            )}
          </AnimatePresence>

          {/* MONITOR COMPLIANCE MODAL */}
          <AnimatePresence>
            {activeActionId === 'monitor-compliance' && (
              <>
                <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveActionId(null)} className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
                <MotionDiv initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div className="rounded-3xl border border-[var(--afrigo-border)] bg-[var(--afrigo-surface)] p-8 shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <p className="text-sm uppercase tracking-widest text-[var(--afrigo-secondary-gold)]">Regulatory Status</p>
                        <h2 className="mt-3 text-2xl font-black text-[var(--afrigo-primary-green)]">Compliance Checklist</h2>
                      </div>
                      <MotionButton whileTap={{ scale: 0.95 }} onClick={() => setActiveActionId(null)} className="text-[var(--afrigo-text-secondary)] hover:text-[var(--afrigo-text)]">✕</MotionButton>
                    </div>
                    <div className="space-y-3">
                      {exporterCompliance.map((item, idx) => (
                        <MotionDiv key={item.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} className="rounded-xl border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-xs text-[var(--afrigo-text-secondary)] font-semibold uppercase">{item.category}</p>
                              <p className="font-semibold text-[var(--afrigo-text)] mt-1">{item.requirement}</p>
                              <p className="text-xs text-[var(--afrigo-text-secondary)] mt-1">Due: {item.dueDate}</p>
                            </div>
                            <MotionDiv className={`px-3 py-1 rounded-full text-xs font-semibold ${item.status === 'Verified' ? 'bg-green-500/20 text-green-600' : item.status === 'Completed' ? 'bg-blue-500/20 text-blue-600' : 'bg-yellow-500/20 text-yellow-600'}`}>
                              {item.status}
                            </MotionDiv>
                          </div>
                        </MotionDiv>
                      ))}
                    </div>
                    <div className="mt-6 p-4 rounded-xl border border-green-500/20 bg-green-500/5">
                      <p className="text-sm text-green-600 font-semibold">✓ 67% Compliant</p>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--afrigo-border)] mt-2">
                        <MotionDiv initial={{ width: 0 }} animate={{ width: '67%' }} transition={{ duration: 1 }} className="h-full bg-gradient-to-r from-green-500 to-green-600" />
                      </div>
                    </div>
                  </div>
                </MotionDiv>
              </>
            )}
          </AnimatePresence>
        </>
      )}

      {!isDemo && <TradeOperations role={displayRole} />}

      {/* ACTIVITY FEED */}
      <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="rounded-3xl border border-[var(--afrigo-border)] bg-[var(--afrigo-surface)] p-8 shadow-xl">
        <h2 className="text-2xl font-black text-[var(--afrigo-primary-green)] mb-6">Recent Activity</h2>
        <div className="space-y-3">
          {updates.length === 0 ? (
            <div className="rounded-xl border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] p-6 text-center text-[var(--afrigo-text-secondary)]">
              Waiting for activity...
            </div>
          ) : (
            updates.map((update, i) => (
              <MotionDiv key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center justify-between rounded-xl bg-[var(--afrigo-bg)] p-4 hover:shadow-md transition border border-[var(--afrigo-border)]/50 hover:border-[var(--afrigo-primary-green)]">
                <p className="text-sm text-[var(--afrigo-text)]">{update.message}</p>
                <span className="text-xs text-[var(--afrigo-text-secondary)]">{new Date(update.ts).toLocaleTimeString()}</span>
              </MotionDiv>
            ))
          )}
        </div>
      </MotionDiv>
    </MotionDiv>
  )
}
