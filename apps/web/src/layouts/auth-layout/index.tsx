import { Outlet } from "@tanstack/react-router";
import Splash from "components/loading/Splash";
import useSettingsPanelMountEffect from "hooks/useSettingsPanelMountEffect";
import { Suspense } from "react";

const AuthLayout = () => {
  useSettingsPanelMountEffect({
    disableNavigationMenuSection: true,
    disableSidenavShapeSection: true,
    disableTopShapeSection: true,
    disableNavColorSection: true,
  });
  return (
    <Suspense fallback={<Splash />}>
      <Outlet />
    </Suspense>
  );
};

export default AuthLayout;
