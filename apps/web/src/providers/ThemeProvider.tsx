import { CssBaseline, ThemeProvider as MuiThemeProvider } from "@mui/material";
import { type PropsWithChildren, useMemo } from "react";
import RTLMode from "theme/RTLMode";
import { createTheme } from "theme/theme.ts";
import { useSettingsContext } from "./SettingsProvider";

export type ThemeMode = "light" | "dark" | "system";

const ThemeProvider = ({ children }: PropsWithChildren) => {
  const {
    config: { textDirection, locale, themePreset },
  } = useSettingsContext();

  const customTheme = useMemo(
    () =>
      createTheme({
        direction: textDirection,
        locale,
        preset: themePreset,
      }),
    [textDirection, locale, themePreset],
  );

  return (
    <MuiThemeProvider
      disableTransitionOnChange
      theme={customTheme}
      defaultMode="light"
      modeStorageKey="aurora-mode"
    >
      <CssBaseline enableColorScheme />
      <RTLMode>{children}</RTLMode>
    </MuiThemeProvider>
  );
};

export default ThemeProvider;
