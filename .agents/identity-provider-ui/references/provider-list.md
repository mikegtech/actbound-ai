# Identity Provider List UI Pattern

The provider list is displayed in the Enterprise Settings area under an "Identity Configuration" section. Each connected provider is rendered as a row in a card-based list.

## Row structure

Each provider row contains:

```
[Provider Badge]  [Protocol Tag]  [Status Chip]  [Last Sync]  [Configure]
```

| Element          | Component               | Details                                            |
| ---------------- | ----------------------- | -------------------------------------------------- |
| Provider badge   | ProviderBadge           | Icon + label (e.g. Okta icon + "Okta Production")  |
| Protocol tag     | Chip variant="outlined" | OIDC, SAML 2.0, or SCIM                            |
| Status chip      | Chip color by status    | Active, Disabled, Pending                          |
| Last sync        | Typography caption      | Relative timestamp (e.g. "2 hours ago") or "Never" |
| Configure action | IconButton or Button    | Opens provider detail/edit view                    |

## Layout pattern

```tsx
<Card variant="outlined">
  <CardContent>
    <Stack spacing={0}>
      {providers.map((provider) => (
        <Stack
          key={provider.id}
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            py: 2,
            borderBottom: 1,
            borderColor: "divider",
            "&:last-child": { border: 0 },
          }}
        >
          <ProviderBadge
            type={provider.protocol}
            label={provider.displayName}
            provider={provider.providerType}
            status={provider.status}
          />
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="caption" color="text.secondary">
              {provider.lastSyncAt
                ? dayjs(provider.lastSyncAt).fromNow()
                : "Never synced"}
            </Typography>
            <Button size="small" variant="outlined" color="neutral">
              Configure
            </Button>
          </Stack>
        </Stack>
      ))}
    </Stack>
  </CardContent>
</Card>
```

## Empty state

When no providers are registered, show a Lottie empty state illustration with:

- Heading: "No Identity Providers"
- Subtext: "Register an OIDC provider to enable authentication for your organization."
- Action: "Register Provider" button

# Provider Registration Flow Pattern

Five-step guided flow for registering a new identity provider.

## Step 1 — Select Provider Type

Radio card selection:

- **Auth0** — Managed cloud identity (icon + description)
- **Okta** — Managed cloud identity (icon + description)
- **Keycloak** — Self-hosted identity (icon + description)
- **Custom OIDC** — Any OIDC-compliant provider (generic icon + description)

Layout: 2x2 grid of selectable cards. Each card shows provider icon, name, and one-line description.

## Step 2 — Enter Issuer URL

Single text input for the OIDC issuer URL.

- Placeholder: `https://your-domain.auth0.com/` (adapts to selected provider type)
- On blur or submit: auto-fetch `/.well-known/openid-configuration`
- Show success state if discovery document resolves
- Show error state with message if it fails
- Auto-populate JWKS endpoint from discovery document

## Step 3 — Configure Claim Mapping

Present the claim mapping profile editor (see [claim mapping patterns](claim-mapping.md)).

- Pre-populate with default mapping profile for the selected provider type
- Allow override of each mapping field
- Show preview of how a sample token would resolve

## Step 4 — Set Tenant Binding

- Select which tenant this issuer serves
- Configure valid audience values
- Set display name for the provider

## Step 5 — Test & Activate

- "Test Connection" button — validates JWKS fetch and discovery document
- Show test result with pass/fail for each check
- "Activate" button — enables the issuer in the registry
- Option to save as disabled (register now, activate later)

## Stepper component

Use MUI Stepper with these labels:

1. Provider Type
2. Issuer URL
3. Claim Mapping
4. Tenant Binding
5. Test & Activate
