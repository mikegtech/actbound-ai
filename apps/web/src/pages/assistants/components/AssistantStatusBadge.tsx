import { Chip } from "@mui/material";
import { AssistantStatus } from "../types";

interface Props {
  status: AssistantStatus;
}

export const AssistantStatusBadge = ({ status }: Props) => {
  let color: "success" | "warning" | "error" | "default" = "default";

  switch (status) {
    case "active":
      color = "success";
      break;
    case "pending":
      color = "warning";
      break;
    case "restricted":
      color = "error";
      break;
    case "disabled":
      color = "default";
      break;
  }

  return (
    <Chip
      label={status.toUpperCase()}
      color={color}
      size="small"
      sx={{ fontWeight: 600, fontSize: "0.75rem" }}
      variant={status === "disabled" ? "outlined" : "filled"}
    />
  );
};
