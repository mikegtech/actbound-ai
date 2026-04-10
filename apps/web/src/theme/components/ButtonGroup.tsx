import type { Theme } from "@mui/material";
import type { Components } from "@mui/material/styles";

const ButtonGroup: Components<Omit<Theme, "components">>["MuiButtonGroup"] = {
  defaultProps: {
    disableElevation: true,
  },
};

export default ButtonGroup;
