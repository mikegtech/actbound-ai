# ActBound AI — Frontend Architecture — UI Context

This document governs all frontend implementation in `apps/web`. It is the single source of truth for UI architecture, conventions, and design system integration. All AI agents and human engineers must read this before any frontend work.

---

## 1. Stack

| Concern       | Technology                | Version   |
| ------------- | ------------------------- | --------- |
| Framework     | React + TypeScript strict | 19.2.x    |
| Build         | Vite                      | 8.x       |
| Router        | TanStack Router           | 1.168.x   |
| Server State  | TanStack Query            | 5.96.x    |
| Client State  | Zustand                   | 5.x       |
| UI Components | MUI (Material UI)         | 7.x       |
| Data Grid     | MUI X Data Grid           | 8.x       |
| Forms         | React Hook Form + Zod     | 7.x / 4.x |
| HTTP          | Axios                     | 1.x       |
| Auth          | @auth0/auth0-react        | 2.x       |
| Icons         | Iconify                   | 6.x       |
| Notifications | notistack                 | 3.x       |
| Dates         | dayjs                     | 1.x       |
| Animations    | GSAP + Lottie             | 3.x       |
| Code Quality  | Biome (lint + format)     | 2.x       |
| i18n          | i18next                   | 25.x      |

**Base template:** Aurora Typescript v1.12.0 (vite-ts-starter variant).

---

## 2. Architectural Principles

### Decoupled SPA

The frontend is a standalone single-page application. It communicates exclusively with the orchestrator-api gateway. No direct calls to internal microservices.

### Backend is Authoritative

The UI consumes permission decisions from API responses. It does not evaluate policies, check roles, or make authorization decisions. CASL is advisory UX only (ADR-020).

### Gateway Boundary

All API traffic routes through the orchestrator-api. This is enforced in code structure:

```
services/api/
├── http.ts                      # Axios instance, interceptors, error normalization
└── gateway/
    ├── assistants.ts            # /assistants endpoints
    ├── organizations.ts         # /organizations endpoints
    ├── resources.ts             # /resources endpoints
    ├── policies.ts              # /policies endpoints
    ├── delegations.ts           # /delegations, /connections, /consents endpoints
    ├── audit.ts                 # /audit-events, /me/activity endpoints
    ├── security.ts              # /health, /me/control-summary endpoints
    └── auth.ts                  # /auth endpoints
```

**Rules:**

- No direct browser calls to internal microservices
- No service-specific base URLs scattered through features
- All frontend contracts represent public API gateway DTOs, not internal service shapes
- Single `VITE_API_URL` environment variable points to the gateway

---

## 3. Feature-Oriented Structure

```
src/
├── assets/                      # Static files (images, animations)
├── components/                  # Shared UI primitives (see Section 9)
│   ├── base/                    # IconifyIcon, Image, NumberTextField
│   ├── common/                  # Logo, PasswordTextField
│   ├── guard/                   # AuthGuard, GuestGuard
│   ├── loading/                 # PageLoader, Splash
│   ├── styled/                  # Pre-styled MUI components
│   └── product/                 # ActBound shared primitives (see Section 9)
├── features/                    # Domain feature slices
│   ├── dashboard/
│   ├── assistants/
│   ├── organizations/
│   ├── resources/
│   ├── policies/
│   ├── delegations/
│   ├── security/
│   ├── audit/
│   └── settings/
├── hooks/                       # Global utility hooks
├── layouts/                     # AppShell, AuthLayout, MainLayout
├── lib/                         # Constants, utils, validators
├── locales/                     # i18n translations
├── providers/                   # React Context providers
├── routes/                      # TanStack Router definitions
├── services/                    # API clients (gateway boundary)
├── stores/                      # Zustand stores (client state only)
├── theme/                       # MUI theme (Sentinel design system)
└── types/                       # Global TypeScript types
```

### Feature Slice Convention

Each feature directory contains:

```
features/{feature}/
├── components/                  # Feature-specific components
├── hooks/                       # Feature-specific hooks (TanStack Query wrappers)
├── api.ts                       # Feature API adapter (calls gateway client)
├── schemas.ts                   # Feature Zod schemas (if not in SDK)
├── routes.tsx                   # Feature route definitions
└── index.ts                     # Public exports
```

