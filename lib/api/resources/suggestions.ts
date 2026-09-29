import { get, post } from '../data'

/**
 * Resource files stay this thin: one line per endpoint, `get`/`post`/`patch`/
 * `remove` handle everything else (base URL, auth header, caching, error
 * shape). This mirrors the original snippet's structure exactly.
 */

export function getSuggestions(params: Record<string, unknown> = {}) {
  return get<Record<string, unknown>>('/suggestion', params)
}

export function getSuggestion(id: string, params: Record<string, unknown> = {}) {
  return get<Record<string, unknown>>(`/suggestion/${id}`, params)
}

export function postSuggestion(params: Record<string, unknown>) {
  return post<Record<string, unknown>>('/suggestion', params)
}
