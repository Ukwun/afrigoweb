'use client'

import { useState, useEffect } from 'react'
import LogoIntro from '@/components/LogoIntro'
import OnboardingFlow from '@/components/OnboardingFlow'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'

export default function Home() {
  const [showIntro, setShowIntro] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const router = useRouter()
  const { isSignedIn } = useAuth()

  // Skip intro/onboarding if already signed in
  useEffect(() => {
    if (isSignedIn) {
      router.push('/dashboard')
    }
  }, [isSignedIn, router])

  const handleIntroComplete = () => {
    setShowIntro(false)
    setShowOnboarding(true)
  }

  const handleOnboardingComplete = () => {
    router.push('/sign-in')
  }

  if (showIntro) {
    return <LogoIntro onComplete={handleIntroComplete} />
  }

  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />
  }

  return null
}
