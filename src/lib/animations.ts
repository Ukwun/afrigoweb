/**
 * Enhanced Micro Animations
 * Provides sophisticated animation effects for modern UI interactions
 */

import { motion } from 'framer-motion'

export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
      duration: 0.5
    }
  }
}

export const slideInFromLeft = {
  hidden: { opacity: 0, x: -40 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: 'easeOut' }
  }
}

export const slideInFromRight = {
  hidden: { opacity: 0, x: 40 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: 'easeOut' }
  }
}

export const slideInFromTop = {
  hidden: { opacity: 0, y: -30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' }
  }
}

export const slideInFromBottom = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' }
  }
}

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: 'easeOut' }
  }
}

export const fadeIn = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.5 }
  }
}

export const pulseAnimation = {
  initial: { scale: 1, opacity: 1 },
  pulse: {
    scale: 1.05,
    opacity: 0.8,
    transition: { duration: 0.5, repeat: Infinity, repeatType: 'reverse' as const }
  }
}

export const shimmerAnimation = {
  initial: { backgroundPosition: '-1000px 0' },
  shimmer: {
    backgroundPosition: '1000px 0',
    transition: { duration: 2, repeat: Infinity }
  }
}

export const floatAnimation = {
  initial: { y: 0 },
  float: {
    y: [-10, 10],
    transition: { duration: 3, repeat: Infinity, repeatType: 'reverse' as const, ease: 'easeInOut' }
  }
}

export const bounceAnimation = {
  initial: { y: 0 },
  bounce: {
    y: [-8, 0],
    transition: { duration: 0.6, repeat: 3, repeatType: 'mirror' as const }
  }
}

export const hoverScale = {
  whileHover: { scale: 1.05, transition: { duration: 0.2 } },
  whileTap: { scale: 0.98, transition: { duration: 0.1 } }
}

export const hoverLift = {
  whileHover: { y: -8, shadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' },
  whileTap: { y: -4 }
}

export const buttonHover = {
  whileHover: {
    scale: 1.02,
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
  },
  whileTap: {
    scale: 0.98
  },
  transition: { duration: 0.2 }
}

export const cardHover = {
  whileHover: {
    y: -4,
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
  },
  transition: { duration: 0.3 }
}

export const rotateIn = {
  hidden: { opacity: 0, rotate: -10 },
  show: {
    opacity: 1,
    rotate: 0,
    transition: { duration: 0.5, ease: 'easeOut' }
  }
}

export const expandWidth = {
  hidden: { width: 0, opacity: 0 },
  show: {
    width: 'auto',
    opacity: 1,
    transition: { duration: 0.4, ease: 'easeOut' }
  }
}

export const checkmark = {
  hidden: { pathLength: 0, opacity: 0 },
  show: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.5, ease: 'easeInOut' }
  }
}

export const progressBarAnimation = {
  initial: { scaleX: 0, transformOrigin: 'left' },
  animate: (progress: number) => ({
    scaleX: progress / 100,
    transformOrigin: 'left',
    transition: { duration: 0.8, ease: 'easeOut' }
  })
}

/**
 * Page transition animations for route changes
 */
export const pageTransition = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.4 }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.3 }
  }
}

/**
 * Modal/Overlay animations
 */
export const modalBackdrop = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.2 }
  }
}

export const modalContent = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' }
  }
}

/**
 * Notification animations
 */
export const notificationSlide = {
  hidden: { x: 400, opacity: 0 },
  show: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.4, ease: 'easeOut' }
  },
  exit: {
    x: 400,
    opacity: 0,
    transition: { duration: 0.3 }
  }
}

/**
 * Success/error animations
 */
export const successBounce = {
  hidden: { scale: 0, rotate: -180 },
  show: {
    scale: 1,
    rotate: 0,
    transition: { duration: 0.6, ease: 'easeOut', type: 'spring', stiffness: 200, damping: 15 }
  }
}

export const shake = {
  hidden: { x: 0 },
  shake: {
    x: [-10, 10, -10, 10, 0],
    transition: { duration: 0.4 }
  }
}
