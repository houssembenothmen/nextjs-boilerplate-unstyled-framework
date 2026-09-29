'use client'

import * as React from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'

import { locales, type Locale } from '@/lib/i18n'

export function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale() as Locale
  const t = useTranslations('common')

  const handleLocaleChange = (nextLocale: Locale) => {
    const segments = (pathname ?? '/').split('/').filter(Boolean)
    const cleanSegments = segments.filter((segment) => !locales.includes(segment as Locale))
    const nextPath = `/${nextLocale}${cleanSegments.length ? `/${cleanSegments.join('/')}` : ''}`

    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
    router.push(nextPath)
  }

  return (
    <div className="locale-switcher" aria-label={t('language')}>
      <span className="locale-switcher__label">{t('language')}</span>
      <div className="locale-switcher__buttons">
        {locales.map((item) => (
          <button
            key={item}
            type="button"
            className="locale-switcher__button"
            aria-pressed={locale === item}
            onClick={() => handleLocaleChange(item)}
          >
            {item === 'en' ? t('english') : t('french')}
          </button>
        ))}
      </div>
    </div>
  )
}
