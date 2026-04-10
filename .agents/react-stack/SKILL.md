---
name: react-stack
description: >
  Canonical stack reference for React projects using
  Vite 8, React 19, TypeScript 5.9, MUI v7, TanStack
  Router v1, TanStack Query v5, Zustand v5, React Hook
  Form v7, Zod, and Axios. Read this before building
  any feature in this codebase. Covers folder structure,
  feature module patterns, naming conventions, and
  per-library rules for Query, Zustand, Zod, RHF,
  Axios, MUI, GSAP, Lottie, notistack, and TanStack
  Router.
license: Proprietary
metadata:
  author: actbound
  version: "1.0"
compatibility: >
  Claude Code. Requires Node.js 20+, npm.
  Targets React 19 + Vite 8 projects.
---

# React Stack Skill

## Stack

- React 19 + TypeScript 5.9 strict mode
- Vite 8
- MUI v7 + Emotion (component library + theming)
- TanStack Router v1 (routing)
- TanStack Query v5 (server state)
- Zustand v5 (client state)
- React Hook Form v7 + Zod (forms + validation)
- Axios (HTTP client)
- Biome (linting + formatting)
- Husky + lint-staged (pre-commit)
- Auth0 (authentication)
- GSAP + @gsap/react (animations)
- Lottie + lottie-react (empty/loading states)
- notistack (toast notifications)
- i18next + react-i18next (internationalization)
- dayjs (date handling)
- Iconify (icons)

## Folder Structure

```
src/
├── assets/              # static files only — images, fonts, JSON
├── components/          # shared UI components, not domain-specific
│   ├── base/            # primitive wrappers (buttons, inputs, cards)
│   ├── common/          # composite shared components
│   ├── guard/           # AuthGuard, GuestGuard
│   ├── loading/         # skeleton loaders, Lottie empty states
│   └── styled/          # MUI styled() components
├── features/            # domain feature modules (see Feature Module below)
├── hooks/               # global utility hooks only
├── layouts/             # MainLayout, AuthLayout
├── lib/
│   ├── constants/       # app-wide constants
│   ├── utils/           # pure utility functions
│   └── validators/      # Zod schemas (shared/global only)
├── locales/             # i18n config + language files
├── providers/           # React context providers (Auth0 only)
├── routes/              # TanStack Router config
├── services/
│   ├── api/
│   │   ├── axiosInstance.ts    # single axios instance, interceptors
│   │   ├── endpoints.ts        # all API endpoint strings
│   │   └── types/              # shared API request/response types
│   └── query/
│       └── QueryProvider.tsx   # QueryClient config + provider
├── stores/              # Zustand stores
├── theme/               # MUI theme, palette, typography, overrides
├── types/               # global TypeScript interfaces
├── App.tsx
├── main.tsx
└── config.ts
```

## Feature Module Structure

Every product domain gets its own feature folder.
Features are self-contained — they own their components,
hooks, schemas, and types.

```
src/features/[domain]/
├── components/          # UI components for this feature only
├── hooks/
│   ├── queries/         # TanStack Query hooks
│   └── mutations/       # TanStack Query mutation hooks
├── schemas/             # Zod schemas for this domain
├── types/               # TypeScript types for this domain
└── index.ts             # public API — only export what other
                         # features need
```

Example domains: policies, resources, organizations,
assistants, access, audit, auth, dashboard

## TanStack Query — Rules

### Query hook naming

```ts
// Always prefix with use, suffix with Query
export const usePoliciesQuery = () =>
  useQuery({
    queryKey: ["policies"],
    queryFn: () => api.get(endpoints.policies.list),
    staleTime: 5 * 60 * 1000,
  });

// Parameterized queries
export const usePolicyQuery = (id: string) =>
  useQuery({
    queryKey: ["policies", id],
    queryFn: () => api.get(endpoints.policies.detail(id)),
    enabled: !!id,
  });
```

### Mutation hook naming

```ts
// Always prefix with use, suffix with Mutation
export const useCreatePolicyMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePolicyRequest) =>
      api.post(endpoints.policies.create, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policies"] });
    },
  });
};
```

### QueryKey conventions

```ts
// List:   ['domain']
// Detail: ['domain', id]
// Nested: ['domain', id, 'subdomain']
// Filtered: ['domain', { filters }]
```

### QueryClient defaults (set in QueryProvider)

```ts
{
  staleTime: 5 * 60 * 1000,     // 5 minutes
  gcTime: 10 * 60 * 1000,       // 10 minutes
  retry: 2,
  refetchOnWindowFocus: true,
}
```

## Zustand — Rules

### Store naming and location

```ts
// src/stores/use[Domain]Store.ts
// Always named with use prefix, Store suffix
export const useNavStore = create<NavStore>()(...)
export const useSettingsStore = create<SettingsStore>()(...)
```

### Store pattern

```ts
interface NavStore {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}

export const useNavStore = create<NavStore>()((set) => ({
  isOpen: true,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  close: () => set({ isOpen: false }),
}));
```

### Persist pattern (for settings that survive refresh)

```ts
export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      themeMode: "light",
      setThemeMode: (mode) => set({ themeMode: mode }),
    }),
    { name: "actbound-settings" },
  ),
);
```

### When to use Zustand vs other state

