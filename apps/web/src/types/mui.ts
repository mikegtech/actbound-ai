import type { Theme } from "@mui/material";

export type VariantStyleProps<T> = T & {
  theme: Omit<Theme, "components">;
};
