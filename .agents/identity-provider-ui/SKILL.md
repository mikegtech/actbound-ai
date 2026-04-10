---
name: identity-provider-ui
description: >
  MUI-specific UI and UX patterns for presenting
  identity providers generically in a React application.
  Read before building any auth-related UI including
  provider lists, registration flows, claim mapping
  editors, or any screen that references identity
  providers, trusted issuers, or OIDC configuration.
  Enforces generic language rules — never issuer-specific
  copy in navigation, titles, or labels.
license: Proprietary
metadata:
  author: actbound
  version: "1.0"
compatibility: >
  Requires MUI v7, React Hook Form v7, Zod,
  dayjs, lottie-react, notistack.
---

# Identity Provider UI Patterns

MUI-specific UI/UX patterns for presenting identity providers generically in a React application. Any subagent building auth-related UI reads this before writing components or copy.

## Language Rules

### Never use issuer-specific language in the UI

| Never use       | Use instead                       |
| --------------- | --------------------------------- |
| Auth0 login     | Sign in with Identity Provider    |
| Auth0/Okta only | Trusted Issuers                   |
| Auth0 token     | OIDC token, bearer token          |
| Auth0 user      | authenticated principal, identity |
| Connect Auth0   | Register Identity Provider        |
| Auth0 config    | Provider Configuration            |
| JWT user        | identity                          |
| SSO Provider    | Identity Provider                 |
| Auth0 SCIM      | Provisioning & Sync               |

### Approved UI section labels

- **Identity Providers** (not "Auth0 Settings")
- **Trusted Issuers** (not "SSO Providers")
- **OIDC Providers** (not "Auth0 Connections")
- **Provisioning & Sync** (not "Auth0 SCIM" or "Okta SCIM")
- **Claim Mapping** (not "Auth0 Rules")
- **Provider Configuration** (not "Auth0 Config")

### Principle

The UI presents identity as a protocol-level concept (OIDC, SAML, SCIM), not a vendor-level concept. Vendor names appear only inside provider badges and detail views where the specific provider is contextually relevant — never in navigation, page titles, or generic labels.

## Provider Badge Component Pattern

### Component contract

```tsx
interface ProviderBadgeProps {
  type: "oidc" | "saml" | "scim";
  label: string;
  provider: "auth0" | "okta" | "keycloak" | "custom";
  status: "active" | "disabled" | "pending";
  size?: "small" | "medium";
}
```

### Icon resolution

| Provider | Icon                     |
| -------- | ------------------------ |
| auth0    | Auth0 logo icon          |
| okta     | Okta logo icon           |
| keycloak | Keycloak logo icon       |
| custom   | Generic OIDC shield icon |

Unknown or unrecognized provider values fall back to the generic OIDC shield icon. Never render a broken or missing icon — always fall back.

### Status rendering

| Status   | Chip color | Label    |
| -------- | ---------- | -------- |
| active   | success    | Active   |
| disabled | default    | Disabled |
| pending  | warning    | Pending  |

### Implementation pattern

```tsx
<Stack direction="row" spacing={1.5} alignItems="center">
  <ProviderIcon provider={provider} size={size === "small" ? 20 : 28} />
  <Box>
    <Typography variant="body2" fontWeight={600}>
      {label}
    </Typography>
    <Typography variant="caption" color="text.secondary">
      {type.toUpperCase()}
    </Typography>
  </Box>
  <Chip
    label={status}
    size="small"
    color={
      status === "active"
        ? "success"
        : status === "pending"
          ? "warning"
          : "default"
    }
  />
</Stack>
```

## Additional References

See [provider list and registration patterns](references/provider-list.md) for list layout, row structure, empty states, and the 5-step registration flow.

See [claim mapping patterns](references/claim-mapping.md) for the claim mapping editor UI and Zod schemas.

See [copy reference](references/copy.md) for all approved page titles, button labels, empty state copy, error messages, and status labels.
