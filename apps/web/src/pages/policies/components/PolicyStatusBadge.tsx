import { Chip, type ChipProps } from "@mui/material";
import { PolicyStatus } from "../types";

interface Props {
  status: PolicyStatus;
}

export const PolicyStatusBadge = ({ status }: Props) => {
  let color: ChipProps["color"] = "default";

  switch (status) {
    case "active":
      color = "success";
      break;
    case "warning":
      color = "warning";
      break;
    case "draft":
      color = "info";
      break;
    case "archived":
      color = "default";
      break;
  }

  return (
    <Chip
      label={status.toUpperCase()}
      color={color}
      size="small"
      variant="filled"
      sx={{ fontWeight: 600, fontSize: "0.70rem" }}
    />
  );
};
