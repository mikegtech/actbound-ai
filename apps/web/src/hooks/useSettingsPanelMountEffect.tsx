import type { Config } from "config";
import {
  type SettingsPanelConfig,
  useSettingsPanelContext,
} from "providers/SettingsPanelProvider";
import { useEffect } from "react";

const useSettingsPanelMountEffect = (effects: Partial<SettingsPanelConfig>) => {
  const { settingsPanelConfig, setSettingsPanelConfig } =
    useSettingsPanelContext();

  useEffect(() => {
    setSettingsPanelConfig(effects);
    const undoEffects = Object.keys(effects).reduce((acc, effect) => {
      // @ts-expect-error settings panel keys intentionally mirror Config keys.
      acc[effect] = settingsPanelConfig[effect as keyof Config];
      return acc;
    }, {} as Partial<SettingsPanelConfig>);
    return () => {
      setSettingsPanelConfig(undoEffects);
    };
  }, [settingsPanelConfig, setSettingsPanelConfig, effects]);
};

export default useSettingsPanelMountEffect;
