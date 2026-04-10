import type { SxProps } from "@mui/material";
import paths from "./paths";

export interface SubMenuItem {
  name: string;
  pathName: string;
  key?: string;
  selectionPrefix?: string;
  path?: string;
  active?: boolean;
  icon?: string;
  iconSx?: SxProps;
  items?: SubMenuItem[];
}

export interface MenuItem {
  id: string;
  key?: string; // used for the locale
  subheader: string;
  icon: string;
  iconSx?: SxProps;
  items: SubMenuItem[];
}

const sitemap: MenuItem[] = [
  {
    id: "domains",
    subheader: "ActBound",
    key: "domains",
    icon: "material-symbols:view-quilt-outline",
    items: [
      {
        name: "Dashboard",
        key: "dashboard",
        path: paths.dashboard,
        pathName: "dashboard",
        icon: "material-symbols:dashboard-outline-rounded",
        active: true,
      },
      {
        name: "Assistants",
        key: "assistants",
        path: paths.assistants,
        pathName: "assistants",
        icon: "material-symbols:robot-2-outline",
        active: true,
      },
      {
        name: "Organizations",
        key: "organizations",
        path: paths.organizations,
        pathName: "organizations",
        icon: "material-symbols:business-center-outline-rounded",
        active: true,
      },
      {
        name: "Resources",
        key: "resources",
        path: paths.resources,
        pathName: "resources",
        icon: "material-symbols:cloud-done-outline-rounded",
        active: true,
      },
      {
        name: "Policies",
        key: "policies",
        path: paths.policies,
        pathName: "policies",
        icon: "material-symbols:policy-outline",
        active: true,
      },
      {
        name: "Delegations",
        key: "delegations",
        path: paths.delegations,
        pathName: "delegations",
        icon: "material-symbols:account-tree-outline-rounded",
        active: true,
      },
      {
        name: "Security",
        key: "security",
        path: paths.security,
        pathName: "security",
        icon: "material-symbols:security-rounded",
        active: true,
      },
      {
        name: "Audit",
        key: "audit",
        path: paths.audit,
        pathName: "audit",
        icon: "material-symbols:manage-search-outline-rounded",
        active: true,
      },
      {
        name: "Settings",
        key: "settings",
        path: paths.settings,
        pathName: "settings",
        icon: "material-symbols:settings-outline-rounded",
        active: true,
      },
    ],
  },
];

export default sitemap;
