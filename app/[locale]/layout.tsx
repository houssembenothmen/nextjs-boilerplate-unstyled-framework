import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'

import { LanguageSwitcher } from '@/components/language-switcher'
import { Toaster } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Next.js 16 Boilerplate',
  description: 'Unstyled components + a dependency-free API client.',
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const messages = await getMessages({ locale })

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem 1.25rem 0' }}>
        <LanguageSwitcher />
      </div>
      {children}
      <Toaster position="bottom-end" />
    </NextIntlClientProvider>
  )
}
