import { SiteHeader } from '@/components/site-header'
import { Hero } from '@/components/hero'
import { WhyQuanttoria } from '@/components/why-quanttoria'
import { Approach } from '@/components/approach'
import { MeetTutor } from '@/components/meet-tutor'
import { Testimonials } from '@/components/testimonials'
import { Contact } from '@/components/contact'
import { SiteFooter } from '@/components/site-footer'
import { DemoDialog } from '@/components/demo-dialog'

export default function Page() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <WhyQuanttoria />
        <Approach />
        <MeetTutor />
        <Testimonials />
        <Contact />
      </main>
      <SiteFooter />
      <DemoDialog />
    </>
  )
}
