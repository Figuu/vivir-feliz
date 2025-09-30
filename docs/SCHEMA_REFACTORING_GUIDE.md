# Schema Refactoring Guide

## Overview

This guide explains the schema refactoring to properly align with Supabase Auth and the Vivir Feliz therapy center requirements.

## Problems with Old Schema

### 1. **Redundant User Table**
```prisma
// ❌ OLD - Redundant with Supabase Auth
model User {
  id    String @id
  email String
  name  String
  role  UserRole
  // ...
  profile Profile?
  therapist Therapist?
  parent Parent?
}
```

**Problem**: Supabase Auth already manages users. Having a separate User table duplicates functionality.

### 2. **Generic Profile Table**
```prisma
// ❌ OLD - Generic fields that don't fit therapy center
model Profile {
  userId   String @unique
  bio      String?
  phone    String?
  company  String? // ❌ Not relevant
  website  String? // ❌ Not relevant
}
```

**Problem**: Fields like `company` and `website` don't make sense for a therapy center application.

### 3. **Duplicate Data Everywhere**
```prisma
// ❌ OLD - Duplicate fields
model Therapist {
  firstName String
  lastName  String
  phone     String?
}

model Parent {
  firstName String
  lastName  String
  phone     String?
}

model Profile {
  phone String?
}
```

**Problem**: Same data stored in 3 different places. No single source of truth.

### 4. **Wrong Role Hierarchy**
```prisma
// ❌ OLD - Missing COORDINATOR, wrong ADMIN concept
enum UserRole {
  SUPER_ADMIN
  ADMIN     // ❌ Wrong - was treating coordinator as admin
  THERAPIST
  PARENT
}
```

**Problem**: From vivir-feliz.md:
- **COORDINATOR** = "super therapist" who manages therapists but IS a therapist
- **ADMIN** = secretary role with specific permissions
- These are different roles with different functions!

---

## New Schema Architecture

### ✅ Profile as Master Table

```prisma
model Profile {
  id        String @id // Supabase Auth user ID (not generated)
  email     String @unique
  firstName String
  lastName  String
  phone     String?
  avatar    String?
  role      UserRole
  
  // Role-specific relations
  therapist Therapist?
  parent    Parent?
  admin     Admin?
}
```

**Benefits**:
- Single source of truth for user data
- Direct link to Supabase Auth via ID
- Shared fields (name, phone, avatar) in one place
- No duplication

### ✅ Role-Specific Tables Only Have Role-Specific Data

```prisma
model Therapist {
  id              String  @id @default(uuid())
  profileId       String  @unique
  profile         Profile @relation(...)
  
  // ONLY therapist-specific fields
  licenseNumber   String? @unique
  bio             String?
  isCoordinator   Boolean @default(false)
  canTakeConsultations Boolean @default(true)
  // No firstName, lastName, phone - those are in Profile!
}

model Parent {
  id         String  @id @default(uuid())
  profileId  String  @unique
  profile    Profile @relation(...)
  
  // ONLY parent-specific fields
  address          String?
  city             String?
  emergencyContact String?
  emergencyPhone   String?
  relationship     String?
  // No firstName, lastName, phone - those are in Profile!
}

model Admin {
  id         String  @id @default(uuid())
  profileId  String  @unique
  profile    Profile @relation(...)
  
  // ONLY admin-specific fields
  department String?
  notes      String?
}
```

### ✅ Correct Role Hierarchy

```prisma
enum UserRole {
  SUPER_ADMIN  // Manages everything: finances, all users
  ADMIN        // Secretary: payment confirmation, schedules
  COORDINATOR  // Super therapist: manages therapists, but IS therapist
  THERAPIST    // Regular therapist
  PARENT       // Parent of patient
}
```

**Role Functions** (from vivir-feliz.md):

| Role | Description | Key Functions |
|------|-------------|---------------|
| **SUPER_ADMIN** | Highest level | Financial management, manage ALL users (admins, therapists, parents) |
| **ADMIN** | Secretary role | Confirm payments, manage schedules, patient registration, more permissions than therapists |
| **COORDINATOR** | Super Therapist | Manage therapists (schedules, assignments) BUT can also take consultations/sessions as a therapist |
| **THERAPIST** | Regular therapist | Take consultations, sessions, fill forms, create proposals |
| **PARENT** | Patient's parent | View information, request reschedules, view reports |

---

## Migration Steps

### Step 1: Backup Current Database
```bash
pg_dump $DATABASE_URL > backup_before_refactor.sql
```

### Step 2: Create Data Migration Script

