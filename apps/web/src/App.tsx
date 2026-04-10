import { Outlet, useLocation } from "@tanstack/react-router";
import SettingPanelToggler from "components/settings-panel/SettingPanelToggler";
import SettingsPanel from "components/settings-panel/SettingsPanel";
import useIcons from "hooks/useIcons";
import { useThemeMode } from "hooks/useThemeMode";
import AuthProvider from "providers/AuthProvider";
import { ConfigProvider } from "providers/ConfigProvider";
import { useSettingsContext } from "providers/SettingsProvider";
import { useEffect, useLayoutEffect } from "react";
import { REFRESH } from "reducers/SettingsReducer";

const App = () => {
  const { pathname } = useLocation();
  const { mode } = useThemeMode();
  const { configDispatch } = useSettingsContext();
  useIcons();

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: refresh theme on mode change
  useLayoutEffect(() => {
    configDispatch({ type: REFRESH });
  }, [mode, configDispatch]);

  return (
    <ConfigProvider>
      <AuthProvider>
        <Outlet />
        <SettingsPanel />
        <SettingPanelToggler />
      </AuthProvider>
    </ConfigProvider>
  );
};

export default App;
