'use client'

import { motion, Variants } from 'framer-motion'
import { ReactNode } from 'react'

interface FormTransitionProps {
  children: ReactNode
  className?: string
  delay?: number
}

const containerVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'tween' as const,
      ease: 'easeOut' as const,
      duration: 0.3,
    },
  },
}

export function FormTransition({ children, className, delay = 0 }: FormTransitionProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={className}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </motion.div>
  )
}

export function FormItem({ children, className }: FormTransitionProps) {
  return (
    <motion.div
      variants={itemVariants}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Premium success animation with celebration feel
const premiumSuccessVariants: Variants = {
  hidden: {
    scale: 0.9,
    opacity: 0,
    y: 20,
    filter: 'blur(4px)',
  },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      scale: {
        duration: 0.6,
        ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number], // Bouncy celebration effect
      },
      filter: {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      },
    },
  },
}

export function SuccessTransition({ children, className }: FormTransitionProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={premiumSuccessVariants}
      className={className}
      style={{ willChange: 'transform, opacity, filter' }}
    >
      {children}
    </motion.div>
  )
}

// Loading animation
const loadingVariants = {
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  },
}

export function LoadingTransition({ children, className }: FormTransitionProps) {
  return (
    <motion.div
      variants={loadingVariants}
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  )
}