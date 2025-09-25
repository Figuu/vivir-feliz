'use client'

import { SignupForm } from '@/components/auth/signup-form'
import { motion } from 'framer-motion'

export default function SignupPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <SignupForm />
    </motion.div>
  )
}