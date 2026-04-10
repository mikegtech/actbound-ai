import {
  type Config,
  initialConfig,
  type NavColor,
  type NavigationMenuType,
  type SidenavType,
  type SupportedLocales,
  type ThemePreset,
} from "config";
import { mainDrawerWidth } from "lib/constants";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsActions {
  setConfig: (payload: Partial<Config>) => void;
  collapseNavbar: () => void;
  expandNavbar: () => void;
  toggleNavbarCollapse: () => void;
  handleDrawerToggle: () => void;
  setLocale: (locale: SupportedLocales) => void;
  setThemePreset: (preset: ThemePreset) => void;
  setNavigationMenuType: (type: NavigationMenuType) => void;
  setSidenavShape: (shape: SidenavType) => void;
  setNavColor: (color: NavColor) => void;
  reset: () => void;
}

type SettingsStore = Config & SettingsActions;

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      ...initialConfig,

      setConfig: (payload) => set(payload),

      collapseNavbar: () =>
        set((state) => ({
          sidenavCollapsed: true,
          drawerWidth:
            state.sidenavType === "stacked"
              ? mainDrawerWidth.stackedNavCollapsed
              : mainDrawerWidth.collapsed,
        })),

      expandNavbar: () =>
        set({
          sidenavCollapsed: false,
          drawerWidth: mainDrawerWidth.full,
        }),

      toggleNavbarCollapse: () => {
        const state = get();
        if (state.sidenavCollapsed) {
          state.expandNavbar();
        } else {
          state.collapseNavbar();
        }
      },

      handleDrawerToggle: () =>
        set((state) => ({
          openNavbarDrawer: !state.openNavbarDrawer,
        })),

      setLocale: (locale) =>
        set({
          locale,
          textDirection: locale === "ar-SA" ? "rtl" : "ltr",
        }),

      setThemePreset: (themePreset) => set({ themePreset }),

      setNavigationMenuType: (type) => {
        switch (type) {
          case "sidenav":
            set({
              navigationMenuType: "sidenav",
              drawerWidth: mainDrawerWidth.full,
            });
            break;
          case "topnav":
            set({
              navigationMenuType: "topnav",
              sidenavCollapsed: false,
              drawerWidth: mainDrawerWidth.full,
            });
            break;
          case "combo":
            set({
              navigationMenuType: "combo",
              sidenavCollapsed: false,
              drawerWidth: mainDrawerWidth.full,
            });
            break;
        }
      },

      setSidenavShape: (shape) => {
        switch (shape) {
          case "default":
            set({
              sidenavType: "default",
              sidenavCollapsed: false,
              drawerWidth: mainDrawerWidth.full,
            });
            break;
          case "slim":
            set({
              sidenavType: "slim",
              sidenavCollapsed: false,
              drawerWidth: mainDrawerWidth.slim,
            });
            break;
          case "stacked":
            set({
              sidenavType: "stacked",
              sidenavCollapsed: false,
              drawerWidth: mainDrawerWidth.full,
            });
            break;
        }
      },

      setNavColor: (navColor) => set({ navColor }),

      reset: () =>
        set({
          ...initialConfig,
        }),
    }),
    {
      name: "actbound-settings",
      partialize: (state) => ({
        themePreset: state.themePreset,
        sidenavCollapsed: state.sidenavCollapsed,
        sidenavType: state.sidenavType,
        textDirection: state.textDirection,
        navigationMenuType: state.navigationMenuType,
        topnavType: state.topnavType,
        navColor: state.navColor,
        locale: state.locale,
      }),
    },
  ),
);
