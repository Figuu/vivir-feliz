# Essential Commands for Development

## Package Management & Development
```bash
npm run dev          # Start development server (with Turbopack)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Database Commands (Prisma)
```bash
npx prisma generate       # Generate Prisma client
npx prisma db push        # Push schema to database
npx prisma db pull        # Pull schema from database  
npx prisma studio         # Open Prisma Studio
npx prisma migrate dev    # Create and apply migration
npx prisma migrate reset  # Reset database
```

## Development Workflow
1. `npm run dev` - Start development
2. Make changes to code
3. `npm run lint` - Check for issues
4. `npm run build` - Verify production build
5. Git commit when ready

## System Utilities (macOS/Darwin)
- `ls -la` - List files with details
- `find . -name "*.tsx" -type f` - Find files
- `grep -r "pattern" src/` - Search in files
- `pbcopy < file.txt` - Copy file contents to clipboard

## Environment Setup
- Copy `.env.example` to `.env.local`
- Set up Supabase project and add credentials
- Run `npx prisma db push` to set up database