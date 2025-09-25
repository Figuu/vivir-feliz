import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'
import { FadeTransition } from '@/components/ui/page-transition'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1">
        <FadeTransition>
          {children}
        </FadeTransition>
      </main>
      <Footer />
    </div>
  )
}