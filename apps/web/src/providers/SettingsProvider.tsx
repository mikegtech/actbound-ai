import type { Config } from "config";
import {
  createContext,
  type Dispatch,
  type PropsWithChildren,
  use,
  useEffect,
  useCallback,
} from "react";
import { useTranslation } from "react-i18next";
import {
  type ACTIONTYPE,
  COLLAPSE_NAVBAR,
  EXPAND_NAVBAR,
  REFRESH,
  RESET,
  SET_CONFIG,
  SET_LOCALE,
  SET_NAV_COLOR,
  SET_NAVIGATION_MENU_TYPE,
  SET_SIDENAV_SHAPE,
  SET_THEME_PRESET,
} from "reducers/SettingsReducer";
import { useSettingsStore } from "stores/useSettingsStore";

interface SettingsContextInterFace {
  config: Config;
  configDispatch: Dispatch<ACTIONTYPE>;
  setConfig: (payload: Partial<Config>) => void;
  handleDrawerToggle: () => void;
  toggleNavbarCollapse: () => void;
}

export const SettingsContext = createContext({} as SettingsContextInterFace);

const SettingsProvider = ({ children }: PropsWithChildren) => {
  const store = useSettingsStore();
  const { i18n } = useTranslation();

  const config: Config = {
    assetsDir: store.assetsDir,
    textDirection: store.textDirection,
    themePreset: store.themePreset,
    navigationMenuType: store.navigationMenuType,
    sidenavType: store.sidenavType,
    sidenavCollapsed: store.sidenavCollapsed,
    topnavType: store.topnavType,
    navColor: store.navColor,
    openNavbarDrawer: store.openNavbarDrawer,
    drawerWidth: store.drawerWidth,
    locale: store.locale,
  };

  const configDispatch = useCallback((action: ACTIONTYPE) => {
    const currentState = useSettingsStore.getState();
    switch (action.type) {
      case SET_CONFIG:
        currentState.setConfig(action.payload);
        break;
      case COLLAPSE_NAVBAR:
        currentState.collapseNavbar();
        break;
      case EXPAND_NAVBAR:
        currentState.expandNavbar();
        break;
      case SET_LOCALE:
        currentState.setLocale(action.payload);
        break;
      case SET_THEME_PRESET:
        currentState.setThemePreset(action.payload);
        break;
      case SET_NAVIGATION_MENU_TYPE:
        currentState.setNavigationMenuType(action.payload);
        break;
      case SET_SIDENAV_SHAPE:
        currentState.setSidenavShape(action.payload);
        break;
      case SET_NAV_COLOR:
        currentState.setNavColor(action.payload);
        break;
      case RESET:
        currentState.reset();
        break;
      case REFRESH:
        currentState.setConfig({});
        break;
    }
  }, []);

  useEffect(() => {
    i18n.changeLanguage(store.locale.split("-").join(""));
  }, [store.locale, i18n]);

  return (
    <SettingsContext
      value={{
        config,
        configDispatch,
        setConfig: store.setConfig,
        handleDrawerToggle: store.handleDrawerToggle,
        toggleNavbarCollapse: store.toggleNavbarCollapse,
      }}
    >
      {children}
    </SettingsContext>
  );
};

export const useSettingsContext = () => use(SettingsContext);

export default SettingsProvider;
