import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Baloo_2, Nunito } from 'next/font/google'
import './globals.css'

const baloo = Baloo_2({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-baloo',
})

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-nunito',
})

export const metadata: Metadata = {
  title: 'Quanttoria | Online Math Tutoring for Grades 1-8',
  description:
    'Live, one-to-one online math classes for kids in grades 1-8. Visual, Vedic and global math methods with 9000+ hours of teaching experience. Olympiad, SAT and NAPLAN preparation. Book a free trial.',
  generator: 'v0.app',
  keywords: [
    'online math tutor',
    'math classes for kids',
    'Math Olympiad preparation',
    'NAPLAN math',
    'Vedic math',
    'Quanttoria',
    'Princy Sugandh',
  ],
  openGraph: {
    title: 'Quanttoria | Unlock the World of Math Excellence',
    description:
      'Live online math classes that turn number-fear into confidence. 9000+ hours of teaching experience. Book a free trial.',
    type: 'website',
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#3b5bdb',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${baloo.variable} ${nunito.variable} bg-background`}>
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
