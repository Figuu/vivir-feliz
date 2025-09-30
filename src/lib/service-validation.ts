import { z } from 'zod'

// Service code validation schema
export const serviceCodeSchema = z.string()
  .min(3, 'El código debe tener al menos 3 caracteres')
  .max(20, 'El código no puede exceder 20 caracteres')
  .regex(/^[A-Z0-9-]+$/, 'El código solo puede contener letras mayúsculas, números y guiones')
  .refine((code) => {
    // Check for common patterns
    const patterns = [
      /^EVAL-\d{3}$/, // EVAL-001, EVAL-002, etc.
      /^TREAT-\d{3}$/, // TREAT-001, TREAT-002, etc.
      /^CONSULT-\d{3}$/, // CONSULT-001, etc.
      /^FOLLOW-\d{3}$/, // FOLLOW-001, etc.
      /^ASSESS-\d{3}$/, // ASSESS-001, etc.
      /^[A-Z]{2,4}-\d{3}$/, // General pattern: 2-4 letters followed by 3 digits
    ]
    return patterns.some(pattern => pattern.test(code))
  }, 'El código debe seguir el formato: PREFIJO-### (ej: EVAL-001)')

// Pricing validation schema
export const pricingSchema = z.object({
  price: z.number()
    .min(0, 'El precio no puede ser negativo')
    .max(10000, 'El precio no puede exceder $10,000')
    .refine((price) => price % 0.01 === 0, 'El precio debe tener máximo 2 decimales'),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'MXN'], {
    message: 'Moneda no válida'
  }),
  discountPercentage: z.number()
    .min(0, 'El descuento no puede ser negativo')
    .max(100, 'El descuento no puede exceder 100%')
    .optional(),
  bulkPricing: z.object({
    minSessions: z.number().min(1, 'Mínimo 1 sesión').optional(),
    discountPercentage: z.number().min(0).max(100).optional()
  }).optional()
})

// Duration validation schema
export const durationSchema = z.object({
  duration: z.number()
    .min(15, 'La duración mínima es 15 minutos')
    .max(480, 'La duración máxima es 8 horas (480 minutos)')
    .refine((duration) => duration % 15 === 0, 'La duración debe ser múltiplo de 15 minutos'),
  setupTime: z.number()
    .min(0, 'El tiempo de preparación no puede ser negativo')
    .max(60, 'El tiempo de preparación no puede exceder 60 minutos')
    .optional(),
  cleanupTime: z.number()
    .min(0, 'El tiempo de limpieza no puede ser negativo')
    .max(30, 'El tiempo de limpieza no puede exceder 30 minutos')
    .optional()
})

// Age range validation schema
export const ageRangeSchema = z.object({
  minAge: z.number()
    .min(0, 'La edad mínima no puede ser negativa')
    .max(120, 'La edad máxima no puede exceder 120 años')
    .optional(),
  maxAge: z.number()
    .min(0, 'La edad máxima no puede ser negativa')
    .max(120, 'La edad máxima no puede exceder 120 años')
    .optional()
}).refine((data) => {
  if (data.minAge && data.maxAge) {
    return data.minAge <= data.maxAge
  }
  return true
}, 'La edad mínima debe ser menor o igual a la edad máxima')

// Session limits validation schema
export const sessionLimitsSchema = z.object({
  minSessions: z.number()
    .min(1, 'Mínimo 1 sesión')
    .max(100, 'Máximo 100 sesiones')
    .optional(),
  maxSessions: z.number()
    .min(1, 'Mínimo 1 sesión')
    .max(100, 'Máximo 100 sesiones')
    .optional(),
  recommendedSessions: z.number()
    .min(1, 'Mínimo 1 sesión recomendada')
    .max(100, 'Máximo 100 sesiones recomendadas')
    .optional()
}).refine((data) => {
  if (data.minSessions && data.maxSessions) {
    return data.minSessions <= data.maxSessions
  }
  return true
}, 'Las sesiones mínimas deben ser menores o iguales a las máximas')

