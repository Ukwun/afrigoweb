'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from '@/lib/auth'
import { normalizeRole } from '@/lib/roles'
import { getSupabaseClient } from '@/lib/supabaseClient'

const stepLabels = ['Company Setup', 'KYC Documents', 'Review & Submit']

export default function OnboardingPage() {
  const router = useRouter()
  const { user, isSignedIn } = useAuth()
  const [step, setStep] = useState(0)
  const [hoverHint, setHoverHint] = useState('Complete each step to activate your Afrigo export profile.')
  const [companyName, setCompanyName] = useState('Afrigo Export Ltd')
  const [country, setCountry] = useState('Nigeria')
  const [kycFiles, setKycFiles] = useState<File[]>([])
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [notice, setNotice] = useState('')

  const selectedRole = isSignedIn ? normalizeRole(user?.role) : null

  if (!isSignedIn) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <h2 className="text-3xl font-semibold mb-4 text-[var(--afrigo-primary-green)]">Sign in to continue onboarding</h2>
        <p className="text-[var(--afrigo-text-secondary)] mb-6">Afrigo uses simple local authentication. Sign in and continue building your trade operating profile.</p>
        <Link href="/sign-in" className="rounded-2xl bg-[var(--afrigo-primary-green)] px-6 py-3 text-white">Sign in</Link>
      </div>
    )
  }

  if (!selectedRole) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <h2 className="text-3xl font-semibold mb-4 text-[var(--afrigo-primary-green)]">Choose your role first</h2>
        <p className="text-[var(--afrigo-text-secondary)] mb-6">You must select Buyer, Seller, or Exporter before onboarding can continue. This ensures the system applies the right trade workflow to your profile.</p>
        <Link href="/role-selection" className="rounded-2xl bg-[var(--afrigo-primary-green)] px-6 py-3 text-base font-semibold text-white transition duration-200 hover:bg-[var(--afrigo-primary-green-hover)]">Select role</Link>
      </div>
    )
  }

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return
    setKycFiles((prev) => [...prev, ...Array.from(files)])
  }

  const removeFile = (index: number) => {
    setKycFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleNext = async () => {
    if (step === stepLabels.length - 1) {
      setStatus('saving')
      setNotice('Creating your onboarding profile...')

      try {
        const { data: sessionData } = await getSupabaseClient()!.auth.getSession()
        if (!sessionData.session) throw new Error('Your session expired. Please sign in again.')
        const payload = new FormData()
        payload.set('companyName', companyName)
        payload.set('country', country)
        kycFiles.forEach(file => payload.append('documents', file))
        const response = await fetch('/api/onboarding/complete', {
          method: 'POST',
          headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
          body: payload
        })

        const json = await response.json()
        if (!response.ok || !json.ok) {
          throw new Error(json.error || 'Failed to complete onboarding')
        }

        setStatus('success')
        setNotice('Your company profile and KYC documents were submitted successfully.')
        setTimeout(() => router.push('/dashboard'), 1200)
      } catch (error: any) {
        console.error(error)
        setStatus('error')
        setNotice(error.message || 'Something went wrong. Please try again.')
      }

      return
    }

    setStep((prev) => prev + 1)
  }

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 0))
    setNotice('')
  }

  return (
    <div className="max-w-4xl mx-auto py-12">
      <div className="mb-8 transition duration-400 ease-out">
        <p className="text-sm uppercase tracking-[0.24em] text-[var(--afrigo-secondary-gold)]">Afrigo onboarding</p>
        <h1 className="text-4xl font-bold mt-3 text-[var(--afrigo-primary-green)]">Create your trade operating profile.</h1>
        <p className="mt-3 text-[var(--afrigo-text-secondary)] max-w-2xl">Finish your {selectedRole?.toLowerCase()} onboarding with company information, KYC, and compliance-ready documentation. This is the first real step toward a working Afrigo trade workflow.</p>
      </div>

      <div className="rounded-3xl border border-[var(--afrigo-border)] bg-[var(--afrigo-surface)] p-6 shadow-sm">
        <div className="grid grid-cols-3 gap-4 mb-8">
          {stepLabels.map((label, index) => (
            <div key={label} className={`rounded-2xl p-4 transition duration-200 ${index === step ? 'bg-[var(--afrigo-primary-green)] text-white shadow-lg' : 'bg-[var(--afrigo-bg)] text-[var(--afrigo-text-secondary)] hover:-translate-y-0.5'}`}>
              <div className="text-sm font-semibold">Step {index + 1}</div>
              <div className="mt-2 text-sm">{label}</div>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <div key={step} className="space-y-6 transition-all duration-300 ease-out">
            {step === 0 && (
              <div className="space-y-6">
                <div className="rounded-3xl border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] p-6 transition duration-200 hover:-translate-y-0.5">
                  <h2 className="text-xl font-semibold mb-3 text-[var(--afrigo-text)]">Company details</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2" onMouseEnter={() => setHoverHint('Enter your legal company name for supplier registration.')} onMouseLeave={() => setHoverHint('Complete each step to activate your Afrigo export profile.') }>
                      <span className="text-sm font-medium text-[var(--afrigo-text-dark)]">Company name</span>
                      <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} className="w-full rounded-2xl border border-[var(--afrigo-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--afrigo-primary-green)]" placeholder="Enter your company name" />
                    </label>
                    <label className="space-y-2" onMouseEnter={() => setHoverHint('Select the main market where your exports will operate.') } onMouseLeave={() => setHoverHint('Complete each step to activate your Afrigo export profile.') }>
                      <span className="text-sm font-medium text-[var(--afrigo-text-dark)]">Country of operation</span>
                      <select value={country} onChange={(event) => setCountry(event.target.value)} className="w-full rounded-2xl border border-[var(--afrigo-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--afrigo-primary-green)]">
                        <option value="Nigeria">Nigeria</option>
                        <option value="Ghana">Ghana</option>
                        <option value="Kenya">Kenya</option>
                        <option value="South Africa">South Africa</option>
                        <option value="Egypt">Egypt</option>
                      </select>
                    </label>
                  </div>
                  <div className="mt-4 text-[var(--afrigo-text-secondary)]">This information becomes the company profile for your live Afrigo workflow.</div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <div className="rounded-3xl border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] p-6">
                  <h2 className="text-xl font-semibold mb-3 text-[var(--afrigo-text)]">Upload KYC documents</h2>
                  <p className="text-[var(--afrigo-text-secondary)] mb-4">Attach your company registration, owner IDs, and compliance paperwork. This flow is built for real fintech onboarding and audit trails.</p>
                  <label className="rounded-3xl border border-dashed border-[var(--afrigo-primary-green)] bg-white px-5 py-8 text-center transition duration-200 hover:border-[var(--afrigo-primary-green-hover)] hover:-translate-y-0.5" onMouseEnter={() => setHoverHint('Upload your company registration and compliance documents here.')} onMouseLeave={() => setHoverHint('Complete each step to activate your Afrigo export profile.') }>
                    <input type="file" accept=".pdf,.jpg,.png" multiple onChange={onFileChange} className="hidden" />
                    <div className="space-y-3">
                      <div className="mx-auto h-12 w-12 rounded-full bg-[var(--afrigo-primary-green-light)] text-[var(--afrigo-primary-green)] flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor"><path d="M12 5v14m7-7H5"></path></svg>
                      </div>
                      <div className="text-sm font-medium">Click to upload files</div>
                      <div className="text-xs text-[var(--afrigo-text-secondary)]">PDF, JPG, PNG • max 20MB each</div>
                    </div>
                  </label>
                  {kycFiles.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {kycFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between rounded-2xl bg-white p-4 text-sm shadow-sm transition duration-200 hover:translate-x-0.5">
                          <div>
                            <div className="font-medium text-[var(--afrigo-text)]">{file.name}</div>
                            <div className="text-[var(--afrigo-text-secondary)]">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                          </div>
                          <button type="button" onClick={() => removeFile(index)} className="text-[var(--afrigo-primary-green)] transition duration-200 hover:text-[var(--afrigo-primary-green-hover)]">Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="rounded-3xl border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] p-6">
                  <h2 className="text-xl font-semibold mb-3 text-[var(--afrigo-text)]">Review your onboarding</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-3xl bg-white p-5 shadow-sm">
                      <h3 className="font-semibold mb-2 text-[var(--afrigo-text)]">Company</h3>
                      <div className="text-[var(--afrigo-text)]">{companyName}</div>
                      <div className="text-[var(--afrigo-text-secondary)] mt-1">{country}</div>
                    </div>
                    <div className="rounded-3xl bg-white p-5 shadow-sm">
                      <h3 className="font-semibold mb-2 text-[var(--afrigo-text)]">KYC files</h3>
                      {kycFiles.length === 0 ? (
                        <div className="text-[var(--afrigo-text-secondary)]">No files added yet.</div>
                      ) : (
                        <ul className="space-y-2 text-[var(--afrigo-text)]">
                          {kycFiles.map((file, index) => (
                            <li key={index}>{file.name}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </AnimatePresence>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={handleBack} disabled={step === 0 || status === 'saving'} className="rounded-2xl border border-[var(--afrigo-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--afrigo-text)] transition duration-200 hover:border-[var(--afrigo-primary-green)] disabled:cursor-not-allowed disabled:opacity-50 hover:-translate-y-0.5">Back</button>
          <div className="flex items-center gap-3">
            <div className="text-sm text-[var(--afrigo-text-secondary)]">{stepLabels[step]}</div>
            <button type="button" onClick={handleNext} disabled={status === 'saving' || (step === 1 && kycFiles.length === 0)} className="rounded-2xl bg-[var(--afrigo-primary-green)] px-6 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-[var(--afrigo-primary-green-hover)] disabled:cursor-not-allowed disabled:bg-[var(--afrigo-disabled)] hover:-translate-y-0.5">{status === 'saving' ? 'Saving...' : step === stepLabels.length - 1 ? 'Submit onboarding' : 'Continue'}</button>
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] p-4 text-sm text-[var(--afrigo-text-secondary)] shadow-sm transition duration-300">
          <span className="font-semibold text-[var(--afrigo-primary-green)]">Hint:</span> {hoverHint}
        </div>
        {notice && (
          <div className={`mt-4 rounded-2xl p-4 text-sm ${status === 'error' ? 'bg-[var(--afrigo-error-light)] text-[var(--afrigo-error)]' : 'bg-[var(--afrigo-success-light)] text-[var(--afrigo-success)]'}`}>{notice}</div>
        )}
      </div>
    </div>
  )
}
