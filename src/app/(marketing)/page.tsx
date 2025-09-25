import { Hero } from '@/components/landing/hero'
import { Features } from '@/components/landing/features'

export default function HomePage() {
  return (
    <div className="flex flex-col items-center">
      <Hero />
      <Features />
    </div>
  )
}