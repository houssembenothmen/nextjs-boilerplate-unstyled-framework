const base = process.env.NEXT_PUBLIC_API

if (!base && process.env.NODE_ENV !== 'production') {
  // Not thrown, just a loud reminder during local dev — every request would
  // otherwise silently go to a relative path.
  console.warn('[api] NEXT_PUBLIC_API is not set. Copy .env.example to .env.local and set it.')
}

export const API_BASE_URL = base ?? ''
