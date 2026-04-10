# Claim Mapping UI Pattern

The claim mapping editor shows how raw JWT claims map to the internal principal model.

## Layout

Two-column layout:

- Left column: "Issuer Claims" — raw claim keys from the JWT
- Right column: "Internal Fields" — normalized principal fields
- Connecting lines or arrows between mapped pairs

## Mapping row structure

```
[Raw Claim Key Input]  →  [Internal Field Label]  [Status Icon]
```

| Internal field   | Default claim key (Auth0) | Default claim key (Okta) | Default claim key (Keycloak) |
| ---------------- | ------------------------- | ------------------------ | ---------------------------- |
| External Subject | `sub`                     | `sub`                    | `sub`                        |
| Email            | `email`                   | `email`                  | `email`                      |
| Display Name     | `name`                    | `name`                   | `preferred_username`         |
| Roles            | `https://[domain]/roles`  | `groups`                 | `realm_access.roles`         |

## Editing behavior

- Each raw claim key is an editable text field
- Internal field labels are read-only (these are the target model)
- Status icon shows: green check if the claim path is valid against a sample token, yellow warning if untested, red X if known invalid
- "Add Custom Mapping" button for additional claim fields

## Role transform section

Below the field mappings, show the role transform configuration:

- Transform type selector: Direct, Prefix Strip, Lookup Table
- For Lookup Table: editable key-value pairs (issuer role → internal role)
- For Prefix Strip: single input for the prefix to remove

# Zod Schemas

## ProviderRegistrationFormData

```ts
import { z } from "zod";

export const providerRegistrationSchema = z.object({
  providerType: z.enum(["auth0", "okta", "keycloak", "custom"]),
  issuerUrl: z
    .string()
    .url("Must be a valid URL")
    .nonempty("Issuer URL is required"),
  displayName: z.string().nonempty("Display name is required"),
  audiences: z
    .array(z.string().nonempty())
    .min(1, "At least one audience is required"),
  tenantId: z.string().nonempty("Tenant is required"),
  enabled: z.boolean(),
});

export type ProviderRegistrationFormData = z.infer<
  typeof providerRegistrationSchema
>;
```

## ClaimMappingProfile

```ts
export const claimMappingProfileSchema = z.object({
  name: z.string().nonempty("Profile name is required"),
  description: z.string().optional(),
  mappings: z.object({
    externalSubject: z.string().nonempty("Subject claim path is required"),
    email: z.string().nonempty("Email claim path is required"),
    displayName: z.string().nonempty("Display name claim path is required"),
    roles: z.string().nonempty("Roles claim path is required"),
  }),
  roleTransform: z.object({
    type: z.enum(["direct", "prefix-strip", "lookup"]),
    config: z.record(z.string(), z.string()),
  }),
});

export type ClaimMappingProfile = z.infer<typeof claimMappingProfileSchema>;
```

## TrustedIssuerEntry

```ts
export const trustedIssuerEntrySchema = z.object({
  id: z.string(),
  issuerUrl: z.string().url(),
  jwksEndpoint: z.string().url(),
  claimMappingProfile: z.string(),
  tenantId: z.string(),
  audiences: z.array(z.string()),
  enabled: z.boolean(),
  metadata: z.object({
    providerType: z.enum(["auth0", "okta", "keycloak", "custom"]),
    displayName: z.string(),
    registeredAt: z.string(),
    lastSyncAt: z.string().nullable(),
  }),
});

export type TrustedIssuerEntry = z.infer<typeof trustedIssuerEntrySchema>;
```
