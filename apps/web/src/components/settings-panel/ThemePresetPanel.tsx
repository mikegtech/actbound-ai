import { Box, FormControlLabel, Radio, Typography } from "@mui/material";
import IconifyIcon from "components/base/IconifyIcon";
import type { ThemePreset } from "config";
import { useSettingsContext } from "providers/SettingsProvider";
import { SET_THEME_PRESET } from "reducers/SettingsReducer";
import SettingsPanelRadioGroup from "./SettingsPanelRadioGroup";

const PRESETS: { value: ThemePreset; title: string; icon: string }[] = [
  { value: "actbound", title: "ActBound", icon: "lucide:shield-check" },
  { value: "default-light", title: "Classic Light", icon: "lucide:sun" },
  { value: "default-dark", title: "Classic Dark", icon: "lucide:moon" },
];

const hoverStyle = {
  "&::after": {
    content: '""',
    position: "absolute",
    inset: 0,
    height: 1,
    width: 1,
    bgcolor: "primary.main",
    borderRadius: 1,
    mixBlendMode: "overlay",
    zIndex: 2,
  },
};

const ThemePresetPanel = () => {
  const { config, configDispatch } = useSettingsContext();

  const handleThemeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    configDispatch({
      type: SET_THEME_PRESET,
      payload: event.target.value as ThemePreset,
    });
  };

  return (
    <SettingsPanelRadioGroup
      value={config.themePreset}
      onChange={handleThemeChange}
    >
      {PRESETS.map((preset) => {
        const isActive = config.themePreset === preset.value;
        return (
          <FormControlLabel
            key={preset.value}
            value={preset.value}
            control={<Radio />}
            label={
              <Box
                sx={{
                  bgcolor: "none",
                  position: "relative",
                  width: "100%",
                }}
              >
                <Box
                  sx={[
                    isActive && hoverStyle,
                    {
                      height: 92,
                      width: "100%",
                      position: "relative",
                      mb: 1,
                      backgroundColor: "background.paper",
                      borderRadius: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid",
                      borderColor: isActive ? "primary.main" : "dividerLight",
                    },
                  ]}
                >
                  <IconifyIcon
                    icon={preset.icon}
                    sx={{
                      fontSize: 32,
                      color: isActive ? "primary.main" : "text.secondary",
                    }}
                  />

                  {isActive && (
                    <IconifyIcon
                      icon="material-symbols:check-circle-rounded"
                      sx={{
                        color: "primary.main",
                        fontSize: 24,
                        position: "absolute",
                        top: 8,
                        right: 8,
                      }}
                    />
                  )}
                </Box>

                <Typography
                  variant="subtitle2"
                  sx={{
                    textAlign: "center",
                    color: isActive ? "primary.main" : "text.secondary",
                  }}
                >
                  {preset.title}
                </Typography>
              </Box>
            }
          />
        );
      })}
    </SettingsPanelRadioGroup>
  );
};

export default ThemePresetPanel;
