# Full Stack Web Template - Product Requirements & Implementation Plan

## Project Overview
Create a production-ready full-stack web template using Next.js 15, Supabase, Prisma ORM, shadcn/ui, Zustand, and Zod. This template will serve as a multi-purpose general template with complete authentication, user management, dashboard, and all necessary features for rapid SaaS development.

## Core Technologies & Versions
- **Frontend**: Next.js 15 with App Router + TypeScript + shadcn/ui + Tailwind CSS v4
- **Backend**: Next.js 15 API Routes + Supabase (PostgreSQL)
- **Database**: Supabase with Prisma ORM for type-safe operations
- **State Management**: Zustand for local UI state (menus, ephemeral UI)

- **Data Fetching**: TanStack Query (React Query v5) for server state caching, mutations, and SSR hydration
- **Validation**: Zod for runtime type validation
- **Authentication**: Supabase Auth with custom role management (@supabase/ssr - NOT auth-helpers)
- **Deployment**: Vercel-ready configuration

## Critical Context & Documentation

### Official Documentation URLs
- **Next.js 15**: https://nextjs.org/docs (App Router, API Routes, Server Components)
- **Supabase Auth SSR**: https://supabase.com/docs/guides/auth/server-side/nextjs
- **Supabase Quickstart**: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
- **Prisma with Supabase**: https://www.prisma.io/docs/orm/overview/databases/supabase
- **shadcn/ui Installation**: https://ui.shadcn.com/docs/installation/next
- **shadcn/ui Sidebar**: https://ui.shadcn.com/docs/components/sidebar
- **shadcn/ui Dashboard Example**: https://ui.shadcn.com/examples/dashboard
- **Zustand**: https://docs.pmnd.rs/zustand/getting-started/introduction
- **Zod**: https://zod.dev/
- **TanStack Query v5**: https://tanstack.com/query/latest/docs/react/overview

### Key Implementation References
- **GitHub Template Reference**: https://github.com/Kiranism/next-shadcn-dashboard-starter
- **Retractable Sidebar Reference**: https://github.com/salimi-my/shadcn-ui-sidebar
- **Supabase SaaS Template**: https://github.com/Razikus/supabase-nextjs-template

## Features to Implement

### 1. Authentication System
- [x] Sign up with email/password
- [x] Sign in with email/password
- [x] Sign out functionality
- [x] Password reset flow (email-based)
- [x] Email verification
- [x] Protected routes with middleware
- [x] Session management with SSR
- [x] Role-based access control (Admin, User)

### 2. Landing Page
- [x] Hero section with CTA
- [x] Features section
- [x] Pricing section (optional)
- [x] Footer with links
- [x] Responsive navigation
- [x] Dark/light mode toggle

### 3. Dashboard
- [x] Collapsible sidebar navigation
- [x] Mobile-responsive drawer
- [x] Main content area
- [x] Breadcrumb navigation
- [x] User dropdown menu
- [x] Notification system
- [x] Analytics cards/widgets
- [x] Data tables with pagination

### 4. User Management
- [x] User profile page
- [x] Edit profile functionality
- [x] Change password
- [x] Avatar upload (Supabase Storage)
- [x] Account settings
- [x] Delete account option

### 5. Admin Features
- [x] User management table
- [x] Role management
- [x] System settings
- [x] Activity logs

## Implementation Blueprint

### Phase 1: Project Initialization & Setup

```bash
# 1. Initialize Next.js 15 project with TypeScript and Tailwind
npx create-next-app@latest boring-skale-next --typescript --tailwind --app --src-dir --import-alias "@/*"

# 2. Install core dependencies
npm install @supabase/supabase-js @supabase/ssr @prisma/client prisma zustand zod react-hook-form @hookform/resolvers @tanstack/react-query @tanstack/react-query-devtools

# 3. Install shadcn/ui
npx shadcn@latest init -d

# 4. Install essential shadcn components
npx shadcn@latest add button card dialog dropdown-menu form input label navigation-menu select separator sheet sidebar skeleton table tabs toast avatar badge checkbox radio-group switch textarea alert alert-dialog command popover tooltip
```

### Phase 2: Environment Configuration

