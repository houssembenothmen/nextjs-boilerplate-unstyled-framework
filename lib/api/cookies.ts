/**
 * Isomorphic cookie helpers — replaces `cookies-next` with zero dependencies.
 *
 * - On the client, reads/writes `document.cookie` directly.
 * - On the server, reads via `next/headers` `cookies()`. That import is loaded
 *   dynamically and only reached when `typeof window === 'undefined'`, so it
 *   never actually executes in client bundles (Next.js only complains about
 *   `next/headers` when it *runs* in a Client Component, not when the module
 *   is merely present in the graph behind an unreached dynamic import).
 *
 * Writing a cookie from the server only works inside a Server Action or Route
 * Handler (not during a Server Component render) — that's a Next.js
 * constraint, not one this file adds. See `lib/api/resources/auth.ts` for an
 * example that sets the cookie from a Server Action.
 */

const DEFAULT_TOKEN_COOKIE = 'token'

function readClientCookie(name: string): string | undefined {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1')}=([^;]*)`)
  )
  return match ? decodeURIComponent(match[1]) : undefined
}

/** Read a cookie's value, on either the client or the server. */
export async function getCookie(name: string = DEFAULT_TOKEN_COOKIE): Promise<string | undefined> {
  if (typeof window !== 'undefined') return readClientCookie(name)
  const { cookies } = await import('next/headers')
  const store = await cookies()
  return store.get(name)?.value
}

export interface SetCookieOptions {
  days?: number
  path?: string
  sameSite?: 'lax' | 'strict' | 'none'
  secure?: boolean
}

/** Client-only: set a cookie from a Client Component (e.g. after a client-side login call). */
export function setClientCookie(name: string, value: string, options: SetCookieOptions = {}) {
  if (typeof window === 'undefined') {
    throw new Error('setClientCookie() can only be called in the browser. Use a Server Action for server-side cookies.')
  }
  const { days = 7, path = '/', sameSite = 'lax', secure = process.env.NODE_ENV === 'production' } = options
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()
  document.cookie = [
    `${name}=${encodeURIComponent(value)}`,
    `expires=${expires}`,
    `path=${path}`,
    `SameSite=${sameSite}`,
    secure ? 'Secure' : '',
  ].filter(Boolean).join('; ')
}

/** Client-only: delete a cookie from a Client Component. */
export function deleteClientCookie(name: string, path: string = '/') {
  if (typeof window === 'undefined') {
    throw new Error('deleteClientCookie() can only be called in the browser. Use a Server Action for server-side cookies.')
  }
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`
}
