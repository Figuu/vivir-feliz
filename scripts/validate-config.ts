#!/usr/bin/env tsx

/**
 * Configuration Validation Script
 * Validates environment variables and database connection
 */

import { validateConfiguration, checkDatabaseConnection } from '../src/lib/config'
import { checkDatabaseHealth } from '../src/lib/db'

async function main() {
  console.log('🔧 Validating Vivir Feliz configuration...\n')

  try {
    // 1. Validate environment variables
    console.log('1️⃣ Validating environment variables...')
    validateConfiguration()
    console.log('✅ Environment variables are valid\n')

    // 2. Test database connection
    console.log('2️⃣ Testing database connection...')
    const isConnected = await checkDatabaseConnection()
    if (!isConnected) {
      throw new Error('Database connection failed')
    }
    console.log('✅ Database connection successful\n')

    // 3. Check database health
    console.log('3️⃣ Checking database health...')
    const health = await checkDatabaseHealth()
    if (!health.isHealthy) {
      throw new Error(`Database health check failed: ${health.error}`)
    }
    console.log(`✅ Database is healthy (latency: ${health.latency}ms)\n`)

    // 4. Display configuration summary
    console.log('📊 Configuration Summary:')
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`)
    console.log(`   Database URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}`)
    console.log(`   Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}`)
    console.log(`   NextAuth Secret: ${process.env.NEXTAUTH_SECRET ? '✅ Set' : '❌ Missing'}`)
    console.log(`   Email API Key: ${process.env.RESEND_API_KEY ? '✅ Set' : '❌ Missing'}`)

    console.log('\n🎉 Configuration validation completed successfully!')
    console.log('🚀 Your application is ready to run.')

  } catch (error) {
    console.error('\n❌ Configuration validation failed:')
    console.error(error instanceof Error ? error.message : error)
    console.error('\n💡 Please check your .env file and ensure all required variables are set.')
    console.error('📖 Refer to env.example for the complete list of required variables.')
    process.exit(1)
  }
}

main()
