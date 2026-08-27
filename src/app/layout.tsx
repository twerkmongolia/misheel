import type { Metadata } from 'next'
import { Manrope, Unbounded } from 'next/font/google'
import './globals.css'

// Кирилл үсэгтэй, тод дүрстэй — студийн шөнийн уур амьсгалд тохирно.
const display = Unbounded({
  variable: '--font-display',
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  weight: ['500', '700'],
})

const body = Manrope({
  variable: '--font-body',
  subsets: ['latin', 'latin-ext', 'cyrillic'],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Twerk Mongolia',
    template: '%s · Twerk Mongolia',
  },
  description: 'Улаанбаатар дахь twerk бүжгийн студи — хичээлийн хуваарь, бүртгэл, дэлгүүр.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="mn" className={`${display.variable} ${body.variable} h-full`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
