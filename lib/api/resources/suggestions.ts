import { get, post } from '../data'

/**
 * Resource files stay this thin: one line per endpoint, `get`/`post`/`patch`/
 * `remove` handle everything else (base URL, auth header, caching, error
 * shape). This mirrors the original snippet's structure exactly.
 */

export function getSuggestions(params: any = {}) {
  return get<any>('/suggestion', params)
}

export function getSuggestion(id: string, params: any = {}) {
  return get<any>(`/suggestion/${id}`, params)
}

export function postSuggestion(params: any) {
  return post<any>('/suggestion', params)
}
