# Next.js 16 boilerplate

A typed, unstyled component foundation built with Next.js App Router and strict TypeScript.
This project is designed as a reusable starter for building apps with:

- typed fetch-based API helpers
- server-safe auth cookie handling
- unstyled UI primitives driven by `data-*` attributes
- modular Sass structure with reusable variables and mixins
- i18n-ready routing and a simple showcase app

## Highlights

- Strict TypeScript setup with concrete generics instead of `any`
- Fetch-based API layer with typed request/response helpers
- Cookie-aware auth flow using Next server actions
- CSS custom properties for theming, including dark mode support
- Sass mixins for breakpoints, typography, scrollbars, flex helpers, and focus states
- Component styles split into small per-component partials for easier maintenance

## Project structure

```text
app/
  (auth)/login/
    actions.ts
    page.tsx
  [locale]/
    layout.tsx
    page.tsx
  globals.css
  globals.scss
  layout.tsx
  page.tsx
  showcase.tsx

components/
  language-switcher.tsx
  ui/
    access/
    actions/
    data-display/
    date/
    dnd/
    feedback/
    forms/
    foundation/
    hooks/
    icon/
    navigation/
    nextjs/
    overlays/
    utils/

lib/
  api/
    config.ts
    cookies.ts
    data.ts
    resources/
      auth.ts
      suggestions.ts
  i18n-server.ts
  i18n.ts

messages/
  en.json
  fr.json

styles/
  base/
    _layout.scss
    _mixins.scss
    _reset.scss
    _variables.scss
  components/
    _*.scss
  main.scss

public/

types/
  api.ts

.env.example
README.md
```

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

## API layer

The fetch client in `lib/api/data.ts` replaces the usual axios + cookies-next pattern with the platform `fetch` and typed helpers.

```ts
import { get, post } from '@/lib/api/data'

interface SuggestionPayload {
  query: string
}

interface Suggestion {
  id: string
  text: string
}

export function getSuggestions(params: Record<string, unknown> = {}) {
  return get<Suggestion[]>('/suggestion', params)
}

export function postSuggestion(payload: SuggestionPayload) {
  return post<Suggestion>('/suggestion', payload)
}
```

Core behavior:

- automatically reads the auth token from cookies when available
- adds `Authorization: Bearer <token>` when present
- returns normalized error objects instead of throwing
- supports typed `GET`, `POST`, `PATCH`, and `DELETE` wrappers
- keeps Next.js cache options flexible through `next` fetch config

The shared API helpers are paired with `types/api.ts`, which exposes `ApiResult<T>` and `isApiError()` for consistent handling across client and server code.

## Authentication flow

The repo contains a working auth example in `app/(auth)/login/actions.ts`.

The general pattern is:

1. call the API from a server action
2. receive a typed response
3. set the auth cookie on the server
4. redirect to the requested page

This keeps the token secure and follows Next.js server-first patterns.

## Component library

The UI layer under `components/ui` is intentionally unstyled.

State and behavior are exposed using `data-*` attributes such as:

- `data-state="open"`
- `data-loading="true"`
- `data-invalid="true"`
- `data-pressed="true"`
The library also includes an `Autocomplete` field for searchable single-select and multi-select inputs, which works well for country pickers, tag-style searches, and async suggestions.

```tsx
<Autocomplete
  multiple
  loadOptions={searchCountries}
  minChars={0}
  value={favoriteCountries}
  onChange={setFavoriteCountries}
  clearable
  maxVisibleChips={5}
  placeholder="Search countries"
/>
```
That makes it easy to style with:

- plain CSS
- Sass
- Tailwind
- your own custom design system

Example imports:

```tsx
import { Button, Dialog, useForm } from '@/components/ui'
import { Button } from '@/components/ui/actions'
```

The showcase app at `app/showcase.tsx` demonstrates how the primitives compose together in a real UI.

## Styling system

The Sass layer is structured to keep styling maintainable and easy to extend.

### Base files

- `styles/base/_variables.scss` defines the theme tokens and CSS custom properties
- `styles/base/_mixins.scss` contains reusable utility mixins
- `styles/base/_reset.scss` handles resets and base element styling
- `styles/base/_layout.scss` contains layout helpers and page structure styles

### Component files

Each component gets its own partial, such as:

- `_button.scss`
- `_input.scss`
- `_select.scss`
- `_switch.scss`
- `_dialog.scss`
- `_accordion.scss`
- `_badge.scss`

These are imported in `styles/main.scss`, which acts as the central entry point.

### Theme setup

The variables file includes both light and dark theme values using CSS custom properties and a `prefers-color-scheme` media query.

Example tokens:

```scss
:root {
  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-text: #0f172a;
  --color-primary: #2563eb;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #020817;
    --color-text: #e2e8f0;
  }
}
```

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Notes

This project is intentionally kept lightweight and dependency-minimal. It focuses on a clean foundation for building apps in a consistent way without locking you into a heavy design system or runtime dependency chain.
