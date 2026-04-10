import { useSettingsPanelStore } from "stores/useSettingsPanelStore";

export interface SettingsPanelConfig {
  showSettingPanelButton: boolean;
  openSettingPanel: boolean;
  disableNavigationMenuSection: boolean;
  disableSidenavShapeSection: boolean;
  disableTopShapeSection: boolean;
  disableNavColorSection: boolean;
}

export const useSettingsPanelContext = () => {
  const store = useSettingsPanelStore();

  const settingsPanelConfig: SettingsPanelConfig = {
    showSettingPanelButton: store.showSettingPanelButton,
    openSettingPanel: store.openSettingPanel,
    disableNavigationMenuSection: store.disableNavigationMenuSection,
    disableSidenavShapeSection: store.disableSidenavShapeSection,
    disableTopShapeSection: store.disableTopShapeSection,
    disableNavColorSection: store.disableNavColorSection,
  };

  return {
    settingsPanelConfig,
    setSettingsPanelConfig: store.setSettingsPanelConfig,
  };
};