**Rules:**

- Features do not import from other features directly
- Shared concerns go in `components/product/` or `hooks/`
- Cross-feature communication happens through the router or query cache

---

## 4. TanStack Query Conventions

All server state flows through TanStack Query. No ad hoc `useEffect + axios` fetching.

### Query Key Convention

```typescript
// Pattern: [domain, scope, ...params]
["assistants", "list"][("assistants", "detail", assistantId)][
  ("organizations", "list")
][("organizations", "detail", orgId)][("policies", "list", { status })][
  ("audit", "events", { page, filters })
][("security", "control-summary")][("delegations", "connections")];
```

### Query Defaults

```typescript
{
  staleTime: 5 * 60 * 1000,       // 5 minutes
  retry: 2,
  refetchOnWindowFocus: true,
}
```

### Mutation Patterns

```typescript
// Every mutation must invalidate or update known query keys
const useCreatePolicy = () =>
  useMutation({
    mutationFn: gateway.policies.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policies"] });
    },
  });
```

### Rules

- All server state goes through feature hooks backed by TanStack Query
- Mutations must invalidate or update known query keys
- API errors are normalized in the Axios interceptor, not per-query
- Use `enabled` option to prevent queries from firing without required params
- Use `placeholderData: keepPreviousData` for pagination
- No optimistic updates unless the feature explicitly requires it

### Rendering States

Every query-backed component must handle:

```typescript
if (query.isLoading) return <LoadingState />;
if (query.isError) return <ErrorState error={query.error} />;
if (!query.data?.length) return <EmptyState />;
return <DataView data={query.data} />;
```

---

## 5. Zustand: Client State Only

Zustand is for transient UI state that does not come from the server.

### Allowed

- Sidebar collapse / expand
- UI preferences (theme, locale, text direction)
- Modal / panel / drawer open state
- Wizard progress
- Transient client-only filters

### Prohibited

- Organization list
- Assistant records
- Policy data
- Audit events
- Connected accounts
- Any data that originates from an API response

Those belong in TanStack Query.

### Existing Stores

| Store                   | Purpose                          | Persisted |
| ----------------------- | -------------------------------- | --------- |
| `useSettingsStore`      | Theme, locale, sidenav, nav type | Yes       |
| `useNavStore`           | Navigation state                 | No        |
| `useSettingsPanelStore` | Settings panel visibility        | No        |

---

## 6. Route Map

### Product Routes

| Route                 | Feature       | Page                          |
| --------------------- | ------------- | ----------------------------- |
| `/`                   | dashboard     | Dashboard overview            |
| `/assistants`         | assistants    | Assistant directory           |
| `/assistants/:id`     | assistants    | Assistant control panel       |
| `/organizations`      | organizations | Organization directory        |
| `/organizations/:id`  | organizations | Organization detail           |
| `/resources`          | resources     | Resource directory            |
| `/resources/:id`      | resources     | Resource detail               |
| `/policies`           | policies      | Policy list                   |
| `/policies/:id`       | policies      | Policy editor                 |
| `/policies/simulate`  | policies      | Policy simulation trace       |
| `/delegations`        | delegations   | Connected accounts / consents |
| `/security`           | security      | Security controls             |
| `/security/dashboard` | security      | Security posture dashboard    |
| `/security/graph`     | security      | Authorization logic graph     |
| `/audit`              | audit         | Audit log / activity timeline |
| `/settings`           | settings      | Platform settings             |

### Auth Routes

| Route            | Page                    |
| ---------------- | ----------------------- |
| `/auth/login`    | Sign in (Auth0 PKCE)    |
| `/auth/callback` | Auth0 redirect callback |
| `/auth/logout`   | Post-logout landing     |
| `/error/404`     | Not found               |

---

## 7. Authentication Architecture

### Rules

