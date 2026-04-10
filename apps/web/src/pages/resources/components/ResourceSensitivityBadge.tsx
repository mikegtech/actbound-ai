import { Chip } from "@mui/material";
import { ResourceSensitivity } from "../types";

interface Props {
  sensitivity: ResourceSensitivity;
}

export const ResourceSensitivityBadge = ({ sensitivity }: Props) => {
  let color: "error" | "warning" | "info" | "default" = "default";

  switch (sensitivity) {
    case "critical":
      color = "error";
      break;
    case "high":
      color = "warning";
      break;
    case "normal":
      color = "info";
      break;
    case "low":
      color = "default";
      break;
  }

  return (
    <Chip
      label={sensitivity.toUpperCase()}
      color={color}
      size="small"
      variant="filled"
      sx={{ fontWeight: 600, fontSize: "0.70rem" }}
    />
  );
};
