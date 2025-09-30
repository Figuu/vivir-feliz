
export type User = {
  id: string
  email: string
  name: string | null
  avatar: string | null
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN' | 'THERAPIST' | 'PARENT' | 'COORDINATOR'
  createdAt: Date
  updatedAt: Date
  created_at?: Date // for API compatibility
  updated_at?: Date // for API compatibility
  profile?: Profile | null
}

export type Profile = {
  id: string
  userId: string
  bio: string | null
  phone: string | null
  company: string | null
  website: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Session {
  id: string
  userId: string
  token: string
  expiresAt: Date
  createdAt: Date
}