```typescript
// migrate-to-new-schema.ts
import { PrismaClient } from '@prisma/client'
import { createAdminClient } from '@/lib/supabase/server'

async function migrate() {
  const prisma = new PrismaClient()
  const supabase = createAdminClient()
  
  // 1. Get all existing users
  const oldUsers = await prisma.user.findMany({
    include: {
      profile: true,
      therapist: true,
      parent: true,
    }
  })
  
  // 2. For each user, create Profile with Supabase Auth ID
  for (const user of oldUsers) {
    // Verify user exists in Supabase Auth
    const { data: authUser } = await supabase.auth.admin.getUserById(user.id)
    
    if (!authUser?.user) {
      console.warn(`User ${user.id} not found in Supabase Auth, skipping`)
      continue
    }
    
    // Create Profile (master table)
    await prisma.profile.create({
      data: {
        id: user.id, // Supabase Auth ID
        email: user.email,
        firstName: user.therapist?.firstName || user.parent?.firstName || user.name?.split(' ')[0] || '',
        lastName: user.therapist?.lastName || user.parent?.lastName || user.name?.split(' ')[1] || '',
        phone: user.therapist?.phone || user.parent?.phone || user.profile?.phone,
        avatar: user.avatar || user.profile?.avatar,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    })
    
    // Create role-specific table
    if (user.role === 'THERAPIST' && user.therapist) {
      await prisma.therapist.create({
        data: {
          profileId: user.id,
          licenseNumber: user.therapist.licenseNumber,
          bio: user.profile?.bio,
          isCoordinator: user.therapist.isCoordinator,
          canTakeConsultations: user.therapist.canTakeConsultations,
          // ... other therapist-specific fields
        }
      })
    }
    
    if (user.role === 'PARENT' && user.parent) {
      await prisma.parent.create({
        data: {
          profileId: user.id,
          address: user.parent.address,
          city: user.parent.city,
          emergencyContact: user.parent.emergencyContact,
          emergencyPhone: user.parent.emergencyPhone,
          relationship: user.parent.relationship,
          // ... other parent-specific fields
        }
      })
    }
    
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      await prisma.admin.create({
        data: {
          profileId: user.id,
          department: null,
          notes: null,
        }
      })
    }
  }
  
  console.log('✅ Migration complete!')
}

migrate()
```

### Step 3: Update Application Code

#### 3.1 Update `user-utils.ts`

```typescript
// ✅ NEW - Use Profile instead of User
export async function ensureUserExists(supabaseUser: SupabaseUser) {
  const userRole = supabaseUser.user_metadata?.role || 'PARENT'
  const validRoles = ['PARENT', 'THERAPIST', 'COORDINATOR', 'ADMIN', 'SUPER_ADMIN']
  const role = validRoles.includes(userRole) ? userRole : 'PARENT'

  // Check if profile exists
  const existingProfile = await db.profile.findUnique({
    where: { id: supabaseUser.id }
  })

  if (existingProfile) {
    // Update role if different
    if (existingProfile.role !== role) {
      return await db.profile.update({
        where: { id: supabaseUser.id },
        data: { role: role as UserRole }
      })
    }
    return existingProfile
  }

  // Create new profile
  return await db.profile.create({
    data: {
      id: supabaseUser.id, // Use Supabase Auth ID
      email: supabaseUser.email || '',
      firstName: supabaseUser.user_metadata?.firstName || '',
      lastName: supabaseUser.user_metadata?.lastName || '',
      phone: supabaseUser.user_metadata?.phone,
      avatar: supabaseUser.user_metadata?.avatar_url,
      role: role as UserRole
    }
  })
}
```

#### 3.2 Update API Routes

```typescript
// ✅ NEW - Use Profile
export async function GET() {
  const supabase = await createClient()
  const { data: { user: supabaseUser }, error } = await supabase.auth.getUser()
  
  if (error || !supabaseUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const profile = await db.profile.findUnique({
    where: { id: supabaseUser.id },
    include: {
      therapist: true,
      parent: true,
      admin: true,
    }
  })

  return NextResponse.json({ profile })
}
```

#### 3.3 Update Types

```typescript
// src/types/index.ts
export type Profile = {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  avatar?: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'COORDINATOR' | 'THERAPIST' | 'PARENT'
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  therapist?: Therapist
  parent?: Parent
  admin?: Admin
}
```

### Step 4: Update Seed File

```typescript
// Update seed to use Profile instead of User
const { data: adminAuth } = await supabaseAdmin.auth.admin.createUser({
  email: 'admin@vivirfeliz.com',
  password: '12345678',
  email_confirm: true,
  user_metadata: {
    firstName: 'Administrador',
    lastName: 'Sistema',
    role: 'SUPER_ADMIN'
  }
})

// Create Profile (not User)
await prisma.profile.create({
  data: {
    id: adminAuth.user.id,
    email: 'admin@vivirfeliz.com',
    firstName: 'Administrador',
    lastName: 'Sistema',
    role: 'SUPER_ADMIN',
  }
})

// Create Admin record
await prisma.admin.create({
  data: {
    profileId: adminAuth.user.id,
  }
})
```

---

## Benefits of New Schema

✅ **No Duplication**: Each piece of data exists in exactly one place  
✅ **Clear Separation**: Auth (Supabase) vs Business Data (Prisma)  
✅ **Correct Roles**: COORDINATOR properly separated from ADMIN  
✅ **Better Performance**: Fewer joins needed  
✅ **Easier Maintenance**: Changes to shared fields only in Profile  
✅ **Type Safety**: Clear relationship between roles and their data  

---

## Questions?

- Profile ID = Supabase Auth user ID (not auto-generated)
- All shared fields (name, phone, avatar) in Profile only
- Role-specific tables only have role-specific data
- Use `include` to get role-specific data when needed

```typescript
// Get full user data
const profile = await prisma.profile.findUnique({
  where: { id: userId },
  include: {
    therapist: user.role === 'THERAPIST' || user.role === 'COORDINATOR',
    parent: user.role === 'PARENT',
    admin: user.role === 'ADMIN' || user.role === 'SUPER_ADMIN',
  }
})
```

