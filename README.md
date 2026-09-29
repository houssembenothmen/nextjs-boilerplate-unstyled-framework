# Next.js 16 boilerplate

App Router, zero runtime dependencies beyond `next`/`react`/`react-dom`, a dependency-free
`fetch`-based API client, and a full unstyled component library.

## Structure

```
app/                        Routes only
  layout.tsx                 Root layout — mounts <Toaster/> globally
  page.tsx                   Home: server-side data fetch + component showcase
  showcase.tsx                Client Component: interactive component demos
  globals.css                 Demo-only CSS, keyed off data-* attributes
  (auth)/login/
    page.tsx                  Form wired to a Server Action
    actions.ts                'use server' — calls the API, sets an httpOnly cookie

components/ui/               The component library (foundation, actions, forms,
                              overlays, feedback, navigation, data-display, date,
                              dnd, access, icon, hooks, nextjs, utils) — copy this
                              folder into any project, it has no dependency on the
                              rest of this repo.

lib/
  api/
    config.ts                 Reads NEXT_PUBLIC_API
    cookies.ts                 Isomorphic getCookie() + client-only set/delete
    data.ts                    get / post / patch / remove — the fetch replacement
                                for axios + cookies-next
    resources/
      suggestions.ts            Example resource file (mirrors the original pattern)
      auth.ts                   login / getMe / logout
  utils/cn.ts                 Tiny classname combiner (no clsx dependency)

types/api.ts                 ApiResult<T> / isApiError() — shared across the app
.env.example                 Copy to .env.local and set NEXT_PUBLIC_API
```

## Getting started

```bash
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_API
npm run dev
```

## The API layer

`lib/api/data.ts` is a drop-in replacement for an axios + cookies-next client, built on
nothing but the platform `fetch`:

```ts
import { get, post } from '../data'

export function getSuggestions(params: any = {}) {
  return get<any>('/mobility/suggestion', params)
}
export function postSuggestion(params: any) {
  return post<any>('/mobility/suggestion', params)
}
```

Every call:
- Reads the `token` cookie automatically (or an explicit `params.token`, which wins)
- Adds `Authorization: Bearer <token>` when a token is present
- Never throws — returns `{ error: true, status?, message }` on failure, check it with
  `isApiError()` from `types/api.ts`
- Plugs into **Next's own fetch cache**: GET requests default to `next: { revalidate: 60 }`;
  pass `cache: 'no-store'` or your own `next: { revalidate, tags }` per call to override

Works identically from a Server Component, a Server Action, a Route Handler, or a Client
Component — the token lookup in `lib/api/cookies.ts` detects which side it's running on.

### Setting the auth cookie

Reading a cookie works the same everywhere, but **writing** one only works from a Server
Action or Route Handler (or `document.cookie` in the browser, which can't set `httpOnly`).
See `app/(auth)/login/actions.ts` for the real pattern: call the API, then
`(await cookies()).set('token', ..., { httpOnly: true, ... })`, then redirect.

## The component library

Everything in `components/ui` is unstyled: state is exposed as `data-*` attributes
(`data-state="open"`, `data-loading`, `data-invalid`, ...) instead of baked-in CSS, so you
style it with plain CSS, Tailwind, or whatever you already use. `app/globals.css` is a
worked example — delete it and bring your own.

Import from the barrel or a specific category:

```tsx
import { Button, Dialog, useForm } from '@/components/ui'
// or, to import less per file:
import { Button } from '@/components/ui/actions'
```

`@/components/ui/nextjs` (NavLink, LocaleLink, FrameworkImage, RouteGuard, AuthGuard,
`pageMetadata`) is **not** re-exported from the barrel since it depends on `next/*` — import
it directly.

See the showcase in `app/showcase.tsx` and `app/(auth)/login` for working examples of forms,
dialogs, tabs, toasts, selects, and a Server Action.
