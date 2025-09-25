# Boring Skale Next - Full-Stack SaaS Template

A modern, full-stack SaaS template built with Next.js 15, Supabase, Prisma, and TypeScript.

## Features

- 🔐 **Authentication & Authorization** - Supabase Auth with role-based permissions
- 👥 **User Management** - Complete admin panel with user CRUD operations
- 📊 **Dashboard & Analytics** - Charts, KPIs, and data visualization
- 🔍 **Global Search** - Cmd+K search functionality
- 📱 **Responsive Design** - Mobile-first UI with shadcn/ui components
- 🔒 **Row Level Security** - Database-level security policies
- 🎯 **Type Safety** - End-to-end TypeScript with Prisma ORM

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (private buckets)
- **UI**: Tailwind CSS + shadcn/ui
- **State Management**: TanStack Query + Zustand
- **Validation**: Zod schemas
- **Forms**: React Hook Form

## Quick Start

### 1. Environment Setup

Copy the example environment file and configure your variables:

```bash
cp .env.example .env
```

Fill in your Supabase credentials and database URL in `.env`.

### 2. Database Setup

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Seed the database (optional)
npx prisma db seed
```

### 3. Supabase Configuration

#### Storage Buckets
1. Go to your Supabase dashboard → **Storage** → **Buckets**
2. Create two private buckets:
   - `files` (10MB limit)
   - `avatars` (5MB limit, images only)

#### Row Level Security Policies
Run the SQL policies from the `supabase/policies/` directory:

1. Open Supabase **SQL Editor**
2. Run `supabase/policies/storage.sql`

See [supabase/policies/README.md](./supabase/policies/README.md) for detailed instructions.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (dashboard)/       # Dashboard pages
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   └── dashboard/        # Dashboard-specific components
│   ├── lib/                  # Utility libraries
│   │   ├── supabase/        # Supabase client configuration
│   │   ├── validations/     # Zod schemas
│   │   └── permissions/     # Role-based permissions
│   └── hooks/               # Custom React hooks
├── supabase/
│   └── policies/            # SQL policies for RLS
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts             # Database seeding
└── .env.example            # Environment variables template
```

## User Roles & Permissions

- **USER**: Basic access to personal dashboard and profile
- **ADMIN**: User management capabilities
- **SUPER_ADMIN**: Full access including all files and admin functions

## File Storage

The application uses Supabase Storage with private buckets:

- **avatars**: User profile pictures (5MB limit)
- **files**: General file uploads (10MB limit)

Files are secured with:
- Row Level Security policies
- Signed URLs with expiration
- User-specific access controls
- Admin override for SUPER_ADMIN

## API Routes

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout

### User Management
- `GET /api/user` - Get current user
- `PATCH /api/user` - Update user profile
- `POST /api/user/change-password` - Change password

### Admin (ADMIN/SUPER_ADMIN only)
- `GET /api/admin/users` - List all users
- `POST /api/admin/users/create` - Create user
- `PATCH /api/admin/users/[id]` - Update user
- `DELETE /api/admin/users/[id]` - Delete user
- `GET /api/admin/files` - List all files (SUPER_ADMIN only)

### File Upload
- `POST /api/upload/avatar` - Upload avatar
- `POST /api/upload` - Upload file
- `POST /api/user/refresh-avatar` - Refresh avatar URL

## Development

### Database Changes

When modifying the database schema:

1. Update `prisma/schema.prisma`
2. Generate migration: `npx prisma db push`
3. Update corresponding RLS policies if needed

### Adding New Policies

1. Create/update SQL files in `supabase/policies/`
2. Run the SQL in Supabase dashboard
3. Update the policies README with documentation

## Security Features

- **Row Level Security**: Database-level access control
- **Private Storage**: Files accessible only via signed URLs  
- **Role-based Permissions**: Granular access control system
- **Input Validation**: Zod schemas for all forms and API routes
- **CSRF Protection**: Built-in Next.js protections
- **Password Security**: Supabase Auth handles hashing and validation

## Deployment

### Vercel Deployment

1. Fork/clone this repository
2. Connect to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Environment Variables Required

See `.env.example` for a complete list of required environment variables.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable  
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.
