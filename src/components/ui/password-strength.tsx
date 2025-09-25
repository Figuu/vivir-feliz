'use client'

import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface PasswordStrengthProps {
  password: string
}

interface PasswordCriteria {
  label: string
  test: (password: string) => boolean
}

const passwordCriteria: PasswordCriteria[] = [
  {
    label: 'At least 8 characters',
    test: (password) => password.length >= 8,
  },
  {
    label: 'Contains uppercase letter',
    test: (password) => /[A-Z]/.test(password),
  },
  {
    label: 'Contains lowercase letter',
    test: (password) => /[a-z]/.test(password),
  },
  {
    label: 'Contains number',
    test: (password) => /\d/.test(password),
  },
  {
    label: 'Contains special character',
    test: (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
  },
]

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const [strength, setStrength] = useState(0)

  useEffect(() => {
    const passedCriteria = passwordCriteria.filter((criteria) =>
      criteria.test(password)
    ).length

    setStrength(passedCriteria)
  }, [password])

  const getStrengthColor = () => {
    if (strength === 0) return 'bg-gray-200'
    if (strength <= 2) return 'bg-red-500'
    if (strength <= 3) return 'bg-orange-500'
    if (strength <= 4) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStrengthText = () => {
    if (strength === 0) return ''
    if (strength <= 2) return 'Weak'
    if (strength <= 3) return 'Fair'
    if (strength <= 4) return 'Good'
    return 'Strong'
  }

  return (
    <motion.div 
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ 
        duration: 0.2, 
        ease: [0.25, 0.46, 0.45, 0.94] 
      }}
      className="mt-2 space-y-2"
    >
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Password strength</span>
          <span className={cn(
            'font-medium',
            strength === 0 && 'text-gray-500',
            strength <= 2 && strength > 0 && 'text-red-500',
            strength === 3 && 'text-orange-500',
            strength === 4 && 'text-yellow-500',
            strength === 5 && 'text-green-500'
          )}>
            {getStrengthText()}
          </span>
        </div>
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-300',
              getStrengthColor()
            )}
            style={{ width: `${(strength / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Criteria List */}
      <div className="space-y-1">
        {passwordCriteria.map((criteria, index) => {
          const isPassed = criteria.test(password)
          return (
            <div
              key={index}
              className={cn(
                'flex items-center gap-2 text-xs transition-colors',
                isPassed ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
              )}
            >
              {isPassed ? (
                <Check className="h-3 w-3" />
              ) : (
                <X className="h-3 w-3" />
              )}
              <span>{criteria.label}</span>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}