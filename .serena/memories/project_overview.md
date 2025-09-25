# Project Overview: Boring Skale Next

## Purpose
A production-ready full-stack SaaS template built with modern technologies. The template provides a foundation for enterprise-grade applications with authentication, user management, and admin capabilities.

## Tech Stack
- **Frontend**: Next.js 15.4.6 with App Router, React 19.1.0, TypeScript
- **Styling**: TailwindCSS with shadcn/ui component library
- **Authentication**: Supabase Auth
- **Database**: PostgreSQL with Prisma ORM
- **State Management**: 
  - Zustand for client state
  - TanStack Query (installed but not extensively used yet)
- **UI Components**: Radix UI primitives via shadcn/ui
- **Animations**: Framer Motion
- **Form Handling**: React Hook Form with Zod validation

## Current Implementation Status
- ✅ Basic authentication (login/signup/reset)
- ✅ Dashboard with sidebar navigation  
- ✅ Theme toggle (dark/light mode)
- ✅ Database schema with User, Profile, Session models
- ✅ Route protection via middleware
- ⚠️ Users table uses mock data (not connected to Prisma)
- ⚠️ Missing advanced features outlined in PRP

## Architecture Patterns
- App Router with route groups: `(auth)`, `(dashboard)`, `(marketing)`
- Server-side auth checks in middleware
- API routes in `/api` directory
- Component-based architecture with clear separation
- Utility-first CSS with Tailwind
- Type-safe forms with Zod schemas