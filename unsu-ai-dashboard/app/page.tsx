import { SiteNav } from '@/components/site-nav'
import { Hero } from '@/components/hero'
import { LogoStrip } from '@/components/logo-strip'
import { Features } from '@/components/features'
import { HowItWorks } from '@/components/how-it-works'
import { ReportPreview } from '@/components/report-preview'
import { Testimonial } from '@/components/testimonial'
import { Pricing } from '@/components/pricing'
import { SiteFooter } from '@/components/site-footer'

export default function Page() {
  return (
    <main className="min-h-dvh bg-background">
      <SiteNav />
      <Hero />
      <LogoStrip />
      <Features />
      <HowItWorks />
      <ReportPreview />
      <Testimonial />
      <Pricing />
      <SiteFooter />
    </main>
  )
}
