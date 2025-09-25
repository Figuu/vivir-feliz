'use client'

import { LoginForm } from '@/components/auth/login-form'
import { motion } from 'framer-motion'

export default function LoginPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <LoginForm />
    </motion.div>
  )
}