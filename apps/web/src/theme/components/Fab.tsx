import type { Theme } from "@mui/material";
import type { Components } from "@mui/material/styles";

declare module "@mui/material/Fab" {
  interface FabPropsColorOverrides {
    neutral: true;
  }
}

const Fab: Components<Omit<Theme, "components">>["MuiFab"] = {
  defaultProps: {
    color: "primary",
  },
};

export default Fab;
