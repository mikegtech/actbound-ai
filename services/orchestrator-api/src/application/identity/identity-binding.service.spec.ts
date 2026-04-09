import { describe, it, expect, vi, beforeEach } from "vitest";
import { IdentityBindingService } from "./identity-binding.service";
import type {
  IdentityBindingRepository,
  IdentityBinding,
} from "../../domain/identity/identity-binding";

function makeMockRepo(): IdentityBindingRepository {
  return {
    findByExternalIdentity: vi.fn(),
    findByInternalSubject: vi.fn(),
    findByTenant: vi.fn(),
    create: vi.fn(),
    touchLastLogin: vi.fn(),
  };
}

function makeBinding(
  overrides: Partial<IdentityBinding> = {},
): IdentityBinding {
  return {
    id: "bind-1",
    issuer: "https://auth.actbound.ai/",
    externalSub: "auth0|abc123",
    internalSubjectId: "11111111-1111-1111-1111-111111111111",
    issuerType: "auth0",
    tenantId: "acme",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("IdentityBindingService", () => {
  let repo: ReturnType<typeof makeMockRepo>;
  let service: IdentityBindingService;

  beforeEach(() => {
    repo = makeMockRepo();
    service = new IdentityBindingService(repo);
  });

  it("resolves existing binding and updates last login", async () => {
    const existing = makeBinding();
    vi.mocked(repo.findByExternalIdentity).mockResolvedValue(existing);

    const result = await service.resolveOrCreate({
      issuer: "https://auth.actbound.ai/",
      externalSub: "auth0|abc123",
      issuerType: "auth0",
      tenantId: "acme",
    });

    expect(result.internalSubjectId).toBe(
      "11111111-1111-1111-1111-111111111111",
    );
    expect(repo.touchLastLogin).toHaveBeenCalledWith("bind-1");
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("auto-provisions binding on first login", async () => {
    vi.mocked(repo.findByExternalIdentity).mockResolvedValue(null);
    const newBinding = makeBinding({
      id: "bind-new",
      internalSubjectId: "22222222-2222-2222-2222-222222222222",
    });
    vi.mocked(repo.create).mockResolvedValue(newBinding);

    const result = await service.resolveOrCreate({
      issuer: "https://auth.actbound.ai/",
      externalSub: "auth0|new-user",
      issuerType: "auth0",
      tenantId: "acme",
    });

    expect(result.internalSubjectId).toBe(
      "22222222-2222-2222-2222-222222222222",
    );
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        issuer: "https://auth.actbound.ai/",
        externalSub: "auth0|new-user",
        issuerType: "auth0",
        tenantId: "acme",
      }),
    );
  });

  it("rejects suspended binding", async () => {
    const suspended = makeBinding({ status: "suspended" });
    vi.mocked(repo.findByExternalIdentity).mockResolvedValue(suspended);

    await expect(
      service.resolveOrCreate({
        issuer: "https://auth.actbound.ai/",
        externalSub: "auth0|abc123",
        issuerType: "auth0",
        tenantId: "acme",
      }),
    ).rejects.toThrow("Identity binding is suspended");
  });

  it("finds binding by internal subject", async () => {
    const binding = makeBinding();
    vi.mocked(repo.findByInternalSubject).mockResolvedValue(binding);

    const result = await service.findByInternalSubject(
      binding.internalSubjectId,
    );
    expect(result?.issuer).toBe("https://auth.actbound.ai/");
  });
});
