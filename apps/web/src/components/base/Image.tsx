import { Box, type BoxProps } from "@mui/material";
import { useThemeMode } from "hooks/useThemeMode";
import type { ImgHTMLAttributes } from "react";

interface ThemeAwareImageSource {
  light: string;
  dark: string;
}

interface ImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  sx?: BoxProps["sx"];
  src?: string | ThemeAwareImageSource;
}

const Image = ({ src, ...props }: ImageProps) => {
  const { isDark } = useThemeMode();

  const imageSrc = !src
    ? undefined
    : typeof src === "string"
      ? src
      : isDark
        ? src.dark
        : src.light;

  return <Box component="img" src={imageSrc} {...props} />;
};

export default Image;
