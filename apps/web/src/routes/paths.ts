export const rootPaths = {
  root: "/",
  dashboardRoot: "dashboard",
  assistantsRoot: "assistants",
  organizationsRoot: "organizations",
  resourcesRoot: "resources",
  policiesRoot: "policies",
  delegationsRoot: "delegations",
  securityRoot: "security",
  auditRoot: "audit",
  settingsRoot: "settings",
  loginRoot: "login",
  callbackRoot: "callback",
} as const;

const paths = {
  root: rootPaths.root,
  login: `/${rootPaths.loginRoot}`,
  callback: `/${rootPaths.callbackRoot}`,

  dashboard: `/${rootPaths.dashboardRoot}`,
  assistants: `/${rootPaths.assistantsRoot}`,
  assistantsDetail: `/${rootPaths.assistantsRoot}/$assistantId`,
  organizations: `/${rootPaths.organizationsRoot}`,
  organizationsDetail: `/${rootPaths.organizationsRoot}/$organizationId`,
  resources: `/${rootPaths.resourcesRoot}`,
  resourcesDetail: `/${rootPaths.resourcesRoot}/$resourceId`,
  policies: `/${rootPaths.policiesRoot}`,
  policiesDetail: `/${rootPaths.policiesRoot}/$policyId`,
  policiesSimulation: `/${rootPaths.policiesRoot}/$policyId/simulation`,
  delegations: `/${rootPaths.delegationsRoot}`,
  security: `/${rootPaths.securityRoot}`,
  securityControls: `/${rootPaths.securityRoot}/controls`,
  audit: `/${rootPaths.auditRoot}`,
  settings: `/${rootPaths.settingsRoot}`,
} as const;

export const authPaths = {
  login: paths.login,
  callback: paths.callback,
} as const;

export default paths;