```env
# .env.local
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database URLs for Prisma
DATABASE_URL="postgres://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgres://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Phase 3: Database Schema (Prisma)

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  avatar    String?
  role      UserRole @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  profile   Profile?
  sessions  Session[]

  @@map("users")
}

model Profile {
  id        String   @id @default(uuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  bio       String?
  phone     String?
  company   String?
  website   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("profiles")
}

model Session {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([userId])
  @@map("sessions")
}

enum UserRole {
  USER
  ADMIN
  SUPER_ADMIN

  @@map("user_roles")
}
```

### Phase 4: File Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   ├── reset-password/
│   │   │   └── page.tsx
│   │   └── update-password/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   ├── profile/
│   │   │   └── page.tsx
│   │   └── admin/
│   │       ├── users/
│   │       │   └── page.tsx
│   │       └── settings/
│   │           └── page.tsx
│   ├── (marketing)/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   ├── callback/
│   │   │   │   └── route.ts
│   │   │   └── confirm/
│   │   │       └── route.ts
│   │   ├── user/
│   │   │   └── route.ts
│   │   └── admin/
│   │       └── users/
│   │           └── route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── not-found.tsx
├── components/
│   ├── ui/              # shadcn components
│   ├── auth/
│   │   ├── login-form.tsx
│   │   ├── signup-form.tsx
│   │   └── reset-password-form.tsx
│   ├── dashboard/
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   ├── user-nav.tsx
│   │   └── mobile-nav.tsx
│   ├── landing/
│   │   ├── hero.tsx
│   │   ├── features.tsx
│   │   └── footer.tsx
│   └── providers/
│       ├── supabase-provider.tsx
│       ├── query-provider.tsx
│       └── theme-provider.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── validations/
│   │   ├── auth.ts
│   │   └── user.ts
│   ├── db.ts
│   └── utils.ts
├── stores/
│   ├── auth-store.ts
│   └── user-store.ts
├── hooks/
│   ├── use-auth.ts
│   └── use-user.ts
├── types/
│   └── index.ts
└── middleware.ts
```

### Phase 5: Core Implementation Steps

#### Step 1: Supabase Client Setup

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Handle cookie setting in Server Components
          }
        },
      },
    }
  )
}
```

#### Step 2: Middleware Configuration

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  // Auth routes redirect if already logged in
  if (user && ['/login', '/signup'].includes(request.nextUrl.pathname)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

#### Step 3: Validation Schemas

```typescript
// lib/validations/auth.ts
import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  name: z.string().min(2, "Name must be at least 2 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
})

export const updatePasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})
```

#### Step 4: Zustand Store Setup

```typescript
// stores/auth-store.ts
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
  
  setUser: (user: User | null) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  signOut: () => void
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isLoading: false,
        error: null,
        
        setUser: (user) => set({ user, error: null }),
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
        signOut: () => set({ user: null, error: null }),
      }),
      {
        name: 'auth-storage',
      }
    )
  )
)
```

#### Step 5: React Query Setup (Provider + SSR Hydration)

```tsx
// components/providers/query-provider.tsx
'use client'

import { PropsWithChildren, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

export function QueryProvider({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000, // 30s
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
    </QueryClientProvider>
  )
}
```

Add the provider to the root layout so all client components can use React Query.

```tsx
// app/layout.tsx (excerpt)
import { QueryProvider } from '@/components/providers/query-provider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* existing providers like ThemeProvider and SupabaseProvider */}
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}
```

Server prefetch + hydration example with the App Router.

```tsx
// app/(dashboard)/dashboard/page.tsx (Server Component)
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'

async function fetchDashboardSummary() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/user`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export default async function Page() {
  const queryClient = new QueryClient()
  await queryClient.prefetchQuery({ queryKey: ['dashboard', 'summary'], queryFn: fetchDashboardSummary })
  const dehydratedState = dehydrate(queryClient)

  return (
    <HydrationBoundary state={dehydratedState}>
      {/* Client component below can use useQuery(['dashboard','summary']) */}
      {/* <DashboardSummary /> */}
    </HydrationBoundary>
  )
}
```

Client usage example.

```tsx
// components/dashboard/summary.tsx
'use client'
import { useQuery } from '@tanstack/react-query'

export function DashboardSummary() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => fetch('/api/user').then((r) => r.json()),
  })

  if (isLoading) return <div>Loading…</div>
  if (isError) return <div>Failed to load</div>
  return <pre className="text-xs">{JSON.stringify(data, null, 2)}</pre>
}
```

## Implementation Tasks Order

1. **Project Setup & Configuration**
   - Initialize Next.js 15 project
   - Install all dependencies
   - Configure environment variables
   - Set up Prisma with Supabase
   - Add React Query provider and Devtools

2. **Database Setup**
   - Create Prisma schema
   - Run initial migration
   - Set up Supabase project
   - Configure Row Level Security

3. **Authentication Foundation**
   - Create Supabase clients (browser/server)
   - Implement middleware for auth
   - Create auth API routes
   - Build auth forms (login/signup/reset)

4. **Landing Page**
   - Create marketing layout
   - Build hero section
   - Add features section
   - Implement responsive navigation

5. **Dashboard Structure**
   - Create dashboard layout with sidebar
   - Implement mobile navigation
   - Add user dropdown menu
   - Create dashboard home page

6. **User Management**
   - Build profile page
   - Implement settings page
   - Add password change functionality
   - Create user update API

7. **Admin Features**
   - Create admin routes
   - Build user management table
   - Implement role management
   - Add admin-only middleware

8. **Polish & Testing**
   - Add loading states
   - Implement error boundaries
   - Add toast notifications
   - Write integration tests

## Validation Gates

```bash
# 1. TypeScript & Linting Check
npm run type-check && npm run lint

