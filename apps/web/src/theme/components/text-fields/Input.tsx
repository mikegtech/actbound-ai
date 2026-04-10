import { inputClasses, type Theme } from "@mui/material";
import type { Components } from "@mui/material/styles";

const Input: Components<Omit<Theme, "components">>["MuiInput"] = {
  variants: [
    {
      props: { size: "large" },
      style: {
        [`& .${inputClasses.input}`]: {
          paddingTop: 6,
          paddingBottom: 8,
          height: "1.375rem",
        },
      },
    },
  ],
  styleOverrides: {
    underline: () => ({
      "&::before": {
        borderBottom: "none !important",
      },
      "&::after": {
        borderBottom: "none !important",
      },
      "&:hover, &:focus": {
        [`&:not(.${inputClasses.disabled}, .${inputClasses.error})`]: {
          "&::before": {
            borderBottom: "none !important",
          },
        },
      },
    }),
    sizeSmall: {
      fontSize: "14px",
    },
    input: {
      height: "1.375rem",
      padding: "6px 0 8px",
    },
    inputSizeSmall: {
      height: "1.125rem",
      padding: "6px 0 8px",
      lineHeight: 1.2,
    },
  },
};

export const InputBase: Components<Omit<Theme, "components">>["MuiInputBase"] =
  {
    defaultProps: {},
    // styleOverrides: {
    //   root: {
    //     borderRadius: 8,
    //   },
    //   sizeSmall: {
    //     borderRadius: 4,
    //   },
    // },
  };

export default Input;