- SPA uses Auth0 PKCE flow via `@auth0/auth0-react`
- Custom domain: `auth.actbound.ai`
- Audience: `https://api.actbound.ai`
- Gateway validates tokens and enforces the backend policy boundary
- UI only handles user/session context needed for presentation
- No tokens stored in localStorage (Auth0 SDK manages in-memory or cookie)
- Auth guards protect routes: `AuthGuard` (requires session), `GuestGuard` (public only)

### Auth Context

```typescript
interface AuthContext {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  principal: Principal | null; // Normalized from JWT claims
  loginWithRedirect: () => void;
  logout: () => void;
  getAccessTokenSilently: () => Promise<string>;
}
```

### Axios Integration

The Axios instance attaches the access token via interceptor:

```typescript
axiosInstance.interceptors.request.use(async (config) => {
  const token = await getAccessTokenSilently();
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

---

## 8. Design System: The Architectural Sentinel

The visual language is defined in the Stitch design exports (`~/Downloads/stitch/actbound_sentinel/DESIGN.md`). Implementation uses MUI theme customization to express these tokens.

### Creative North Star

"The Architectural Sentinel" — a calm, authoritative guardian interface. Editorial layout with tonal layering and intentional asymmetry. Not a standard SaaS dashboard.

### Color System (Material Design 3)

Map to MUI palette via custom theme:

| Token                      | Hex       | MUI Mapping                       |
| -------------------------- | --------- | --------------------------------- |
| `primary`                  | `#003d9b` | `palette.primary.main`            |
| `primary-container`        | `#0052cc` | `palette.primary.dark`            |
| `primary-fixed`            | `#dae2ff` | `palette.primary.light`           |
| `on-primary`               | `#ffffff` | `palette.primary.contrastText`    |
| `secondary`                | `#4c5d8d` | `palette.secondary.main`          |
| `tertiary` (burnt orange)  | `#7b2600` | `palette.warning.main`            |
| `tertiary-container`       | `#a33500` | `palette.warning.dark`            |
| `error`                    | `#ba1a1a` | `palette.error.main`              |
| `surface`                  | `#faf8ff` | `palette.background.default`      |
| `surface-container-low`    | `#f2f3ff` | Custom: `palette.surface.low`     |
| `surface-container-lowest` | `#ffffff` | Custom: `palette.surface.lowest`  |
| `surface-container-high`   | `#e2e7ff` | Custom: `palette.surface.high`    |
| `on-surface`               | `#131b2e` | `palette.text.primary`            |
| `on-surface-variant`       | `#434654` | `palette.text.secondary`          |
| `outline`                  | `#737685` | `palette.divider`                 |
| `outline-variant`          | `#c3c6d6` | Custom: `palette.outline.variant` |

### Typography

| Role              | Font    | Usage                                     |
| ----------------- | ------- | ----------------------------------------- |
| Display/Headlines | Manrope | Dashboard summaries, page titles, metrics |
| Interface/Data    | Inter   | Body text, tables, labels, form fields    |

MUI typography overrides:

```typescript
typography: {
  fontFamily: '"Inter", sans-serif',
  h1: { fontFamily: '"Manrope", sans-serif', fontWeight: 700 },
  h2: { fontFamily: '"Manrope", sans-serif', fontWeight: 700 },
  h3: { fontFamily: '"Manrope", sans-serif', fontWeight: 600 },
  h4: { fontFamily: '"Manrope", sans-serif', fontWeight: 600 },
  h5: { fontFamily: '"Manrope", sans-serif', fontWeight: 600 },
  h6: { fontFamily: '"Manrope", sans-serif', fontWeight: 600 },
}
```

### Elevation Rules

- **No shadows** for standard cards. Use tonal layering: `surface-container-lowest` on `surface-container-low`
- **No 1px borders** for sectioning. Background color shifts create structure
- **Ambient shadows** only for floating elements: 6% opacity, 24-40px blur, 8px Y-offset
- **Ghost border** fallback for accessibility: `outline-variant` at 20% opacity

### Border Radius Scale

| Token     | Value      | Usage                |
| --------- | ---------- | -------------------- |
| `DEFAULT` | `0.125rem` | Minimal              |
| `lg`      | `0.25rem`  | Subtle               |
| `xl`      | `0.5rem`   | Standard (buttons)   |
| `full`    | `0.75rem`  | Pill (badges, chips) |

