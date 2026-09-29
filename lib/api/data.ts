import { API_BASE_URL } from './config'
import { getCookie } from './cookies'
import type { ApiResult } from '@/types/api'

/**
 * Dependency-free replacement for the axios + cookies-next version of this
 * file. Same call shape (`get(endpoint, params)`, `post(endpoint, params)`,
 * ...), same "never throws, returns `{ error, message }`" contract — just
 * built on the platform `fetch` instead of axios, and on the isomorphic
 * `getCookie()` instead of `cookies-next`.
 *
 * Bonus of using `fetch`: it plugs directly into Next.js's own data cache.
 * Pass `next: { revalidate, tags }` or `cache: 'no-store'` in `params` to
 * control that per-call; GET requests default to `revalidate: 60` (the old
 * `Cache-Control: max-age=60` header didn't actually do anything useful for
 * a client that's usually running server-side or hitting a third-party API
 * that ignores it — Next's own cache is the real equivalent).
 */

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

/** Recognized meta keys in `params` that configure the request itself rather than becoming query/body data. */
interface RequestMeta {
  /** Explicit bearer token. Overrides the auto-detected cookie, same as the original `params.token`. */
  token?: string
  /** Extra / overriding headers. */
  headers?: Record<string, string>
  /** Standard fetch cache mode, e.g. 'no-store' to always bypass the cache. */
  cache?: RequestCache
  /** Next.js's fetch extension: { revalidate, tags }. */
  next?: NextFetchRequestConfig
  /** AbortSignal, for cancellable requests. */
  signal?: AbortSignal
}

type Params = Record<string, unknown> & RequestMeta

function buildUrl(endpoint: string, query?: Record<string, unknown>) {
  const url = new URL(endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue
      if (Array.isArray(value)) value.forEach((item) => url.searchParams.append(key, String(item)))
      else url.searchParams.append(key, String(value))
    }
  }
  return url.toString()
}

async function extractErrorMessage(res: Response, data: unknown): Promise<string> {
  if (data && typeof data === 'object' && 'message' in data && typeof (data as any).message === 'string') {
    return (data as any).message
  }
  return res.statusText || `Request failed with status ${res.status}`
}

async function request<T>(method: HttpMethod, endpoint: string, params: Params = {}): Promise<ApiResult<T>> {
  const { token: explicitToken, headers: extraHeaders, cache, next, signal, ...rest } = params
  const hasBody = method === 'POST' || method === 'PATCH'

  try {
    // Building the URL can throw (e.g. NEXT_PUBLIC_API isn't set, so the
    // endpoint isn't a valid absolute URL) — that needs to land in the same
    // catch block as network errors, not escape as an unhandled exception.
    const url = hasBody ? buildUrl(endpoint) : buildUrl(endpoint, rest)
    const token = explicitToken || (await getCookie())
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extraHeaders,
    }

    const res = await fetch(url, {
      method,
      headers,
      body: hasBody ? JSON.stringify(rest) : undefined,
      signal,
      cache,
      // Only set Next's `next` option when neither it nor a plain `cache` mode
      // was explicitly requested — the two are mutually exclusive on fetch.
      ...(next ?? (cache ? {} : method === 'GET' ? { next: { revalidate: 60 } } : {})),
    })

    const contentType = res.headers.get('content-type') ?? ''
    const data = contentType.includes('application/json')
      ? await res.json().catch(() => null)
      : await res.text()

    if (!res.ok) {
      return { error: true, status: res.status, message: await extractErrorMessage(res, data) }
    }
    return data as T
  } catch (err) {
    return { error: true, message: err instanceof Error ? err.message : 'Network error' }
  }
}

export function get<T = any>(endpoint: string, params: Params = {}) {
  return request<T>('GET', endpoint, params)
}
export function post<T = any>(endpoint: string, params: Params = {}) {
  return request<T>('POST', endpoint, params)
}
export function patch<T = any>(endpoint: string, params: Params = {}) {
  return request<T>('PATCH', endpoint, params)
}
export function remove<T = any>(endpoint: string, params: Params = {}) {
  return request<T>('DELETE', endpoint, params)
}