- Zustand: global UI state, user preferences, nav state
- TanStack Query: anything from the server
- useState: local component state
- Context: Auth0 provider only (SDK requirement)
- Never: Redux, useReducer for global state

## Zod + React Hook Form — Rules

### Schema location

```ts
// Global/shared schemas: src/lib/validators/[name].schema.ts
// Feature schemas:       src/features/[domain]/schemas/[name].schema.ts
```

### Schema pattern — always export inferred type

```ts
// src/features/policies/schemas/policy.schema.ts
import { z } from "zod";

export const createPolicySchema = z.object({
  name: z.string().min(1, "Name is required"),
  effect: z.enum(["allow", "deny"]),
  priority: z.number().int().min(0).max(1000),
  conditions: z.array(
    z.object({
      attribute: z.string(),
      operator: z.string(),
      value: z.string(),
    }),
  ),
});

export type CreatePolicyFormData = z.infer<typeof createPolicySchema>;
```

### Form wiring pattern

```ts
import { zodResolver } from "@hookform/resolvers/zod";

const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm<CreatePolicyFormData>({
  resolver: zodResolver(createPolicySchema),
  defaultValues: {
    effect: "allow",
    priority: 100,
  },
});
```

### Rule: schema types replace manual interface definitions

Never write a TypeScript interface for form data.
Always derive it from the Zod schema with z.infer<>.

## Axios — Rules

### Always use axiosInstance — never import axios directly

```ts
// correct
import { axiosInstance } from "services/api/axiosInstance";

// never
import axios from "axios";
```

### Endpoint strings live in endpoints.ts

```ts
// src/services/api/endpoints.ts
export const endpoints = {
  policies: {
    list: "/policies",
    detail: (id: string) => `/policies/${id}`,
    create: "/policies",
    update: (id: string) => `/policies/${id}`,
    delete: (id: string) => `/policies/${id}`,
  },
  resources: {
    list: "/resources",
    detail: (id: string) => `/resources/${id}`,
  },
};
```

## TanStack Router — Rules

### Route definition location

```ts
// src/routes/router.tsx — all routes defined here
// Route params are typed via TanStack Router inference
```

### Navigation

```ts
// correct
import { Link, useNavigate } from "@tanstack/react-router";
navigate({ to: "/policies/$id", params: { id } });

// never
import { useNavigate } from "react-router";
```

### Auth guards

```ts
// Use AuthGuard for protected routes
// Use GuestGuard for auth-only routes (login, register)
// Both live in src/components/guard/
```

## MUI — Rules

### Styling priority order

```ts
// 1. Theme tokens first — always use theme values
// 2. sx prop for one-off overrides
// 3. styled() for reusable styled components
// 4. Never write plain CSS files for component styling
```

### Component extension pattern

```ts
// extend via styled()
const PolicyCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  border: `1px solid ${theme.palette.divider}`,
}))

// one-off via sx
<Box sx={{ p: 2, bgcolor: 'background.paper' }} />

// never
<div style={{ padding: 16 }} />
```

### Theme tokens — always reference, never hardcode

```ts
// correct
color: theme.palette.primary.main;
// never
color: "#1B4AEF";
```

## Animation — Rules

### GSAP: page transitions and sequenced animations

```ts
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

// Use useGSAP hook — never useEffect for GSAP
useGSAP(() => {
  gsap.from(".policy-card", {
    opacity: 0,
    y: 20,
    stagger: 0.05,
    duration: 0.4,
  });
}, []);
```

### Lottie: empty states and loading illustrations

```ts
// Use for: empty data states, loading screens,
// success/error confirmations
// Source files: src/assets/lottie/[name].json
import Lottie from 'lottie-react'
import emptyStateAnimation from 'assets/lottie/empty-state.json'

<Lottie animationData={emptyStateAnimation} loop={true} />
```

### notistack: all toast notifications

```ts
const { enqueueSnackbar } = useSnackbar();

enqueueSnackbar("Policy published", { variant: "success" });
enqueueSnackbar("Access revoked", { variant: "warning" });
enqueueSnackbar("Action failed", { variant: "error" });
```

## Naming Conventions

| Thing            | Convention               | Example                   |
| ---------------- | ------------------------ | ------------------------- |
| Components       | PascalCase               | `PolicyCard.tsx`          |
| Hooks            | camelCase, use prefix    | `usePoliciesQuery.ts`     |
| Stores           | camelCase, use+Store     | `usePolicyStore.ts`       |
| Schemas          | camelCase, schema suffix | `policy.schema.ts`        |
| Types/Interfaces | PascalCase               | `PolicyDetail`            |
| Endpoints        | camelCase object         | `endpoints.policies.list` |
| Query keys       | lowercase strings        | `['policies', id]`        |
| Feature folders  | lowercase                | `features/policies/`      |
| Route paths      | kebab-case               | `/policy-engine`          |

## TypeScript — Rules

- Strict mode is on — no exceptions
- No `any` — use `unknown` and narrow
- No non-null assertions (`!`) without a comment explaining why
- All API response types live in `services/api/types/`
- All form types derived from Zod schemas via `z.infer<>`
- Export types from feature `index.ts` if needed externally

## Pre-commit

Husky + lint-staged runs on every commit:

- `*.{ts,tsx}` → biome check --write → tsc --noEmit
- `*.{json,css,md}` → biome format --write

All commits must pass. No bypass without team discussion.