// Complete service validation schema
export const serviceValidationSchema = z.object({
  // Basic information
  code: serviceCodeSchema,
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .regex(/^[a-zA-Z0-9\s\-áéíóúñüÁÉÍÓÚÑÜ]+$/, 'El nombre contiene caracteres no válidos'),
  description: z.string()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(1000, 'La descripción no puede exceder 1000 caracteres'),
  
  // Categorization
  categoryId: z.string().min(1, 'Debe seleccionar una categoría'),
  type: z.enum(['EVALUATION', 'TREATMENT', 'CONSULTATION', 'FOLLOW_UP', 'ASSESSMENT'], {
    message: 'Tipo de servicio no válido'
  }),
  
  // Pricing and duration
  ...pricingSchema.shape,
  ...durationSchema.shape,
  
  // Session configuration
  ...sessionLimitsSchema.shape,
  
  // Age restrictions
  ...ageRangeSchema.shape,
  
  // Prerequisites and outcomes
  prerequisites: z.array(z.string())
    .max(10, 'Máximo 10 prerrequisitos')
    .optional(),
  outcomes: z.array(z.string())
    .max(15, 'Máximo 15 resultados esperados')
    .optional(),
  
  // Tags and metadata
  tags: z.array(z.string())
    .max(20, 'Máximo 20 etiquetas')
    .refine((tags) => {
      return tags.every(tag => 
        tag.length >= 2 && 
        tag.length <= 30 && 
        /^[a-zA-Z0-9\s\-áéíóúñüÁÉÍÓÚÑÜ]+$/.test(tag)
      )
    }, 'Las etiquetas deben tener entre 2-30 caracteres y solo contener letras, números, espacios y guiones'),
  
  // Status and configuration
  isActive: z.boolean(),
  requiresApproval: z.boolean(),
  isRecurring: z.boolean().optional(),
  requiresSpecialist: z.boolean().optional(),
  
  // Availability
  availableDays: z.array(z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']))
    .min(1, 'Debe especificar al menos un día disponible')
    .optional(),
  availableHours: z.object({
    start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
    end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido')
  }).refine((data) => {
    const start = new Date(`2000-01-01T${data.start}:00`)
    const end = new Date(`2000-01-01T${data.end}:00`)
    return start < end
  }, 'La hora de inicio debe ser anterior a la hora de fin').optional(),
  
  // Capacity and resources
  maxConcurrentSessions: z.number()
    .min(1, 'Mínimo 1 sesión concurrente')
    .max(50, 'Máximo 50 sesiones concurrentes')
    .optional(),
  requiredResources: z.array(z.string())
    .max(10, 'Máximo 10 recursos requeridos')
    .optional(),
  
  // Compliance and documentation
  requiresConsent: z.boolean().optional(),
  requiresInsurance: z.boolean().optional(),
  documentationRequired: z.array(z.string())
    .max(5, 'Máximo 5 documentos requeridos')
    .optional(),
  
  // Quality metrics
  targetCompletionRate: z.number()
    .min(0, 'La tasa de finalización no puede ser negativa')
    .max(100, 'La tasa de finalización no puede exceder 100%')
    .optional(),
  averageRating: z.number()
    .min(1, 'La calificación mínima es 1')
    .max(5, 'La calificación máxima es 5')
    .optional()
})

// Category validation schema
export const categoryValidationSchema = z.object({
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .regex(/^[a-zA-Z0-9\s\-áéíóúñüÁÉÍÓÚÑÜ]+$/, 'El nombre contiene caracteres no válidos'),
  description: z.string()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(500, 'La descripción no puede exceder 500 caracteres'),
  icon: z.string()
    .max(20, 'El nombre del icono no puede exceder 20 caracteres')
    .optional(),
  color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'El color debe ser un código hexadecimal válido (ej: #3b82f6)'),
  isActive: z.boolean(),
  sortOrder: z.number()
    .min(0, 'El orden no puede ser negativo')
    .max(1000, 'El orden no puede exceder 1000')
})

// Validation functions
export const validateServiceCode = (code: string): { isValid: boolean; errors: string[] } => {
  try {
    serviceCodeSchema.parse(code)
    return { isValid: true, errors: [] }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, errors: error.issues.map(e => e.message) }
    }
    return { isValid: false, errors: ['Error de validación desconocido'] }
  }
}

