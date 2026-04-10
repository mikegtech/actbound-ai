import { type Breakpoint, useMediaQuery, useTheme } from "@mui/material";
import {
  createContext,
  type PropsWithChildren,
  use,
  useCallback,
  useMemo,
} from "react";

interface BreakpointContextInterface {
  currentBreakpoint: Breakpoint;
  up: (key: Breakpoint | number) => boolean;
  down: (key: Breakpoint | number) => boolean;
  only: (key: Breakpoint | number) => boolean;
  between: (start: Breakpoint | number, end: Breakpoint | number) => boolean;
}

export const BreakpointContext = createContext(
  {} as BreakpointContextInterface,
);

const BreakpointsProvider = ({ children }: PropsWithChildren) => {
  const theme = useTheme();

  const isXs = useMediaQuery(theme.breakpoints.between("xs", "sm"));
  const isSm = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isMd = useMediaQuery(theme.breakpoints.between("md", "lg"));
  const isLg = useMediaQuery(theme.breakpoints.between("lg", "xl"));
  const isXl = useMediaQuery(theme.breakpoints.up("xl"));

  const matchesBreakpoint = useCallback((query: string) => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.matchMedia(query.replace(/^@media\s*/, "")).matches;
  }, []);

  const up = useCallback(
    (key: Breakpoint | number) => matchesBreakpoint(theme.breakpoints.up(key)),
    [matchesBreakpoint, theme],
  );

  const down = useCallback(
    (key: Breakpoint | number) =>
      matchesBreakpoint(theme.breakpoints.down(key)),
    [matchesBreakpoint, theme],
  );

  const only = useCallback(
    (key: Breakpoint | number) =>
      matchesBreakpoint(theme.breakpoints.only(key as Breakpoint)),
    [matchesBreakpoint, theme],
  );

  const between = useCallback(
    (start: Breakpoint | number, end: Breakpoint | number) =>
      matchesBreakpoint(theme.breakpoints.between(start, end)),
    [matchesBreakpoint, theme],
  );

  const currentBreakpoint = useMemo<Breakpoint>(() => {
    if (isXl) {
      return "xl";
    }
    if (isLg) {
      return "lg";
    }
    if (isMd) {
      return "md";
    }
    if (isSm) {
      return "sm";
    }
    if (isXs) {
      return "xs";
    }
    return "xs";
  }, [isXs, isSm, isMd, isLg, isXl]);

  return (
    <BreakpointContext value={{ currentBreakpoint, up, down, only, between }}>
      {children}
    </BreakpointContext>
  );
};

export const useBreakpoints = () => use(BreakpointContext);

export default BreakpointsProvider;
