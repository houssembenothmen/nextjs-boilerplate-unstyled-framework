import { getTranslations } from 'next-intl/server'

import { getSuggestions } from '@/lib/api/resources/suggestions'
import { isApiError } from '@/types/api'
import { ComponentsShowcase } from '../showcase'

export default async function LocalePage() {
  const suggestions = await getSuggestions({ limit: 5 })
  const t = await getTranslations('home')

  return (
    <main data-page>
      <section data-hero>
        <h1>{t('title')}</h1>
        <p>{t('subtitle')}</p>
      </section>

      <section data-section>
        <h2>{t('serverData')}</h2>
        <p data-note>
          {t('apiHint')} — this block runs in a Server Component and calls{' '}
          <code>getSuggestions()</code> directly from the API layer with no client JS involved.
        </p>
        {isApiError(suggestions) ? (
          <p data-note data-error>
            Couldn&apos;t reach the API ({suggestions.message}). That&apos;s expected until you set{' '}
            <code>NEXT_PUBLIC_API</code> in <code>.env.local</code> — this is the error shape every
            call returns instead of throwing, so you can branch on it like this.
          </p>
        ) : (
          <pre data-code-block>{JSON.stringify(suggestions, null, 2)}</pre>
        )}
      </section>

      <ComponentsShowcase />
    </main>
  )
}