### Component Conventions

**Buttons:**

- Primary: gradient `primary` → `primary-container` at 135deg, `xl` radius, white text
- Secondary: ghost style, `surface-container-high` on hover, no border
- Tertiary: uppercase label, 5% letter-spacing, primary color, no container

**Tables:**

- No vertical or horizontal divider lines
- Header: `surface-container-low` background
- Data rows: `surface-container-lowest`
- High vertical padding (16px)

**Status Badges:**

- Pill shape (`full` radius)
- `error-container` for high-risk, `primary-fixed` for neutral
- Text always uses "On" variant (e.g., `on-error-container`)

**Input Fields:**

- No bottom border
- Background: `surface-container-low`, shifts to `surface-container-highest` on focus
- Error: ghost border of `error` at 40% opacity (never solid red)

### Design Don'ts

- No `1px solid #CCCCCC` borders
- No pure black `#000000` text — use `on-surface` (`#131b2e`)
- No standard "Warning Yellow" — use `tertiary` burnt orange (`#7b2600`)
- No shadows for standard cards — use tonal layering
- If a view feels heavy, increase spacing rather than adding dividers

---

## 9. Shared Product Primitives

Build these before page implementation to maintain visual consistency:

| Component       | Purpose                                            |
| --------------- | -------------------------------------------------- |
| `AppShell`      | Main layout with sidebar, header, content area     |
| `PageHeader`    | Page title, description, breadcrumbs, actions      |
| `SectionCard`   | Tonal-layered content block (no shadow)            |
| `MetricCard`    | Key metric display with label, value, trend        |
| `EntityTable`   | MUI DataGrid wrapper with Sentinel styling         |
| `StatusBadge`   | Pill badge with semantic color mapping             |
| `EmptyState`    | Centered illustration + message + action CTA       |
| `LoadingState`  | Skeleton loader matching page layout               |
| `ErrorState`    | Error message + retry action                       |
| `ConfirmDialog` | Glass-effect confirmation modal                    |
| `DetailDrawer`  | Side panel for entity detail / inline editing      |
| `TrustGauge`    | Radial trust score display (0-100)                 |
| `ActivityItem`  | Timeline entry with icon, actor, action, timestamp |
| `PolicyBadge`   | Compliance indicator (HIPAA, SOC2, etc.)           |

---

## 10. Screen Inventory (from Stitch Designs)

34 screens exported from Figma. Design source: `~/Downloads/stitch/`

### Authentication (2)

- `sign_in_actbound_ai_1` — Primary sign-in with SSO
- `sign_in_actbound_ai_2` — Enhanced security messaging variant

### Dashboard (3)

- `dashboard_actbound_ai` — Main dashboard: trust score, accounts, resources, assistants, activity
- `security_dashboard` — Security posture monitoring, authorization metrics
- `organizations_overview` — High-level organization status

### Policies (4)

- `policy_engine_all_policies_1` — Policy list with filters
- `policy_engine_all_policies_2` — Alternate layout
- `policy_editor_financial_data_access` — Policy editor (Financial Data Access)
- `policy_editor_global_finance_policy` — Policy editor (Global Finance Policy)

### Assistants (4)

- `ai_assistant_directory_1` — Assistant registry
- `ai_assistant_directory_2` — Alternate directory view
- `assistant_control_fin_sentry_alpha` — Assistant control panel
- `assistant_control_financial_analyst_ai` — Assistant control panel

### Delegations & Accounts (3)

- `connected_accounts_delegations` — Connected accounts and delegation settings
- `my_security_controls` — Personal security controls
- `access_modals_states` — Access request/grant modals

### Organizations (3)

- `organizations_directory` — Multi-org directory
- `organization_acme_realty_1` — Org detail view
- `organization_acme_realty_2` — Alternate org detail

### Resources (4)

- `resources_directory` — Resource directory
- `protected_resources_directory` — Protected resources with access levels
- `resource_financial_q3_drafts_1` — Resource detail
- `resource_financial_q3_drafts_2` — Alternate resource detail

