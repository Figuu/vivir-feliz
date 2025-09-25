export interface AuthError {
  type: 'error' | 'warning' | 'info'
  title: string
  message: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
}

export function mapAuthError(error: unknown): AuthError {
  const errorMessage = typeof error === 'string' 
    ? error 
    : (error as { message?: string })?.message || 'An unexpected error occurred'

  // Common Supabase auth error patterns
  const errorMappings: Record<string, AuthError> = {
    'Invalid login credentials': {
      type: 'error',
      title: 'Invalid credentials',
      message: 'The email or password you entered is incorrect. Please check your credentials and try again.',
    },
    'Email not confirmed': {
      type: 'warning',
      title: 'Email not verified',
      message: 'Please check your email and click the verification link before signing in.',
      action: {
        label: 'Resend verification email',
        href: '/resend-verification'
      }
    },
    'User already registered': {
      type: 'info',
      title: 'Account already exists',
      message: 'An account with this email already exists. Please sign in instead.',
      action: {
        label: 'Go to sign in',
        href: '/login'
      }
    },
    'Signup requires a valid password': {
      type: 'error',
      title: 'Invalid password',
      message: 'Please enter a valid password that meets our security requirements.',
    },
    'Password should be at least 6 characters': {
      type: 'error',
      title: 'Password too short',
      message: 'Your password must be at least 6 characters long.',
    },
    'Unable to validate email address: invalid format': {
      type: 'error',
      title: 'Invalid email',
      message: 'Please enter a valid email address.',
    },
    'Too many requests': {
      type: 'warning',
      title: 'Too many attempts',
      message: 'You\'ve made too many requests. Please wait a few minutes before trying again.',
    },
    'Email rate limit exceeded': {
      type: 'warning',
      title: 'Email rate limit exceeded',
      message: 'Too many emails sent. Please wait before requesting another email.',
    },
    'User not found': {
      type: 'error',
      title: 'Account not found',
      message: 'No account found with this email address. Please check your email or create a new account.',
      action: {
        label: 'Create account',
        href: '/signup'
      }
    },
    'Invalid email': {
      type: 'error',
      title: 'Invalid email',
      message: 'Please enter a valid email address.',
    },
    'Weak password': {
      type: 'error',
      title: 'Weak password',
      message: 'Your password is too weak. Please choose a stronger password with uppercase letters, numbers, and special characters.',
    }
  }

  // Check for exact matches first
  if (errorMappings[errorMessage]) {
    return errorMappings[errorMessage]
  }

  // Check for partial matches
  for (const [key, value] of Object.entries(errorMappings)) {
    if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
      return value
    }
  }

  // Check for specific error patterns
  if (errorMessage.includes('email') && errorMessage.includes('not confirmed')) {
    return errorMappings['Email not confirmed']
  }

  if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
    return errorMappings['Too many requests']
  }

  if (errorMessage.includes('password') && errorMessage.includes('weak')) {
    return errorMappings['Weak password']
  }

  // Default error
  return {
    type: 'error',
    title: 'Something went wrong',
    message: errorMessage || 'An unexpected error occurred. Please try again.',
  }
}