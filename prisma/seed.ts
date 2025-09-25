import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

  // ========== SUPER ADMIN USER ==========
  console.log('Creating super admin user...')
  
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@vivirfeliz.com' },
    update: {},
    create: {
      email: 'admin@vivirfeliz.com',
      name: 'Administrador del Sistema',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  })

  console.log('✅ Created super admin user')

  // ========== SAMPLE ADMIN USER ==========
  console.log('Creating sample admin user...')
  
  const admin = await prisma.user.upsert({
    where: { email: 'coordinador@vivirfeliz.com' },
    update: {},
    create: {
      email: 'coordinador@vivirfeliz.com',
      name: 'Coordinador General',
      role: 'ADMIN',
      isActive: true,
    },
  })

  console.log('✅ Created sample admin user')

  // ========== SAMPLE THERAPIST USERS ==========
  console.log('Creating sample therapist users...')
  
  const therapistUsers = await Promise.all([
    prisma.user.upsert({
      where: { email: 'psicologa@vivirfeliz.com' },
      update: {},
      create: {
        email: 'psicologa@vivirfeliz.com',
        name: 'Dra. María González',
        role: 'THERAPIST',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'fonoaudiologa@vivirfeliz.com' },
      update: {},
      create: {
        email: 'fonoaudiologa@vivirfeliz.com',
        name: 'Lic. Ana Rodríguez',
        role: 'THERAPIST',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'terapeuta@vivirfeliz.com' },
      update: {},
      create: {
        email: 'terapeuta@vivirfeliz.com',
        name: 'Lic. Carlos López',
        role: 'THERAPIST',
        isActive: true,
      },
    }),
  ])

  // Create therapist profiles
  const therapists = await Promise.all([
    prisma.therapist.upsert({
      where: { userId: therapistUsers[0].id },
      update: {},
      create: {
        userId: therapistUsers[0].id,
        firstName: 'María',
        lastName: 'González',
        phone: '+54 11 1234-5678',
        licenseNumber: 'PSI-12345',
        isCoordinator: true,
        canTakeConsultations: true,
        isActive: true,
      },
    }),
    prisma.therapist.upsert({
      where: { userId: therapistUsers[1].id },
      update: {},
      create: {
        userId: therapistUsers[1].id,
        firstName: 'Ana',
        lastName: 'Rodríguez',
        phone: '+54 11 2345-6789',
        licenseNumber: 'FONO-67890',
        isCoordinator: false,
        canTakeConsultations: true,
        isActive: true,
      },
    }),
    prisma.therapist.upsert({
      where: { userId: therapistUsers[2].id },
      update: {},
      create: {
        userId: therapistUsers[2].id,
        firstName: 'Carlos',
        lastName: 'López',
        phone: '+54 11 3456-7890',
        licenseNumber: 'TO-54321',
        isCoordinator: false,
        canTakeConsultations: true,
        isActive: true,
      },
    }),
  ])

  // Assign specialties to therapists
  await Promise.all([
    // María González - Psicología Clínica (Coordinator)
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

    // Ana Rodríguez - Fonoaudiología
    prisma.therapistSpecialty.upsert({
      where: {
        therapistId_specialtyId: {
          therapistId: therapists[1].id,
          specialtyId: specialties[1].id,
        },
      },
      update: {},
      create: {
        therapistId: therapists[1].id,
        specialtyId: specialties[1].id,
        isPrimary: true,
      },
    }),

    // Carlos López - Terapia Ocupacional
    prisma.therapistSpecialty.upsert({
      where: {
        therapistId_specialtyId: {
          therapistId: therapists[2].id,
          specialtyId: specialties[2].id,
        },
      },
      update: {},
      create: {
        therapistId: therapists[2].id,
        specialtyId: specialties[2].id,
        isPrimary: true,
      },
    }),
  ])

  // Create therapist schedules
  await Promise.all([
    // María González - Monday to Friday, 8:00-17:00
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

    // Ana Rodríguez - Monday to Thursday, 9:00-16:00
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

    // Carlos López - Tuesday to Friday, 8:30-15:30
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
  ])

  console.log('✅ Created sample therapist users with schedules')

  console.log('🎉 Seed data creation completed successfully!')
  console.log(`
📊 Summary:
- ${specialties.length} specialties created
- ${consultationReasons.length} consultation reasons created
- ${services.length} services created
- 1 super admin user created
- 1 admin user created
- 3 therapist users created with schedules and specialties
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
