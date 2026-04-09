export type { Principal, PrincipalType } from "./principal.js";
export {
  principalFromClaims,
  demoPrincipal,
  CLAIM_KEYS,
  CLAIM_NAMESPACE,
} from "./principal.js";

export type {
  IssuerType,
  TrustedIssuer,
  ClaimMappingProfile,
} from "./issuer-types.js";
export {
  AUTH0_CLAIM_PROFILE,
  KEYCLOAK_CLAIM_PROFILE,
  CLAIM_PROFILES,
} from "./issuer-types.js";

export type {
  NormalizedPrincipal,
  IdentitySource,
} from "./normalized-principal.js";

export type {
  IdentityBinding,
  CreateIdentityBindingInput,
  IdentityBindingRepository,
} from "./identity-binding.js";

export type {
  ClaimNormalizer,
  NormalizedClaims,
  RawTokenClaims,
} from "./claim-normalizer.js";

export type { TrustedIssuerRepository } from "./trusted-issuer-repository.js";