# 2. Build Validation
npm run build

# 3. Database Schema Validation
npx prisma validate

# 4. Migration Check
npx prisma migrate dev --name init

# 5. Development Server Test
npm run dev
# Test at http://localhost:3000

# 6. Authentication Flow Test
# - Sign up new user
# - Verify email
# - Sign in
# - Reset password
# - Access protected route

# 7. Component Testing (if tests are added)
npm test
```

## Common Gotchas & Solutions

### 1. Supabase Auth Session Management
- **Issue**: Session not persisting across page refreshes
- **Solution**: Ensure middleware is properly configured and cookies are being set

### 2. Prisma with Supabase Connection
- **Issue**: Migration failures with connection pooling
- **Solution**: Use DIRECT_URL for migrations, DATABASE_URL for application

### 3. shadcn/ui with Next.js 15
- **Issue**: Components not rendering properly with App Router
- **Solution**: Ensure 'use client' directive is added to interactive components

### 4. Password Reset Flow
- **Issue**: Reset links expiring due to email pre-loading
- **Solution**: Implement PKCE flow with token exchange endpoint

### 6. React Query SSR Hydration
- **Issue**: Mismatched cache between server and client leading to double fetches
- **Solution**: Use `QueryClient` on the server to `prefetchQuery`, wrap the client subtree with `HydrationBoundary` and pass `dehydrate(queryClient)`; ensure query keys match exactly in `useQuery`

### 5. TypeScript Strict Mode
- **Issue**: Type errors with Supabase responses
- **Solution**: Create proper type definitions for Supabase tables

## Performance Optimization Checklist

- [ ] Implement dynamic imports for heavy components
- [ ] Use React.memo for expensive renders
- [ ] Implement virtual scrolling for large lists
- [ ] Optimize images with next/image
- [ ] Enable ISR for static pages
- [ ] Implement proper caching strategies
- [ ] Use Suspense boundaries for async components
- [ ] Tune React Query defaults (e.g., `staleTime`, `gcTime`, `refetchOnWindowFocus`)
- [ ] Prefetch and dehydrate critical queries on the server

## Security Checklist

- [ ] Enable Row Level Security in Supabase
- [ ] Implement rate limiting on API routes
- [ ] Validate all inputs with Zod
- [ ] Sanitize user-generated content
- [ ] Use HTTPS in production
- [ ] Implement CSRF protection
- [ ] Add security headers
- [ ] Enable 2FA (optional)

## Expected File Count
Approximately 60-80 files including:
- 15-20 page components
- 20-25 UI components
- 10-15 API routes
- 10-15 utility/lib files
- Configuration files

## Success Metrics
- All validation gates pass
- Authentication flow works end-to-end
- Dashboard loads with sidebar navigation
- User can update profile and settings
- Admin can manage users
- Responsive on mobile devices
- Dark/light mode toggles properly
- React Query caches server state and hydrates without double fetching

## Confidence Score: 9/10

This PRP provides comprehensive context with:
- Official documentation links
- Proven implementation patterns
- Clear file structure
- Step-by-step implementation
- Validation gates
- Common issues and solutions

The AI agent has all necessary information to implement this template successfully in one pass.