import { type Breakpoint, type ToolbarOwnProps, useTheme } from "@mui/material";
import { useLocation } from "@tanstack/react-router";
import { mainDrawerWidth } from "lib/constants";
import { useBreakpoints } from "providers/BreakpointsProvider";
import { useSettingsContext } from "providers/SettingsProvider";
import {
  createContext,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { COLLAPSE_NAVBAR, EXPAND_NAVBAR } from "reducers/SettingsReducer";
import type { SubMenuItem } from "routes/sitemap";

interface NavContextInterface {
  openItems: string[];
  setOpenItems: Dispatch<SetStateAction<string[]>>;
  isNestedItemOpen: (items?: SubMenuItem[]) => boolean;
  sidenavAppbarVariant: ToolbarOwnProps["variant"];
  topbarHeight: Partial<Record<Breakpoint, number>>;
  sidenavCollapsed: boolean;
}

const NavContext = createContext({} as NavContextInterface);

const NavProvider = ({ children }: PropsWithChildren) => {
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [responsievSidenavCollapsed, setResponsiveSidenavCollapsed] =
    useState(false);
  const { pathname } = useLocation();

  const { currentBreakpoint, down } = useBreakpoints();

  const theme = useTheme();
  const downMd = down("md");

  const {
    config: { sidenavCollapsed, navigationMenuType, topnavType, sidenavType },
    setConfig,
    configDispatch,
  } = useSettingsContext();

  const isNestedItemOpen = useCallback(
    (items: SubMenuItem[] = []) => {
      const checkLink = (children: SubMenuItem) => {
        if (
          `${children.path}` === pathname ||
          (children.selectionPrefix &&
            pathname?.includes(children.selectionPrefix))
        ) {
          return true;
        }
        return children.items?.some(checkLink);
      };
      return items.some(checkLink);
    },
    [pathname],
  );

  const sidenavAppbarVariant: ToolbarOwnProps["variant"] = useMemo(() => {
    if (navigationMenuType === "sidenav") {
      return "appbar";
    }
    if (navigationMenuType === "combo") {
      switch (topnavType) {
        case "default": {
          return "appbar";
        }
        case "slim": {
          return "appbarSlim";
        }
        case "stacked": {
          return downMd ? "appbar" : "appbarStacked";
        }
      }
    }
  }, [navigationMenuType, topnavType, downMd]);

  const topbarHeight = useMemo(() => {
    if (navigationMenuType === "sidenav") {
      return theme.mixins.topbar.default;
    } else {
      return theme.mixins.topbar[topnavType];
    }
  }, [navigationMenuType, topnavType, theme.mixins.topbar]);

  useEffect(() => {
    if (navigationMenuType === "sidenav" || navigationMenuType === "combo") {
      if (sidenavType !== "slim") {
        if (sidenavCollapsed) {
          configDispatch({
            type: COLLAPSE_NAVBAR,
          });
        }
        if (currentBreakpoint === "md") {
          configDispatch({
            type: COLLAPSE_NAVBAR,
          });
          setResponsiveSidenavCollapsed(true);
        }
        if (downMd) {
          configDispatch({
            type: EXPAND_NAVBAR,
          });
        }
      } else {
        setConfig({
          drawerWidth: mainDrawerWidth.slim,
        });
      }
      if (currentBreakpoint === "md") {
        setConfig({
          openNavbarDrawer: false,
        });
      }
    }
    if (!loaded) {
      setLoaded(true);
    }
  }, [
    currentBreakpoint,
    navigationMenuType,
    downMd,
    setConfig,
    loaded,
    sidenavType,
    sidenavCollapsed,
    configDispatch,
  ]);

  useEffect(() => {
    if (currentBreakpoint !== "md" && responsievSidenavCollapsed) {
      setResponsiveSidenavCollapsed(false);
      configDispatch({
        type: EXPAND_NAVBAR,
      });
    }
  }, [currentBreakpoint, responsievSidenavCollapsed, configDispatch]);

  return (
    <NavContext
      value={{
        openItems,
        setOpenItems,
        isNestedItemOpen,
        sidenavAppbarVariant,
        topbarHeight,
        sidenavCollapsed,
      }}
    >
      {loaded && children}
    </NavContext>
  );
};

export const useNavContext = () => use(NavContext);

export default NavProvider;
