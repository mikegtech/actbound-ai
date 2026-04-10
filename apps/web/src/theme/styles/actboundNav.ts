import {
  buttonClasses,
  dividerClasses,
  drawerClasses,
  iconButtonClasses,
  listItemButtonClasses,
  listItemIconClasses,
  listItemTextClasses,
  listSubheaderClasses,
  paperClasses,
  type Theme,
  toolbarClasses,
} from "@mui/material";
import type { SystemStyleObject } from "@mui/system";

export const sidenavActboundStyle: SystemStyleObject<Theme> = {
  [`& .${drawerClasses.paper}`]: {
    backgroundColor: "var(--mui-palette-secondary-lighter)", // aligns with bg-[#f2f3ff]
    border: 0,
    borderRight: "1px solid var(--mui-palette-dividerLight)",
    [`& .${listSubheaderClasses.root}`]: {
      color: "var(--mui-palette-text-secondary)",
      bgcolor: "transparent",
    },
    [`& .${listItemButtonClasses.root}`]: {
      color: "var(--mui-palette-text-secondary)",
      borderRadius: "8px",
      margin: "0 8px 4px 8px",
      [`& .${listItemIconClasses.root}`]: {
        color: "var(--mui-palette-text-secondary)",
      },
      "& .expand-icon": {
        color: "var(--mui-palette-text-secondary)",
      },
      "&:hover": {
        backgroundColor: "var(--mui-palette-background-elevation2)",
      },
      [`&.${listItemButtonClasses.selected}`]: {
        backgroundColor: "var(--mui-palette-background-paper)",
        color: "var(--mui-palette-primary-main)",
        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        [`& .${listItemTextClasses.primary}`]: {
          color: "var(--mui-palette-primary-main)",
          fontWeight: 600,
        },
        [`& .${listItemIconClasses.root}`]: {
          color: "var(--mui-palette-primary-main)",
        },
        "& .expand-icon": {
          color: "var(--mui-palette-primary-main)",
        },
      },
    },
    [`& .${iconButtonClasses.root}`]: {
      color: "var(--mui-palette-text-secondary)",
      "&:hover": {
        backgroundColor: "var(--mui-palette-background-elevation2)",
      },
      "&.active": {
        color: "var(--mui-palette-primary-main)",
        backgroundColor: "var(--mui-palette-background-paper)",
      },
    },
  },
  "&.slim-sidenav": {
    [`& .${dividerClasses.root}`]: {
      borderColor: "var(--mui-palette-dividerLight)",
    },
  },
  "&.stacked-sidenav": {
    [`& .${listItemButtonClasses.root}`]: {
      color: "var(--mui-palette-text-primary)",
    },
  },
};

export const topnavActboundStyle: SystemStyleObject<Theme> = {
  borderColor: "transparent",
  borderBottom: "1px solid var(--mui-palette-dividerLight)",
  backdropFilter: "blur(12px)",
  [`&.${paperClasses.root}`]: {
    backgroundColor:
      "color-mix(in srgb, var(--mui-palette-background-default) 85%, transparent)",
    [`& .${toolbarClasses.root}`]: {
      bgcolor: "transparent",
      "& .search-box-button, & .search-box-input": {
        backgroundColor: "var(--mui-palette-background-elevation1) !important",
        color: "var(--mui-palette-text-secondary) !important",
        "&:hover": {
          backgroundColor:
            "var(--mui-palette-background-elevation2) !important",
        },
        "&:focus-within": {
          boxShadow: "0 0 0 2px rgba(0, 82, 204, 0.2)",
          borderColor: "var(--mui-palette-primary-main)",
        },
      },
    },
    "& .appbar-drawer-button": {
      bgcolor: "transparent",
      color: "var(--mui-palette-text-secondary) !important",
      "&:hover": {
        backgroundColor: "var(--mui-palette-background-elevation2)",
      },
    },
    [`& .${buttonClasses.root}`]: {
      color: "var(--mui-palette-text-secondary)",
      "&.active, &:hover": {
        backgroundColor: "var(--mui-palette-background-elevation2)",
        color: "var(--mui-palette-text-primary)",
      },
    },
    "& .nav-items": {
      [`& .${buttonClasses.root}`]: {
        "&.active, &:hover": {
          backgroundColor: "var(--mui-palette-background-elevation2)",
        },
      },
    },
    "& .action-items": {
      [`& .${buttonClasses.root}`]: {
        "&.active, &:hover": {
          backgroundColor: "var(--mui-palette-background-elevation2)",
        },
      },
    },
  },
};
