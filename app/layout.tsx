import type { Metadata } from 'next'
import './globals.scss'

export const metadata: Metadata = {
  title: 'Next.js 16 Boilerplate',
  description: 'Unstyled components + a dependency-free API client.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
