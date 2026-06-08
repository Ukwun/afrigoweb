'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const MotionDiv = motion.div as any
const MotionButton = motion.button as any

const screens = [
  {
    title: 'Welcome to Afrigo',
    description: 'The modern platform built for export traders who demand speed, clarity, and real-time control.',
    detail: 'Whether you are sourcing products, managing shipments, or running an export operation, Afrigo provides the workspace tailored to your role.',
    icon: '🌍'
  },
  {
    title: 'Know Where You Are',
    description: 'Clarity at every step. You always know your position, what to do next, and what happens after you click.',
    detail: 'From onboarding through role selection to your tailored dashboard - each screen reveals only what matters, so complexity stays hidden and work feels focused.',
    icon: '🗺️'
  },
  {
    title: 'Your Workflow, Your Role',
    description: 'Buyers source products. Sellers pitch offerings. Exporters move goods. Each role gets its own dashboard, metrics, and action plan.',
    detail: 'Log in, choose your role, and unlock the exact workspace designed for your trade function. KPIs, tasks, activity feeds - all tailored for real work.',
    icon: '⚡'
  },
  {
    title: 'Built for Trade',
    description: 'Live actions, real-time feedback, and professional workflows for buyers, sellers, and exporters.',
    detail: 'Start now with secure sign-up, or preview a role to explore the workspace before committing.',
    icon: '🚀'
  }
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.3 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

interface OnboardingFlowProps {
  onComplete?: () => void
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const screen = screens[currentStep]
  const isFirst = currentStep === 0
  const isLast = currentStep === screens.length - 1
  const progress = ((currentStep + 1) / screens.length) * 100

  const handleNext = () => {
    if (isLast) {
      onComplete?.()
    } else {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <MotionDiv
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-[var(--afrigo-bg)] px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--afrigo-secondary-gold)]">
              Step {currentStep + 1} of {screens.length}
            </p>
            <p className="text-xs font-semibold text-[var(--afrigo-text-secondary)]">
              {Math.round(progress)}%
            </p>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--afrigo-border)]">
            <MotionDiv
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              className="h-full bg-gradient-to-r from-[var(--afrigo-primary-green)] to-[var(--afrigo-secondary-gold)]"
            />
          </div>
        </div>

        {/* Main Content */}
        <MotionDiv
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl border border-[var(--afrigo-border)] bg-[var(--afrigo-surface)] p-8 shadow-xl sm:p-12"
        >
          {/* Icon */}
          <MotionDiv
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-8 text-6xl"
          >
            {screen.icon}
          </MotionDiv>

          {/* Content */}
          <div className="mb-10 space-y-6">
            <MotionDiv
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <h2 className="text-4xl font-black text-[var(--afrigo-primary-green)]">
                {screen.title}
              </h2>
            </MotionDiv>

            <MotionDiv
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <p className="text-xl leading-relaxed text-[var(--afrigo-text-secondary)]">
                {screen.description}
              </p>
            </MotionDiv>

            <MotionDiv
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="rounded-2xl border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] p-6"
            >
              <p className="text-sm leading-relaxed text-[var(--afrigo-text)]">
                {screen.detail}
              </p>
            </MotionDiv>
          </div>

          {/* Dots Navigation */}
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mb-8 flex items-center justify-center gap-3"
          >
            {screens.map((_, index) => (
              <MotionButton
                key={index}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setCurrentStep(index)}
                className={`h-3 w-3 rounded-full transition-colors duration-300 ${
                  index === currentStep
                    ? 'bg-[var(--afrigo-primary-green)]'
                    : 'bg-[var(--afrigo-border)] hover:bg-[var(--afrigo-text-secondary)]'
                }`}
              />
            ))}
          </MotionDiv>

          {/* Action Buttons */}
          <MotionDiv
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              {!isFirst && (
                <MotionButton
                  whileHover={{ x: -4 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePrev}
                  className="rounded-full border border-[var(--afrigo-border)] bg-[var(--afrigo-bg)] px-6 py-3 font-semibold text-[var(--afrigo-text)] transition hover:border-[var(--afrigo-primary-green)] hover:text-[var(--afrigo-primary-green)]"
                >
                  Back
                </MotionButton>
              )}
            </div>

            <MotionButton
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNext}
              className="rounded-full bg-gradient-to-r from-[var(--afrigo-primary-green)] to-[var(--afrigo-primary-green-hover)] px-8 py-3 font-semibold text-white shadow-lg transition hover:shadow-xl"
            >
              {isLast ? 'Get Started' : 'Next'}
            </MotionButton>
          </MotionDiv>
        </MotionDiv>

        {/* Skip Option */}
        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="mt-8 text-center"
        >
          <Link href="/sign-in" className="text-sm font-semibold text-[var(--afrigo-text-secondary)] hover:text-[var(--afrigo-primary-green)] transition">
            Skip to sign in
          </Link>
        </MotionDiv>
      </div>
    </MotionDiv>
  )
}
