import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'
import { resolve } from 'path'
import { existsSync } from 'fs'

// Load environment variables - try .env.local first, then .env
const envPath = resolve(__dirname, '../.env')

if (existsSync(envPath)) {
  console.log('📋 Loading environment from .env')
  config({ path: envPath })
} else {
  console.error('❌ No .env or .env.local file found!')
  console.error('Please create a .env.local file with your Supabase credentials.')
  console.error('See env.example for the required variables.')
  process.exit(1)
}

// Verify required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'DATABASE_URL'
]

const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:')
  missingVars.forEach(varName => console.error(`  - ${varName}`))
  console.error('\nPlease add these to your .env.local or .env file.')
  process.exit(1)
}

// Import after env vars are loaded
import { createAdminClient } from '../src/lib/supabase/server'

const prisma = new PrismaClient()

// Default password for seed users (change after first login!)
const DEFAULT_PASSWORD = '12345678'

async function main() {
  console.log('🌱 Starting seed data creation...')

  // ========== SPECIALTIES ==========
  console.log('Creating specialties...')
  
  const specialties = await Promise.all([
    prisma.specialty.upsert({
      where: { name: 'Psicología Clínica' },
      update: {},
      create: {
        name: 'Psicología Clínica',
        description: 'Evaluación y tratamiento de trastornos psicológicos y del comportamiento',
        isActive: true,
      },
    }),
    prisma.specialty.upsert({
      where: { name: 'Fonoaudiología' },
      update: {},
      create: {
        name: 'Fonoaudiología',
        description: 'Evaluación y tratamiento de trastornos del habla, lenguaje y comunicación',
        isActive: true,
      },
    }),
    prisma.specialty.upsert({
      where: { name: 'Terapia Ocupacional' },
      update: {},
      create: {
        name: 'Terapia Ocupacional',
        description: 'Evaluación y tratamiento para mejorar las habilidades funcionales y de desarrollo',
        isActive: true,
      },
    }),
    prisma.specialty.upsert({
      where: { name: 'Fisioterapia' },
      update: {},
      create: {
        name: 'Fisioterapia',
        description: 'Evaluación y tratamiento de trastornos del movimiento y desarrollo motor',
        isActive: true,
      },
    }),
    prisma.specialty.upsert({
      where: { name: 'Psicopedagogía' },
      update: {},
      create: {
        name: 'Psicopedagogía',
        description: 'Evaluación y tratamiento de dificultades de aprendizaje y desarrollo cognitivo',
        isActive: true,
      },
    }),
    prisma.specialty.upsert({
      where: { name: 'Coordinación' },
      update: {},
      create: {
        name: 'Coordinación',
        description: 'Supervisión y coordinación de equipos terapéuticos multidisciplinarios',
        isActive: true,
      },
    }),
  ])

  console.log(`✅ Created ${specialties.length} specialties`)

  // ========== CONSULTATION REASONS ==========
  console.log('Creating consultation reasons...')
  
  const consultationReasons = await Promise.all([
    // Psicología Clínica
    prisma.consultationReason.upsert({
      where: { name: 'Problemas de comportamiento' },
      update: {},
      create: {
        name: 'Problemas de comportamiento',
        description: 'Agresividad, impulsividad, desobediencia, rabietas',
        specialtyId: specialties[0].id,
        isActive: true,
      },
    }),
    prisma.consultationReason.upsert({
      where: { name: 'Ansiedad y miedos' },
      update: {},
      create: {
        name: 'Ansiedad y miedos',
        description: 'Ansiedad generalizada, fobias, miedos específicos',
        specialtyId: specialties[0].id,
        isActive: true,
      },
    }),
    prisma.consultationReason.upsert({
      where: { name: 'Depresión infantil' },
      update: {},
      create: {
        name: 'Depresión infantil',
        description: 'Tristeza persistente, pérdida de interés, cambios de humor',
        specialtyId: specialties[0].id,
        isActive: true,
      },
    }),
    prisma.consultationReason.upsert({
      where: { name: 'Trastornos del sueño' },
      update: {},
      create: {
        name: 'Trastornos del sueño',
        description: 'Insomnio, pesadillas, terrores nocturnos',
        specialtyId: specialties[0].id,
        isActive: true,
      },
    }),

    // Fonoaudiología
    prisma.consultationReason.upsert({
      where: { name: 'Retraso en el lenguaje' },
      update: {},
      create: {
        name: 'Retraso en el lenguaje',
        description: 'Desarrollo del lenguaje más lento de lo esperado para la edad',
        specialtyId: specialties[1].id,
        isActive: true,
      },
    }),
    prisma.consultationReason.upsert({
      where: { name: 'Dificultades de pronunciación' },
      update: {},
      create: {
        name: 'Dificultades de pronunciación',
        description: 'Problemas con la articulación de sonidos y palabras',
        specialtyId: specialties[1].id,
        isActive: true,
      },
    }),
    prisma.consultationReason.upsert({
      where: { name: 'Tartamudez' },
      update: {},
      create: {
        name: 'Tartamudez',
        description: 'Interrupciones en la fluidez del habla',
        specialtyId: specialties[1].id,
        isActive: true,
      },
    }),

    // Terapia Ocupacional
    prisma.consultationReason.upsert({
      where: { name: 'Dificultades motoras finas' },
      update: {},
      create: {
        name: 'Dificultades motoras finas',
        description: 'Problemas con la escritura, uso de utensilios, coordinación manual',
        specialtyId: specialties[2].id,
        isActive: true,
      },
    }),
    prisma.consultationReason.upsert({
      where: { name: 'Problemas de integración sensorial' },
      update: {},
      create: {
        name: 'Problemas de integración sensorial',
        description: 'Hipersensibilidad o hiposensibilidad a estímulos sensoriales',
        specialtyId: specialties[2].id,
        isActive: true,
      },
    }),

    // Fisioterapia
    prisma.consultationReason.upsert({
      where: { name: 'Retraso motor' },
      update: {},
      create: {
        name: 'Retraso motor',
        description: 'Desarrollo motor más lento de lo esperado para la edad',
        specialtyId: specialties[3].id,
        isActive: true,
      },
    }),
    prisma.consultationReason.upsert({
      where: { name: 'Dificultades de coordinación' },
      update: {},
      create: {
        name: 'Dificultades de coordinación',
        description: 'Problemas con la coordinación y equilibrio',
        specialtyId: specialties[3].id,
        isActive: true,
      },
    }),

    // Psicopedagogía
    prisma.consultationReason.upsert({
      where: { name: 'Dificultades de aprendizaje' },
      update: {},
      create: {
        name: 'Dificultades de aprendizaje',
        description: 'Problemas con lectura, escritura, matemáticas',
        specialtyId: specialties[4].id,
        isActive: true,
      },
    }),
    prisma.consultationReason.upsert({
      where: { name: 'Déficit de atención' },
      update: {},
      create: {
        name: 'Déficit de atención',
        description: 'Dificultades para mantener la atención y concentración',
        specialtyId: specialties[4].id,
        isActive: true,
      },
    }),
  ])

  console.log(`✅ Created ${consultationReasons.length} consultation reasons`)

  // ========== SERVICES ==========
  console.log('Creating services...')
  
  const services = await Promise.all([
    // Evaluaciones
    prisma.service.upsert({
      where: { code: 'EVAL-PSI-001' },
      update: {},
      create: {
        code: 'EVAL-PSI-001',
        name: 'Evaluación Psicológica Integral',
        description: 'Evaluación completa del desarrollo psicológico y emocional',
        type: 'EVALUATION',
        specialtyId: specialties[0].id,
        defaultSessions: 3,
        costPerSession: 80.00,
        sessionDuration: 60,
        isActive: true,
      },
    }),
    prisma.service.upsert({
      where: { code: 'EVAL-FONO-001' },
      update: {},
      create: {
        code: 'EVAL-FONO-001',
        name: 'Evaluación Fonoaudiológica',
        description: 'Evaluación del desarrollo del lenguaje y comunicación',
        type: 'EVALUATION',
        specialtyId: specialties[1].id,
        defaultSessions: 2,
        costPerSession: 70.00,
        sessionDuration: 45,
        isActive: true,
      },
    }),
    prisma.service.upsert({
      where: { code: 'EVAL-TO-001' },
      update: {},
      create: {
        code: 'EVAL-TO-001',
        name: 'Evaluación de Terapia Ocupacional',
        description: 'Evaluación de habilidades funcionales y desarrollo sensorial',
        type: 'EVALUATION',
        specialtyId: specialties[2].id,
        defaultSessions: 2,
        costPerSession: 70.00,
        sessionDuration: 45,
        isActive: true,
      },
    }),
    prisma.service.upsert({
      where: { code: 'EVAL-FISIO-001' },
      update: {},
      create: {
        code: 'EVAL-FISIO-001',
        name: 'Evaluación Fisioterapéutica',
        description: 'Evaluación del desarrollo motor y coordinación',
        type: 'EVALUATION',
        specialtyId: specialties[3].id,
        defaultSessions: 2,
        costPerSession: 70.00,
        sessionDuration: 45,
        isActive: true,
      },
    }),
    prisma.service.upsert({
      where: { code: 'EVAL-PSICO-001' },
      update: {},
      create: {
        code: 'EVAL-PSICO-001',
        name: 'Evaluación Psicopedagógica',
        description: 'Evaluación de habilidades de aprendizaje y desarrollo cognitivo',
        type: 'EVALUATION',
        specialtyId: specialties[4].id,
        defaultSessions: 3,
        costPerSession: 75.00,
        sessionDuration: 50,
        isActive: true,
      },
    }),

    // Tratamientos - Psicología
    prisma.service.upsert({
      where: { code: 'TRAT-PSI-001' },
      update: {},
      create: {
        code: 'TRAT-PSI-001',
        name: 'Terapia Psicológica Individual',
        description: 'Sesiones de terapia psicológica individual para niños',
        type: 'TREATMENT',
        specialtyId: specialties[0].id,
        defaultSessions: 12,
        costPerSession: 60.00,
        sessionDuration: 45,
        isActive: true,
      },
    }),
    prisma.service.upsert({
      where: { code: 'TRAT-PSI-002' },
      update: {},
      create: {
        code: 'TRAT-PSI-002',
        name: 'Terapia Familiar',
        description: 'Sesiones de terapia familiar para abordar dinámicas familiares',
        type: 'TREATMENT',
        specialtyId: specialties[0].id,
        defaultSessions: 8,
        costPerSession: 80.00,
        sessionDuration: 60,
        isActive: true,
      },
    }),

    // Tratamientos - Fonoaudiología
    prisma.service.upsert({
      where: { code: 'TRAT-FONO-001' },
      update: {},
      create: {
        code: 'TRAT-FONO-001',
        name: 'Terapia del Lenguaje',
        description: 'Sesiones de terapia para mejorar el desarrollo del lenguaje',
        type: 'TREATMENT',
        specialtyId: specialties[1].id,
        defaultSessions: 16,
        costPerSession: 55.00,
        sessionDuration: 45,
        isActive: true,
      },
    }),
    prisma.service.upsert({
      where: { code: 'TRAT-FONO-002' },
      update: {},
      create: {
        code: 'TRAT-FONO-002',
        name: 'Terapia de Articulación',
        description: 'Sesiones para mejorar la pronunciación y articulación',
        type: 'TREATMENT',
        specialtyId: specialties[1].id,
        defaultSessions: 12,
        costPerSession: 55.00,
        sessionDuration: 30,
        isActive: true,
      },
    }),

    // Tratamientos - Terapia Ocupacional
    prisma.service.upsert({
      where: { code: 'TRAT-TO-001' },
      update: {},
      create: {
        code: 'TRAT-TO-001',
        name: 'Terapia Ocupacional Individual',
        description: 'Sesiones de terapia ocupacional para mejorar habilidades funcionales',
        type: 'TREATMENT',
        specialtyId: specialties[2].id,
        defaultSessions: 16,
        costPerSession: 55.00,
        sessionDuration: 45,
        isActive: true,
      },
    }),
    prisma.service.upsert({
      where: { code: 'TRAT-TO-002' },
      update: {},
      create: {
        code: 'TRAT-TO-002',
        name: 'Integración Sensorial',
        description: 'Sesiones especializadas en integración sensorial',
        type: 'TREATMENT',
        specialtyId: specialties[2].id,
        defaultSessions: 12,
        costPerSession: 60.00,
        sessionDuration: 45,
        isActive: true,
      },
    }),

    // Tratamientos - Fisioterapia
    prisma.service.upsert({
      where: { code: 'TRAT-FISIO-001' },
      update: {},
      create: {
        code: 'TRAT-FISIO-001',
        name: 'Fisioterapia Pediátrica',
        description: 'Sesiones de fisioterapia especializada en desarrollo motor',
        type: 'TREATMENT',
        specialtyId: specialties[3].id,
        defaultSessions: 16,
        costPerSession: 55.00,
        sessionDuration: 45,
        isActive: true,
      },
    }),

    // Tratamientos - Psicopedagogía
    prisma.service.upsert({
      where: { code: 'TRAT-PSICO-001' },
      update: {},
      create: {
        code: 'TRAT-PSICO-001',
        name: 'Apoyo Psicopedagógico',
        description: 'Sesiones de apoyo para dificultades de aprendizaje',
        type: 'TREATMENT',
        specialtyId: specialties[4].id,
        defaultSessions: 16,
        costPerSession: 50.00,
        sessionDuration: 45,
        isActive: true,
      },
    }),
  ])

  console.log(`✅ Created ${services.length} services`)

  const supabaseAdmin = createAdminClient()

  // ========== SUPER ADMIN USER ==========
  console.log('Creating super admin profile...')
  
  let superAdminId: string | undefined
  const existingSuperAdminProfile = await prisma.profile.findUnique({
    where: { email: 'superadmin@demo.com' }
  })

  if (existingSuperAdminProfile) {
    superAdminId = existingSuperAdminProfile.id
    console.log('  Super admin profile already exists in database')
    
    // Check if user exists in Supabase Auth
    const { data: existingAuthUser, error: checkError } = await supabaseAdmin.auth.admin.getUserById(superAdminId)
    
    if (checkError || !existingAuthUser?.user) {
      console.log('  User not found in Supabase Auth, creating...')
      const { data: superAdminAuth, error: superAdminAuthError } = await supabaseAdmin.auth.admin.createUser({
        email: 'superadmin@demo.com',
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: {
          firstName: 'Super',
          lastName: 'Administrador',
          role: 'SUPER_ADMIN'
        }
      })

      if (superAdminAuthError) {
        console.error('Error creating super admin in Supabase Auth:', superAdminAuthError)
        throw superAdminAuthError
      }

      if (superAdminAuth?.user?.id && superAdminAuth.user.id !== superAdminId) {
        // Update profile ID to match Supabase Auth ID
        await prisma.profile.update({
          where: { id: superAdminId },
          data: { id: superAdminAuth.user.id }
        })
        superAdminId = superAdminAuth.user.id
        console.log('  Created user in Supabase Auth and synced ID')
      }
    } else {
      console.log('  User already exists in Supabase Auth')
    }
  } else {
    // Create user in Supabase Auth first
    const { data: superAdminAuth, error: superAdminAuthError } = await supabaseAdmin.auth.admin.createUser({
      email: 'superadmin@demo.com',
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: {
        firstName: 'Super',
        lastName: 'Administrador',
        role: 'SUPER_ADMIN'
      }
    })

    if (superAdminAuthError) {
      console.error('Error creating super admin in Supabase Auth:', superAdminAuthError)
      throw superAdminAuthError
    }

    if (!superAdminAuth?.user?.id) {
      throw new Error('Failed to create super admin in Supabase Auth')
    }

    superAdminId = superAdminAuth.user.id
  }

  // Create or update Profile
  await prisma.profile.upsert({
    where: { id: superAdminId },
    update: {
      email: 'superadmin@demo.com',
      firstName: 'Super',
      lastName: 'Administrador',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
    create: {
      id: superAdminId,
      email: 'superadmin@demo.com',
      firstName: 'Super',
      lastName: 'Administrador',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  })

  // Create Admin record for super admin
  await prisma.admin.upsert({
    where: { profileId: superAdminId },
    update: {},
    create: {
      profileId: superAdminId,
      department: 'Dirección General',
    },
  })

  console.log('✅ Created super admin (email: superadmin@demo.com, password: ' + DEFAULT_PASSWORD + ')')

  // ========== ADMIN USER (Secretary) ==========
  console.log('Creating admin profile...')
  
  let adminId: string | undefined
  const existingAdminProfile = await prisma.profile.findUnique({
    where: { email: 'admin@demo.com' }
  })

  if (existingAdminProfile) {
    adminId = existingAdminProfile.id
    console.log('  Admin profile already exists in database')
    
    const { data: existingAuthUser, error: checkError } = await supabaseAdmin.auth.admin.getUserById(adminId)
    
    if (checkError || !existingAuthUser?.user) {
      console.log('  User not found in Supabase Auth, creating...')
      const { data: adminAuth, error: adminAuthError } = await supabaseAdmin.auth.admin.createUser({
        email: 'admin@demo.com',
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: {
          firstName: 'Secretaria',
          lastName: 'General',
          role: 'ADMIN'
        }
      })

      if (adminAuthError) {
        console.error('Error creating admin in Supabase Auth:', adminAuthError)
        throw adminAuthError
      }

      if (adminAuth?.user?.id && adminAuth.user.id !== adminId) {
        await prisma.profile.update({
          where: { id: adminId },
          data: { id: adminAuth.user.id }
        })
        adminId = adminAuth.user.id
        console.log('  Created user in Supabase Auth and synced ID')
      }
    } else {
      console.log('  User already exists in Supabase Auth')
    }
  } else {
    const { data: adminAuth, error: adminAuthError } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin@demo.com',
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: {
        firstName: 'Secretaria',
        lastName: 'General',
        role: 'ADMIN'
      }
    })

    if (adminAuthError) {
      console.error('Error creating admin in Supabase Auth:', adminAuthError)
      throw adminAuthError
    }

    if (!adminAuth?.user?.id) {
      throw new Error('Failed to create admin in Supabase Auth')
    }

    adminId = adminAuth.user.id
  }

  // Create or update Profile
  await prisma.profile.upsert({
    where: { id: adminId },
    update: {
      email: 'admin@demo.com',
      firstName: 'Secretaria',
      lastName: 'General',
      role: 'ADMIN',
      isActive: true,
    },
    create: {
      id: adminId,
      email: 'admin@demo.com',
      firstName: 'Secretaria',
      lastName: 'General',
      role: 'ADMIN',
      isActive: true,
    },
  })

  // Create Admin record
  await prisma.admin.upsert({
    where: { profileId: adminId },
    update: {},
    create: {
      profileId: adminId,
      department: 'Secretaría',
    },
  })

  console.log('✅ Created admin (email: admin@demo.com, password: ' + DEFAULT_PASSWORD + ')')

  // ========== COORDINATOR (Super Therapist) ==========
  console.log('Creating coordinator profile...')
  
  const therapistData = [
    { 
      email: 'coordinador@demo.com', 
      firstName: 'María',
      lastName: 'González',
      role: 'COORDINATOR',
      licenseNumber: 'COORD-001',
      isCoordinator: true,
      specialtyIndex: 0 // Psicología Clínica
    },
    { 
      email: 'psicologa@demo.com', 
      firstName: 'Ana',
      lastName: 'Rodríguez',
      role: 'THERAPIST',
      licenseNumber: 'PSI-12345',
      isCoordinator: false,
      specialtyIndex: 0 // Psicología Clínica
    },
    { 
      email: 'fonoaudiologa@demo.com', 
      firstName: 'Carmen',
      lastName: 'Martínez',
      role: 'THERAPIST',
      licenseNumber: 'FONO-67890',
      isCoordinator: false,
      specialtyIndex: 1 // Fonoaudiología
    },
    { 
      email: 'terapeuta@demo.com', 
      firstName: 'Carlos',
      lastName: 'López',
      role: 'THERAPIST',
      licenseNumber: 'TO-54321',
      isCoordinator: false,
      specialtyIndex: 2 // Terapia Ocupacional
    },
  ]

  // Create therapist profiles
  const therapistProfiles = await Promise.all(
    therapistData.map(async ({ email, firstName, lastName, role, licenseNumber, isCoordinator, specialtyIndex }) => {
      let profileId: string | undefined
      
      // Check if profile exists
      const existingProfile = await prisma.profile.findUnique({
        where: { email }
      })

      if (existingProfile) {
        profileId = existingProfile.id
        console.log(`  Therapist profile ${email} already exists in database`)
        
        const { data: existingAuthUser, error: checkError } = await supabaseAdmin.auth.admin.getUserById(profileId)
        
        if (checkError || !existingAuthUser?.user) {
          console.log(`  User ${email} not found in Supabase Auth, creating...`)
          const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: DEFAULT_PASSWORD,
            email_confirm: true,
            user_metadata: {
              firstName,
              lastName,
              role
            }
          })

          if (authError) {
            console.error(`Error creating therapist ${email} in Supabase Auth:`, authError)
            throw authError
          }

          if (authUser?.user?.id && authUser.user.id !== profileId) {
            await prisma.profile.update({
              where: { id: profileId },
              data: { id: authUser.user.id }
            })
            profileId = authUser.user.id
            console.log(`  Created user ${email} in Supabase Auth and synced ID`)
          }
        } else {
          console.log(`  User ${email} already exists in Supabase Auth`)
        }
      } else {
        // Create in Supabase Auth first
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: DEFAULT_PASSWORD,
          email_confirm: true,
          user_metadata: {
            firstName,
            lastName,
            role
          }
        })

        if (authError) {
          console.error(`Error creating therapist ${email} in Supabase Auth:`, authError)
          throw authError
        }

        if (!authUser?.user?.id) {
          throw new Error(`Failed to create user in Supabase Auth for ${email}`)
        }

        profileId = authUser.user.id
      }

      // Create or update Profile
      await prisma.profile.upsert({
        where: { id: profileId },
        update: {
          email,
          firstName,
          lastName,
          role: role as any,
          isActive: true,
        },
        create: {
          id: profileId,
          email,
          firstName,
          lastName,
          phone: '+54 11 1234-5678',
          role: role as any,
          isActive: true,
        },
      })

      return { profileId, email, firstName, lastName, licenseNumber, isCoordinator, specialtyIndex }
    })
  )

  // Create Therapist records
  const therapists = await Promise.all(
    therapistProfiles.map(async ({ profileId, licenseNumber, isCoordinator }) =>
      prisma.therapist.upsert({
        where: { profileId },
        update: {},
        create: {
          profileId,
          licenseNumber,
          isCoordinator,
          canTakeConsultations: true,
        },
      })
    )
  )

  console.log('✅ Created therapist profiles')

  // Assign specialties to therapists
  await Promise.all([
    // Coordinator - Psicología Clínica + Coordinación
    prisma.therapistSpecialty.upsert({
      where: {
        therapistId_specialtyId: {
          therapistId: therapists[0].id,
          specialtyId: specialties[0].id,
        },
      },
      update: {},
      create: {
        therapistId: therapists[0].id,
        specialtyId: specialties[0].id,
        isPrimary: true,
      },
    }),
    prisma.therapistSpecialty.upsert({
      where: {
        therapistId_specialtyId: {
          therapistId: therapists[0].id,
          specialtyId: specialties[5].id, // Coordinación
        },
      },
      update: {},
      create: {
        therapistId: therapists[0].id,
        specialtyId: specialties[5].id,
        isPrimary: false,
      },
    }),

    // Psicóloga - Psicología Clínica
    prisma.therapistSpecialty.upsert({
      where: {
        therapistId_specialtyId: {
          therapistId: therapists[1].id,
          specialtyId: specialties[0].id,
        },
      },
      update: {},
      create: {
        therapistId: therapists[1].id,
        specialtyId: specialties[0].id,
        isPrimary: true,
      },
    }),

    // Fonoaudióloga - Fonoaudiología
    prisma.therapistSpecialty.upsert({
      where: {
        therapistId_specialtyId: {
          therapistId: therapists[2].id,
          specialtyId: specialties[1].id,
        },
      },
      update: {},
      create: {
        therapistId: therapists[2].id,
        specialtyId: specialties[1].id,
        isPrimary: true,
      },
    }),

    // Terapeuta Ocupacional
    prisma.therapistSpecialty.upsert({
      where: {
        therapistId_specialtyId: {
          therapistId: therapists[3].id,
          specialtyId: specialties[2].id,
        },
      },
      update: {},
      create: {
        therapistId: therapists[3].id,
        specialtyId: specialties[2].id,
        isPrimary: true,
      },
    }),
  ])

  // Create therapist schedules
  await Promise.all([
    // Coordinator - Monday to Friday, 8:00-17:00
    ...['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].map(day =>
      prisma.therapistSchedule.upsert({
        where: {
          therapistId_dayOfWeek: {
            therapistId: therapists[0].id,
            dayOfWeek: day as any,
          },
        },
        update: {},
        create: {
          therapistId: therapists[0].id,
          dayOfWeek: day as any,
          startTime: '08:00',
          endTime: '17:00',
          breakStart: '12:00',
          breakEnd: '13:00',
          breakBetweenSessions: 15,
          isActive: true,
        },
      })
    ),

    // Psicóloga - Monday to Thursday, 9:00-16:00
    ...['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'].map(day =>
      prisma.therapistSchedule.upsert({
        where: {
          therapistId_dayOfWeek: {
            therapistId: therapists[1].id,
            dayOfWeek: day as any,
          },
        },
        update: {},
        create: {
          therapistId: therapists[1].id,
          dayOfWeek: day as any,
          startTime: '09:00',
          endTime: '16:00',
          breakStart: '12:30',
          breakEnd: '13:30',
          breakBetweenSessions: 10,
          isActive: true,
        },
      })
    ),

    // Fonoaudióloga - Tuesday to Friday, 8:30-15:30
    ...['TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].map(day =>
      prisma.therapistSchedule.upsert({
        where: {
          therapistId_dayOfWeek: {
            therapistId: therapists[2].id,
            dayOfWeek: day as any,
          },
        },
        update: {},
        create: {
          therapistId: therapists[2].id,
          dayOfWeek: day as any,
          startTime: '08:30',
          endTime: '15:30',
          breakStart: '12:00',
          breakEnd: '13:00',
          breakBetweenSessions: 15,
          isActive: true,
        },
      })
    ),

    // Terapeuta Ocupacional - Monday to Friday, 10:00-18:00
    ...['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].map(day =>
      prisma.therapistSchedule.upsert({
        where: {
          therapistId_dayOfWeek: {
            therapistId: therapists[3].id,
            dayOfWeek: day as any,
          },
        },
        update: {},
        create: {
          therapistId: therapists[3].id,
          dayOfWeek: day as any,
          startTime: '10:00',
          endTime: '18:00',
          breakStart: '13:00',
          breakEnd: '14:00',
          breakBetweenSessions: 10,
          isActive: true,
        },
      })
    ),
  ])

  console.log('✅ Created therapist schedules')

  console.log('🎉 Seed data creation completed successfully!')
  console.log(`
📊 Summary:
- ${specialties.length} specialties created
- ${consultationReasons.length} consultation reasons created
- ${services.length} services created
- 1 super admin created
- 1 admin (secretary) created
- 4 therapists created (1 coordinator + 3 regular therapists)

🔐 Login Credentials (Default password for all: ${DEFAULT_PASSWORD}):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Super Admin:
    Email: superadmin@demo.com
    Password: ${DEFAULT_PASSWORD}
    Role: SUPER_ADMIN (Financial management, all users)
    
  Admin (Secretary):
    Email: admin@demo.com
    Password: ${DEFAULT_PASSWORD}
    Role: ADMIN (Payment confirmation, schedules, patient management)
    
  Coordinator (Super Therapist):
    Email: coordinador@demo.com
    Password: ${DEFAULT_PASSWORD}
    Role: COORDINATOR (Manages therapists, can also take sessions)
    
  Therapists:
    1. Email: psicologa@demo.com (Ana Rodríguez - Psicología Clínica)
       Password: ${DEFAULT_PASSWORD}
       Role: THERAPIST
    
    2. Email: fonoaudiologa@demo.com (Carmen Martínez - Fonoaudiología)
       Password: ${DEFAULT_PASSWORD}
       Role: THERAPIST
    
    3. Email: terapeuta@demo.com (Carlos López - Terapia Ocupacional)
       Password: ${DEFAULT_PASSWORD}
       Role: THERAPIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  IMPORTANT: Change these passwords after first login!
  `)
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
