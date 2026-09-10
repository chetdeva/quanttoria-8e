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
  title: 'Quanttoria | Personalized Learning for US Students',
  description:
    'Private, one-to-one online maths coaching for Grades 1-10. Help your child build understanding, analysis, problem-solving strategies and confidence across global maths curricula.',
  generator: 'v0.app',
  keywords: [
    'maths coaching for children',
    'one-to-one maths classes',
    'US Common Core maths',
    'AP maths support',
    'problem-solving strategies',
    'Quanttoria',
    'Pprincy Sugandhh',
  ],
  openGraph: {
    title: 'Quanttoria | Personalized Learning for US Students',
    description:
      'Patient, personalised maths coaching that helps children move from confusion to understanding and confidence.',
    type: 'website',
  },
  icons: {
    icon: [{ url: '/icon.png', type: 'image/png' }],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#FFEE8C',
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
