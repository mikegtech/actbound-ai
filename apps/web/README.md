# ActBound Web

Frontend SPA for the ActBound AI control plane. This package owns the browser shell, route structure, mock-first domain surfaces, and gateway-facing UI integrations.

## Stack

- React 19 + TypeScript 5.9
- Vite 8
- MUI v7 + Emotion
- TanStack Router v1
- TanStack Query v5
- Zustand v5
- React Hook Form v7 + Zod
- Axios
- Biome

## Getting Started

```sh
pnpm install
pnpm --filter @actbound/web dev
```

The app runs inside the monorepo workspace and follows the root repository scripts and environment conventions.

## Scripts

| Command                               | Description                      |
| ------------------------------------- | -------------------------------- |
| `pnpm --filter @actbound/web dev`     | Start the web app in development |
| `pnpm --filter @actbound/web build`   | Build the SPA to `dist/`         |
| `pnpm --filter @actbound/web preview` | Preview the production build     |
| `pnpm --filter @actbound/web lint`    | Run Biome lint fixes             |
| `pnpm --filter @actbound/web format`  | Run Biome formatting             |
| `pnpm --filter @actbound/web check`   | Run Biome checks                 |

## Project Structure

```text
src/
├── assets/          # static files
├── components/      # shared UI components
├── hooks/           # global utility hooks
├── layouts/         # shell layouts
├── lib/             # constants, utils, validators
├── locales/         # i18n config + language files
├── pages/           # route-level domain screens
├── providers/       # context providers
├── routes/          # TanStack Router config and sitemap
├── services/        # axios and API helpers
├── stores/          # Zustand stores
├── theme/           # MUI theme customization
└── types/           # global TypeScript types
```

## Notes

- The web app is intentionally frontend-only and should consume gateway-facing contracts rather than backend internals.
- Use `@actbound/sdk` and `@actbound/ui` first before adding new local primitives or shared types.
