import { users } from "./users";

export const files = [
  {
    name: "assistant-policy-export.zip",
    path: ":: exports / actbound / governance /",
    icon: "material-symbols:folder-zip-outline-rounded",
  },
  {
    name: "delegation-boundary-map.svg",
    path: ":: docs / trust-boundaries /",
    icon: "material-symbols:account-tree-outline-rounded",
  },
  {
    name: "resource-scope-review.pdf",
    path: ":: audit / evidence /",
    icon: "material-symbols:picture-as-pdf-outline-rounded",
  },
];

export const contacts = [
  {
    name: "Ava Patel",
    avatar: users[11].avatar,
  },
  {
    name: "Maya Chen",
    avatar: users[4].avatar,
    disabled: true,
  },
  {
    name: "Jordan Rivera",
    avatar: users[3].avatar,
  },
  {
    name: "Noah Kim",
    avatar: users[14].avatar,
  },
  {
    name: "Priya Shah",
    avatar: users[8].avatar,
  },
];

export const tags = [
  "Assistants",
  "Delegations",
  "Policies",
  "Resources",
  "Security",
  "Audit",
  "Organizations",
  "Access Review",
];

export const breadcrumbs = [
  [
    {
      label: "ActBound",
      href: "#!",
    },
    {
      label: "Policies",
      href: "#!",
    },
    {
      label: "Simulation",
      href: "#!",
    },
    {
      label: "Trace Result",
      href: "#!",
      active: true,
    },
  ],
  [
    {
      label: "ActBound",
      href: "#!",
    },
    {
      label: "Organizations",
      href: "#!",
      active: true,
    },
  ],
  [
    {
      label: "ActBound",
      href: "#!",
    },
    {
      label: "Delegations",
      href: "#!",
      active: true,
    },
  ],
];

export default {
  files,
  contacts,
  tags,
  breadcrumbs,
};
