import { Chip, type ChipProps } from "@mui/material";
import { DelegationStatus } from "../types";

interface Props {
  status: DelegationStatus;
}

export const DelegationStatusBadge = ({ status }: Props) => {
  let color: ChipProps["color"] = "default";

  switch (status) {
    case "ACTIVE":
      color = "success";
      break;
    case "PENDING":
      color = "warning";
      break;
    case "REVOKED":
      color = "error";
      break;
    case "EXPIRED":
      color = "default";
      break;
  }

  return (
    <Chip
      label={status}
      color={color}
      size="small"
      variant="filled"
      sx={{ fontWeight: 600, fontSize: "0.70rem" }}
    />
  );
};