export const validatePricing = (pricing: any): { isValid: boolean; errors: string[] } => {
  try {
    pricingSchema.parse(pricing)
    return { isValid: true, errors: [] }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, errors: error.issues.map(e => e.message) }
    }
    return { isValid: false, errors: ['Error de validación desconocido'] }
  }
}

export const validateDuration = (duration: any): { isValid: boolean; errors: string[] } => {
  try {
    durationSchema.parse(duration)
    return { isValid: true, errors: [] }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, errors: error.issues.map(e => e.message) }
    }
    return { isValid: false, errors: ['Error de validación desconocido'] }
  }
}

export const validateService = (service: any): { isValid: boolean; errors: string[] } => {
  try {
    serviceValidationSchema.parse(service)
    return { isValid: true, errors: [] }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, errors: error.issues.map(e => e.message) }
    }
    return { isValid: false, errors: ['Error de validación desconocido'] }
  }
}

export const validateCategory = (category: any): { isValid: boolean; errors: string[] } => {
  try {
    categoryValidationSchema.parse(category)
    return { isValid: true, errors: [] }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, errors: error.issues.map(e => e.message) }
    }
    return { isValid: false, errors: ['Error de validación desconocido'] }
  }
}

// Utility functions for common validations
export const generateServiceCode = (type: string, existingCodes: string[]): string => {
  const prefixes = {
    'EVALUATION': 'EVAL',
    'TREATMENT': 'TREAT',
    'CONSULTATION': 'CONSULT',
    'FOLLOW_UP': 'FOLLOW',
    'ASSESSMENT': 'ASSESS'
  }
  
  const prefix = prefixes[type as keyof typeof prefixes] || 'SERV'
  let counter = 1
  
  while (true) {
    const code = `${prefix}-${counter.toString().padStart(3, '0')}`
    if (!existingCodes.includes(code)) {
      return code
    }
    counter++
  }
}

export const validateServiceCodeUniqueness = (code: string, existingCodes: string[]): boolean => {
  return !existingCodes.includes(code)
}

export const validatePriceRange = (price: number, currency: string): { isValid: boolean; message?: string } => {
  const ranges = {
    'USD': { min: 0, max: 10000 },
    'EUR': { min: 0, max: 8500 },
    'GBP': { min: 0, max: 7500 },
    'CAD': { min: 0, max: 13000 },
    'MXN': { min: 0, max: 200000 }
  }
  
  const range = ranges[currency as keyof typeof ranges]
  if (!range) {
    return { isValid: false, message: 'Moneda no válida' }
  }
  
  if (price < range.min) {
    return { isValid: false, message: `El precio mínimo es ${range.min} ${currency}` }
  }
  
  if (price > range.max) {
    return { isValid: false, message: `El precio máximo es ${range.max} ${currency}` }
  }
  
  return { isValid: true }
}

export const validateDurationConstraints = (duration: number, type: string): { isValid: boolean; message?: string } => {
  const constraints = {
    'EVALUATION': { min: 30, max: 180 },
    'TREATMENT': { min: 45, max: 120 },
    'CONSULTATION': { min: 15, max: 60 },
    'FOLLOW_UP': { min: 15, max: 45 },
    'ASSESSMENT': { min: 60, max: 240 }
  }
  
  const constraint = constraints[type as keyof typeof constraints]
  if (!constraint) {
    return { isValid: true } // No specific constraints
  }
  
  if (duration < constraint.min) {
    return { isValid: false, message: `La duración mínima para ${type} es ${constraint.min} minutos` }
  }
  
  if (duration > constraint.max) {
    return { isValid: false, message: `La duración máxima para ${type} es ${constraint.max} minutos` }
  }
  
  return { isValid: true }
}

// Export types for TypeScript
export type ServiceValidationInput = z.infer<typeof serviceValidationSchema>
export type CategoryValidationInput = z.infer<typeof categoryValidationSchema>
export type PricingValidationInput = z.infer<typeof pricingSchema>
export type DurationValidationInput = z.infer<typeof durationSchema>
export type AgeRangeValidationInput = z.infer<typeof ageRangeSchema>
export type SessionLimitsValidationInput = z.infer<typeof sessionLimitsSchema>
