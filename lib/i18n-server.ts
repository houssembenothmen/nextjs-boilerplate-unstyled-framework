import { cookies } from 'next/headers'

import { defaultLocale, isLocale, type Locale } from '@/lib/i18n'

export async function getLocaleFromRequest(): Promise<Locale> {
  const cookieStore = await cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value
  return isLocale(locale) ? locale : defaultLocale
}

export async function getMessagesForLocale(locale: Locale) {
  const mod = await import(`../messages/${locale}.json`)
  return mod.default as Record<string, unknown>
}
