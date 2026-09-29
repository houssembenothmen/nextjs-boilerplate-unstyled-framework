import { post } from '../data'
import { isApiError } from '../../../types/api'

export interface CountryApiResponse {
  code?: string
  name?: string
  emoji?: string
}

export interface CountryOption {
  value: string
  label: string
}

export function getCountries(query: string): Promise<CountryOption[]> {
  const term = query.trim()

  if (!term) return Promise.resolve([])

  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const nameRegex = `.*${escaped}.*`

  return post<{ data?: { countries?: CountryApiResponse[] } }>('https://countries.trevorblades.com/', {
    query: `{ countries(filter: { name: { regex: "${nameRegex}" } }) { code name emoji } }`,
  }).then((result) => {
    if (isApiError(result) || !result || !result.data || !Array.isArray(result.data.countries)) {
      return []
    }

    return result.data.countries
      .flatMap((row: CountryApiResponse) => {
        const name = typeof row?.name === 'string' ? row.name : null
        const code = typeof row?.code === 'string' ? row.code : null

        if (!name || !code) return []

        return [{ code, name, emoji: typeof row.emoji === 'string' ? row.emoji : undefined }]
      })
      .sort((a: { code: string; name: string; emoji?: string }, b: { code: string; name: string; emoji?: string }) => a.name.localeCompare(b.name))
      .map((country: { code: string; name: string; emoji?: string }) => ({
        value: country.code,
        label: country.emoji ? `${country.emoji} ${country.name}` : country.name,
      }))
  })
}
