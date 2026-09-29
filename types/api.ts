/** Shared shape returned by every API helper. Check `"error" in result` to narrow. */
export interface ApiErrorResult {
  error: true
  status?: number
  message: string
}

export type ApiResult<T> = T | ApiErrorResult

export function isApiError<T>(result: ApiResult<T>): result is ApiErrorResult {
  return typeof result === 'object' && result !== null && 'error' in result && (result as { error: unknown }).error === true
}
