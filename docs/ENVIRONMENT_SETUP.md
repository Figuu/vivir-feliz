# Environment Setup Guide

This guide explains how to configure the environment variables for the Vivir Feliz Therapy Center Management System.

## Quick Start

1. **Copy the environment template:**
   ```bash
   cp env.example .env
   ```

2. **Validate your configuration:**
   ```bash
   pnpm config:validate
   ```

3. **Start the development server:**
   ```bash
   pnpm dev
   ```

## Required Environment Variables

### Database Configuration
- `DATABASE_URL` - PostgreSQL connection string
- `DIRECT_URL` - Direct PostgreSQL connection (for migrations)

### Supabase Configuration
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

### Authentication
- `NEXTAUTH_SECRET` - Secret key for NextAuth.js (generate with `openssl rand -base64 32`)

### Email Service (Optional)
- `RESEND_API_KEY` - API key for Resend email service
- `FROM_EMAIL` - Default sender email address

## Environment-Specific Settings

### Development
```env
NODE_ENV=development
DEBUG=true
PRISMA_QUERY_LOG=true
LOG_LEVEL=debug
```

### Production
```env
NODE_ENV=production
DEBUG=false
PRISMA_QUERY_LOG=false
LOG_LEVEL=warn
FORCE_HTTPS=true
```

## Database Setup

### Using Supabase (Recommended)

1. Create a new Supabase project
2. Get your database credentials from the Supabase dashboard
3. Update your `.env` file:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?schema=public"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?schema=public"
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-ROLE-KEY]"
```

### Using Local PostgreSQL

1. Install PostgreSQL locally
2. Create a database named `vivir_feliz_db`
3. Update your `.env` file:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/vivir_feliz_db?schema=public"
DIRECT_URL="postgresql://username:password@localhost:5432/vivir_feliz_db?schema=public"
```

## Configuration Validation

The application includes a configuration validation script that checks:

- ✅ Required environment variables are present
- ✅ Database connection is working
- ✅ Database health and performance
- ✅ Configuration consistency

Run the validation:
```bash
pnpm config:validate
```

## Troubleshooting

### Common Issues

1. **Missing environment variables**
   - Ensure all required variables are set in your `.env` file
   - Check the `env.example` file for the complete list

2. **Database connection failed**
   - Verify your database credentials
   - Ensure the database server is running
   - Check network connectivity

3. **Supabase configuration issues**
   - Verify your project URL and keys
   - Ensure your Supabase project is active
   - Check API key permissions

### Debug Mode

Enable debug mode for detailed logging:
```env
DEBUG=true
PRISMA_QUERY_LOG=true
LOG_LEVEL=debug
```

### Health Checks

Check database health:
```bash
pnpm config:validate
```

This will show:
- Database connection status
- Query latency
- Configuration summary

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use strong secrets** for production environments
3. **Rotate API keys** regularly
4. **Use environment-specific configurations**
5. **Enable HTTPS** in production

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Use strong, unique secrets
3. Enable HTTPS and security headers
4. Configure proper CORS settings
5. Set up monitoring and logging
6. Configure backup strategies

## Support

If you encounter issues with environment setup:

1. Check the configuration validation output
2. Review the troubleshooting section
3. Verify your database and service credentials
4. Check the application logs for detailed error messages


