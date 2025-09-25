# Code Style & Conventions

## Naming Conventions
- **Components**: PascalCase (`UserTable`, `LoginForm`)
- **Files**: kebab-case for components (`users-table.tsx`, `login-form.tsx`)
- **Variables/Functions**: camelCase (`getUserData`, `isLoading`)
- **Constants**: SCREAMING_SNAKE_CASE (`API_BASE_URL`)

## File Organization
```
src/
├── app/                 # Next.js App Router pages and API routes
│   ├── (auth)/         # Auth route group
│   ├── (dashboard)/    # Dashboard route group  
│   ├── (marketing)/    # Marketing pages route group
│   └── api/            # API endpoints
├── components/         # Reusable UI components
│   ├── ui/            # shadcn/ui base components
│   ├── auth/          # Authentication forms
│   ├── dashboard/     # Dashboard-specific components
│   └── providers/     # Context providers
├── lib/               # Utility functions and configurations
├── hooks/             # Custom React hooks
├── stores/            # Zustand state stores
└── types/             # TypeScript type definitions
```

## TypeScript Standards
- Strict mode enabled
- Explicit return types for functions
- Interface over type for object shapes
- Proper prop types for components

## Component Patterns
- Server Components by default
- 'use client' only when needed
- Props interfaces exported
- Default exports for components
- Named exports for utilities

## Styling
- Tailwind utility-first approach
- shadcn/ui for base components
- CSS variables for theming
- Responsive design mobile-first