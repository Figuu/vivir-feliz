import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Shield, 
  Zap, 
  Database, 
  Palette, 
  Users, 
  BarChart3,
  Lock,
  Globe,
  Code
} from 'lucide-react'

const features = [
  {
    icon: <Shield className="h-10 w-10" />,
    title: 'Authentication',
    description: 'Complete auth system with Supabase. Sign up, login, password reset, and email verification out of the box.',
  },
  {
    icon: <Database className="h-10 w-10" />,
    title: 'Database Ready',
    description: 'PostgreSQL with Prisma ORM. Type-safe database operations with automatic migrations.',
  },
  {
    icon: <Palette className="h-10 w-10" />,
    title: 'Beautiful UI',
    description: 'shadcn/ui components with Tailwind CSS. Dark/light mode and responsive design included.',
  },
  {
    icon: <Zap className="h-10 w-10" />,
    title: 'Performance First',
    description: 'Next.js 15 with App Router. Server components, streaming, and optimized bundle sizes.',
  },
  {
    icon: <Users className="h-10 w-10" />,
    title: 'User Management',
    description: 'Complete user profiles, settings, and admin dashboard for managing your application.',
  },
  {
    icon: <BarChart3 className="h-10 w-10" />,
    title: 'Analytics Ready',
    description: 'Dashboard with charts and metrics. Ready to integrate with your favorite analytics provider.',
  },
  {
    icon: <Lock className="h-10 w-10" />,
    title: 'Security First',
    description: 'Row Level Security, input validation with Zod, and secure API routes by default.',
  },
  {
    icon: <Globe className="h-10 w-10" />,
    title: 'Production Ready',
    description: 'Optimized for deployment. Environment variables, error handling, and monitoring included.',
  },
  {
    icon: <Code className="h-10 w-10" />,
    title: 'Developer Experience',
    description: 'TypeScript, ESLint, Prettier, and comprehensive documentation. Everything you need to be productive.',
  },
]

export function Features() {
  return (
    <section id="features" className="w-full px-8 py-8 dark:bg-transparent md:py-12 lg:py-24">
      <div className="mx-auto max-w-[64rem]">
        <div className="flex flex-col items-center space-y-4 text-center mb-8">
          <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
            Everything you need
          </h2>
          <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            Stop spending weeks setting up your stack. Our template includes everything you need to build a modern web application.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={index} className="border-2 border-border">
              <CardHeader>
                <div className="mb-2 text-primary">{feature.icon}</div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}