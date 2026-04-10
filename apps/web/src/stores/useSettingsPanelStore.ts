import { create } from "zustand";

interface SettingsPanelConfig {
  showSettingPanelButton: boolean;
  openSettingPanel: boolean;
  disableNavigationMenuSection: boolean;
  disableSidenavShapeSection: boolean;
  disableTopShapeSection: boolean;
  disableNavColorSection: boolean;
}

interface SettingsPanelStore extends SettingsPanelConfig {
  setSettingsPanelConfig: (config: Partial<SettingsPanelConfig>) => void;
}

export const useSettingsPanelStore = create<SettingsPanelStore>()((set) => ({
  showSettingPanelButton: true,
  openSettingPanel: false,
  disableNavigationMenuSection: false,
  disableSidenavShapeSection: false,
  disableTopShapeSection: false,
  disableNavColorSection: false,
  setSettingsPanelConfig: (config) => set(config),
}));
