# Token Broker Foundation

## Purpose

Phase 3 introduces a token broker foundation in `services/orchestrator-api` to reduce repeated Auth0 M2M token issuance. The broker does not return raw secrets yet. Instead, it exposes safe token metadata, cache behavior, and explicit integration seams for later Auth0 wiring.

## Cache-First Flow

1. A client submits a typed broker request that describes audience, scopes, purpose, and intent (`m2m` or `delegated`).
2. The broker normalizes that request with actor and subject context from the backend.
3. It computes a stable cache key from safe request characteristics.
4. It checks the cache before any issuance path.
5. On a cache hit, it returns safe cached metadata and records reuse.
6. On a cache miss, it follows a placeholder issuance path, stores safe metadata, and returns the same safe shape to the caller.

## Why This Reduces M2M Overuse

- Repeated requests for the same audience, scopes, actor, and subject can reuse cached broker entries instead of forcing a new issuance path every time.
- The broker centralizes issuance decisions so reuse can be measured and demonstrated with hit or miss metadata.
- Redis is the preferred cache backend when configured, which makes reuse more realistic for a multi-process deployment. Local development can still use an in-memory fallback.

## Safe Metadata Returned

The broker returns metadata suitable for UI and demo/debug views:

- cache hit or miss
- broker source (`cached`, `issued`, `delegated-placeholder`)
- source type (`m2m`, `delegated`, `cached`)
- audience
- scopes
- expiration timestamps
- actor and subject summaries
- a safe token handle reference

No raw token material is returned or stored in the repo.

## Future Auth0 Integration Seams

- TODO: Replace placeholder M2M issuance with Auth0 client credentials exchange
- TODO: Replace delegated placeholder issuance with Auth0 Token Vault retrieval
- TODO: Add stronger rate limiting, budget controls, and distributed invalidation around the broker path

The current foundation keeps those seams explicit so the hackathon demo can explain how token reuse lowers unnecessary M2M pressure before the final Auth0-specific wiring lands.
