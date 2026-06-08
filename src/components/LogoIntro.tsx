'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const MotionDiv = motion.div as any
const MotionPath = motion.path as any

interface LogoIntroProps {
  onComplete: () => void
}

export default function LogoIntro({ onComplete }: LogoIntroProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onComplete()
    }, 3500)
    return () => clearTimeout(timer)
  }, [onComplete])

  if (!isVisible) return null

  return (
    <MotionDiv
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ delay: 3.2, duration: 0.8 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--afrigo-bg)]"
    >
      <MotionDiv className="flex flex-col items-center justify-center gap-8">
        {/* Main Logo Container */}
        <MotionDiv
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="relative"
        >
          {/* Outer glow circles */}
          <MotionDiv
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.1, 0.3]
            }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-[var(--afrigo-primary-green)] blur-2xl"
          />

          {/* Core Logo */}
          <MotionDiv
            className="relative h-32 w-32 rounded-3xl bg-gradient-to-br from-[var(--afrigo-primary-green)] to-[var(--afrigo-primary-green-hover)] shadow-2xl flex items-center justify-center"
            initial={{ rotate: -180, y: 30 }}
            animate={{ rotate: 0, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            {/* Letter A */}
            <MotionDiv
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="text-6xl font-black text-white"
            >
              A
            </MotionDiv>
          </MotionDiv>

          {/* Rotating accent ring */}
          <MotionDiv
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-3xl border-2 border-transparent border-t-[var(--afrigo-secondary-gold)] border-r-[var(--afrigo-secondary-gold)]"
          />
        </MotionDiv>

        {/* Animated text */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="text-center"
        >
          <h1 className="text-4xl font-black text-[var(--afrigo-primary-green)]">
            AFRIGO
          </h1>
          <p className="mt-2 text-sm tracking-widest text-[var(--afrigo-secondary-gold)] uppercase">
            Export Trade Platform
          </p>
        </MotionDiv>

        {/* Bottom accent line */}
        <MotionDiv
          initial={{ width: 0 }}
          animate={{ width: '80px' }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="h-1 bg-gradient-to-r from-transparent via-[var(--afrigo-secondary-gold)] to-transparent"
        />

        {/* Loading indicator */}
        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2 }}
          className="flex gap-2"
        >
          {[0, 1, 2].map((i) => (
            <MotionDiv
              key={i}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ delay: i * 0.2, duration: 1.4, repeat: Infinity }}
              className="h-2 w-2 rounded-full bg-[var(--afrigo-secondary-gold)]"
            />
          ))}
        </MotionDiv>
      </MotionDiv>
    </MotionDiv>
  )
}
