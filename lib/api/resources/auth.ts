import { get, post } from '../data'

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: { id: string; name: string; email: string }
}

export function login(payload: LoginPayload) {
  // Spread into a fresh object literal: TS only allows an interface value to
  // satisfy `Record<string, unknown>` when it's passed as a literal, not a
  // pre-typed variable.
  return post<LoginResponse>('/auth/login', { ...payload })
}

export function getMe(params: Record<string, unknown> = {}) {
  return get<LoginResponse['user']>('/auth/me', { ...params, next: { revalidate: 0 } })
}

export function logout(params: Record<string, unknown> = {}) {
  return post<{ success: true }>('/auth/logout', params)
}
