import { Chip, type ChipProps } from "@mui/material";
import { ConnectionState } from "../types";

interface Props {
  state: ConnectionState;
}

export const ConnectionStateBadge = ({ state }: Props) => {
  let color: ChipProps["color"] = "default";

  switch (state) {
    case "HEALTHY":
      color = "success";
      break;
    case "NEEDS_ATTENTION":
      color = "warning";
      break;
    case "DISCONNECTED":
      color = "error";
      break;
    case "PENDING":
      color = "info";
      break;
  }

  return (
    <Chip
      label={state.replace("_", " ")}
      color={color}
      size="small"
      variant="filled"
      sx={{ fontWeight: 600, fontSize: "0.70rem" }}
    />
  );
};
