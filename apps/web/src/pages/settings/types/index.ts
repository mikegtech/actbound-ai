export interface SettingsProfileSnapshot {
  principalName: string;
  email: string;
}

export interface SettingsDefaultBoundary {
  label: string;
  value: "deny_unrecognized_delegations";
  description: string;
}

export interface SettingsSecuritySnapshot {
  activeContexts: number;
  delegatedPrincipalCount: number;
  sessionPolicy: string;
}

export interface SettingsSnapshot {
  profile: SettingsProfileSnapshot;
  defaultBoundary: SettingsDefaultBoundary;
  security: SettingsSecuritySnapshot;
}
