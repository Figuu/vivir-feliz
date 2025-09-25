'use client'

import { motion, AnimatePresence, Variants } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

interface PageTransitionProps {
  children: ReactNode
  className?: string
}

// Enhanced page variants with better easing and subtle transform
const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 8,
    scale: 0.98,
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  out: {
    opacity: 0,
    y: -8,
    scale: 0.98,
  },
}

const pageTransition = {
  type: 'tween' as const,
  ease: [0.25, 0.46, 0.45, 0.94] as const, // Custom cubic bezier for smooth feel
  duration: 0.25,
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname()

  return (
    <motion.div
      key={pathname}
      initial="initial"
      animate="in"
      variants={pageVariants}
      transition={pageTransition}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Enhanced slide transition variant
const slideVariants: Variants = {
  initial: (direction: number) => ({
    x: direction > 0 ? 20 : -20,
    opacity: 0,
    scale: 0.98,
  }),
  in: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  out: (direction: number) => ({
    x: direction < 0 ? 20 : -20,
    opacity: 0,
    scale: 0.98,
  }),
}

const slideTransition = {
  type: 'tween' as const,
  ease: [0.25, 0.46, 0.45, 0.94] as const,
  duration: 0.3,
}

export function SlideTransition({ 
  children, 
  className, 
  direction = 0 
}: PageTransitionProps & { direction?: number }) {
  const pathname = usePathname()

  return (
    <motion.div
      key={pathname}
      custom={direction}
      initial="initial"
      animate="in"
      variants={slideVariants}
      transition={slideTransition}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Enhanced fade transition variant
const fadeVariants: Variants = {
  initial: {
    opacity: 0,
  },
  in: {
    opacity: 1,
  },
  out: {
    opacity: 0,
  },
}

const fadeTransition = {
  type: 'tween' as const,
  ease: [0.25, 0.46, 0.45, 0.94] as const,
  duration: 0.15,
}

export function FadeTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname()

  return (
    <motion.div
      key={pathname}
      initial="initial"
      animate="in"
      variants={fadeVariants}
      transition={fadeTransition}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Simple content transition - No exit animation to avoid double fade
const contentVariants: Variants = {
  initial: {
    opacity: 0,
    y: 4,
  },
  in: {
    opacity: 1,
    y: 0,
  },
}

const contentTransition = {
  type: 'tween' as const,
  ease: [0.25, 0.46, 0.45, 0.94] as const,
  duration: 0.2,
}

export function ScaleTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname()

  return (
    <motion.div
      key={pathname}
      initial="initial"
      animate="in"
      variants={contentVariants}
      transition={contentTransition}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Simple wrapper for auth pages - animation handled at page level
export function AuthTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// Lightweight form content transition
const formVariants: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.25,
      ease: [0.4, 0.0, 0.2, 1],
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.15,
      ease: [0.4, 0.0, 1, 1],
    },
  },
}

export function FormContentTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={formVariants}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Enhanced success transition with celebration feel
const celebrationVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9,
    y: 20,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1],
      scale: {
        duration: 0.6,
        ease: [0.34, 1.56, 0.64, 1], // Bouncy scale for celebration
      },
    },
  },
}

export function CelebrationTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={celebrationVariants}
      className={className}
    >
      {children}
    </motion.div>
  )
}