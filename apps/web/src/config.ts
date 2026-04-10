import { mainDrawerWidth } from "lib/constants";

export type ThemeMode = "light" | "dark" | "system";
export type ThemePreset = "default-light" | "default-dark" | "actbound";
export type NavigationMenuType = "sidenav" | "topnav" | "combo";
export type SidenavType = "default" | "stacked" | "slim";
export type TopnavType = "default" | "stacked" | "slim";
export type TextDirection = "ltr" | "rtl";
export type NavColor = "default" | "vibrant" | "actbound";
export type SupportedLocales =
  | "en-US"
  | "fr-FR"
  | "bn-BD"
  | "zh-CN"
  | "hi-IN"
  | "ar-SA";

export interface Config {
  assetsDir: string;
  textDirection: TextDirection;
  themePreset: ThemePreset;
  navigationMenuType: NavigationMenuType;
  sidenavType: SidenavType;
  sidenavCollapsed: boolean;
  topnavType: TopnavType;
  navColor: NavColor;
  openNavbarDrawer: boolean;
  drawerWidth: number;
  locale: SupportedLocales;
}

export const initialConfig: Config = {
  assetsDir: import.meta.env.VITE_ASSET_BASE_URL ?? "",
  textDirection: "ltr",
  themePreset: "actbound",
  navigationMenuType: "sidenav",
  sidenavType: "default",
  sidenavCollapsed: false,
  topnavType: "default",
  navColor: "default",
  openNavbarDrawer: false,
  drawerWidth: mainDrawerWidth.full,
  locale: "en-US",
};

export const defaultJwtAuthCredentials = {
  email: "operator@actbound.dev",
  password: "password123",
};
