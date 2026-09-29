'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { login } from '@/lib/api/resources/auth'
import { isApiError } from '@/types/api'

/**
 * Server Actions are the right place to set an httpOnly auth cookie — that
 * can't be done from client JS (by design: httpOnly cookies aren't visible
 * to `document.cookie` either, which is exactly what makes them safe from
 * XSS token theft).
 *
 * This throws on failure for simplicity. In a real app, wire this up with
 * `useActionState` instead so you can show the error inline rather than
 * hitting Next's default error boundary.
 */
export async function loginAction(formData: FormData) {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')

  const result = await login({ email, password })
  if (isApiError(result)) {
    throw new Error(result.message)
  }

  const store = await cookies()
  store.set('token', result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

  redirect('/')
}
