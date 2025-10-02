import { PrismaClient } from '@prisma/client'
import { dbConfig, appConfig } from './config'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Configure Prisma client with environment-specific settings
const prismaConfig: any = {}

// Enable query logging in development or when explicitly enabled
if (appConfig.debug || dbConfig.queryLog) {
  prismaConfig.log = ['query', 'info', 'warn', 'error']
}

// Add error formatting for better debugging
if (appConfig.debug) {
  prismaConfig.errorFormat = 'pretty'
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(prismaConfig)

// Prevent multiple instances in development
if (appConfig.environment !== 'production') {
  globalForPrisma.prisma = prisma
}

// Export with more convenient name
export const db = prisma

// Database connection health check
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect()
    console.log('✅ Database connected successfully')
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    throw error
  }
}

// Graceful database disconnection
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect()
    console.log('✅ Database disconnected successfully')
  } catch (error) {
    console.error('❌ Database disconnection failed:', error)
    throw error
  }
}

// Database transaction helper
export async function withTransaction<T>(
  callback: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(callback)
}

// Database health check
export async function checkDatabaseHealth(): Promise<{
  isHealthy: boolean
  latency?: number
  error?: string
}> {
  const startTime = Date.now()
  
  try {
    await prisma.$queryRaw`SELECT 1`
    const latency = Date.now() - startTime
    
    return {
      isHealthy: true,
      latency,
    }
  } catch (error) {
    return {
      isHealthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}