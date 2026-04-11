import { useQuery } from "@tanstack/react-query";
import type { SettingsSnapshot } from "../types";

// TODO(sdk-consolidation): Replace with gateway-facing settings read model when available.
const MOCK_SETTINGS: SettingsSnapshot = {
  profile: {
    principalName: "Alice Security",
    email: "alice.security@actbound.ai",
  },
  defaultBoundary: {
    label: "Deny unrecognized delegations",
    value: "deny_unrecognized_delegations",
    description:
      "Requests from assistant workflows without an explicit trust boundary are denied by default.",
  },
  security: {
    activeContexts: 3,
    delegatedPrincipalCount: 4,
    sessionPolicy:
      "Read-only frontend mock. Revocation requires gateway auth flow.",
  },
};

export const useSettingsSnapshot = () => {
  return useQuery<SettingsSnapshot>({
    queryKey: ["settings", "snapshot"],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return MOCK_SETTINGS;
    },
    staleTime: 1000 * 60 * 5,
  });
};
