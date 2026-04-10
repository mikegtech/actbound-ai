import { Icon, type IconProps } from "@iconify/react";
import { Box, type BoxProps } from "@mui/material";

interface IconifyProps extends IconProps {
  sx?: BoxProps["sx"];
  flipOnRTL?: boolean;
}

const IconifyIcon = ({ flipOnRTL = false, ...rest }: IconifyProps) => {
  return (
    // @ts-expect-error Iconify accepts refs not modeled by MUI Box's component overload.
    <Box
      ssr
      component={Icon}
      {...rest}
      sx={[
        flipOnRTL && {
          transform: (theme) =>
            theme.direction === "rtl" ? "rotate(180deg)" : "none",
        },
        ...(Array.isArray(rest.sx) ? rest.sx : [rest.sx]),
      ]}
    />
  );
};

export default IconifyIcon;
