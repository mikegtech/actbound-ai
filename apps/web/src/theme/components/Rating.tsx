import type { Theme } from "@mui/material";
import type { Components } from "@mui/material/styles";
import IconifyIcon from "components/base/IconifyIcon";

const Rating: Components<Omit<Theme, "components">>["MuiRating"] = {
  defaultProps: {
    emptyIcon: (
      <IconifyIcon icon="material-symbols:star-rounded" color="divider" />
    ),
  },
  styleOverrides: {},
};

export default Rating;