### Security & Audit (3)

- `audit_log_security_events` — Activity/audit log
- `authorization_logic_graph_1` — Authorization decision graph
- `authorization_logic_graph_2` — Alternate graph view

### Simulation & Modals (2)

- `policy_simulation_trace` — Policy evaluation trace
- `assistant_modals_audit_states` — Assistant audit modals

### Settings (2)

- `platform_settings_1` — Platform configuration
- `platform_settings_2` — Alternate settings view

### UI Patterns (2)

- `common_states_ui_patterns` — Button, form, interaction states reference
- `empty_loading_states` — Empty states, skeletons, transitions

---

## 11. Navigation Structure

### Sidebar Navigation

```
Dashboard
Accounts / Connected Accounts
Activity / Audit Log
Policies / Policy Engine
Access / Security
Assistants / AI Assistants
Resources / Vault
Organizations
User Control
Settings
```

### Header

- Search bar
- Notifications (bell with indicator)
- Organization switcher
- User profile (avatar + name)

---

## 12. Mock-First Development

Build UI against stable contracts before real backend integration.

### Strategy

1. Define typed gateway response shapes in `services/api/gateway/*.ts`
2. Create feature fixtures in `features/{feature}/mocks/`
3. Pages build against contracts — swap to real APIs with minimal churn
4. Use TanStack Query's `initialData` or mock service workers for development

### Rules

- Mock data must match the exact shape of gateway DTOs
- Mock data lives in feature directories, not in shared locations
- Feature flags or environment variables control mock vs real API usage
- No mock data in production builds

---

## 13. Implementation Phases

### Phase 0 — Hardening Pass

- Scaffold Aurora template into `apps/web`
- Replace route map with product domains (Section 6)
- Replace nav labels and page titles with real product names
- Configure MUI theme with Sentinel design tokens (Section 8)
- Configure Manrope + Inter fonts
- Define gateway API client structure (Section 2)
- Set TanStack Query conventions (Section 4)
- Set Zustand usage limits (Section 5)
- Build shared product primitives (Section 9)
- Scaffold empty routes/pages for all features
- Wire Auth0 provider with `auth.actbound.ai` domain

### Phase 1 — App Shell + Dashboard

- Implement `AppShell` with sidebar navigation matching Stitch designs
- Implement main dashboard with `MetricCard` grid, `TrustGauge`, activity timeline
- Wire dashboard queries to gateway API
- Implement `LoadingState`, `EmptyState`, `ErrorState` patterns

### Phase 2 — Assistants + Organizations

- Assistant directory (list, search, filter)
- Assistant control panel (detail, delegation, kill-switch)
- Organization directory and detail views
- Entity tables with Sentinel styling

### Phase 3 — Policies + Security

- Policy list and editor
- Policy simulation trace
- Security dashboard and authorization logic graph
- Connected accounts and delegation management

### Phase 4 — Audit + Settings

- Audit log with timeline view
- Platform settings
- User security controls

---

## 14. Environment Variables

```
VITE_API_URL=http://localhost:3001        # Orchestrator-API gateway
VITE_AUTH0_DOMAIN=auth.actbound.ai
VITE_AUTH0_CLIENT_ID=VKm1ClfzHqI0VSKtjtzAtBDbgeBXAVLp
VITE_AUTH0_AUDIENCE=https://api.actbound.ai
VITE_APP_PORT=5173
```

---

## 15. Hard Boundaries

1. **No backend authorization logic in React.** The UI renders decisions, not makes them.
2. **No imports from `packages/authorization` or `packages/openfga`.** Authorization arrives via API.
3. **No NestJS, Drizzle, or backend infrastructure imports.**
4. **No ad hoc `useEffect + axios` data fetching.** All server state through TanStack Query.
5. **No server-state caching in Zustand.** Zustand is client UI state only.
6. **No direct calls to internal microservices.** All traffic through the gateway.
7. **No scattered base URLs.** Single `VITE_API_URL` for the gateway.
8. **No tokens in localStorage.** Auth0 SDK manages token lifecycle.
9. **No duplicate Zod schemas.** Import from `packages/sdk` when available.
