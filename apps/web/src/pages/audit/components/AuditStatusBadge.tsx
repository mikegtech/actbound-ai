import { Chip } from "@mui/material";
import type { AuditActionSignal } from "../types";
import IconifyIcon from "components/base/IconifyIcon";

export const AuditStatusBadge = ({ signal }: { signal: AuditActionSignal }) => {
  switch (signal) {
    case "allowed":
      return (
        <Chip
          icon={<IconifyIcon icon="ph:check-circle" fontSize={16} />}
          label="Allowed"
          size="small"
          sx={{
            bgcolor: "success.lighter",
            color: "success.dark",
            fontWeight: 600,
            "& .MuiChip-icon": { color: "success.dark" },
          }}
        />
      );
    case "denied":
      return (
        <Chip
          icon={<IconifyIcon icon="ph:prohibit" fontSize={16} />}
          label="Denied"
          size="small"
          sx={{
            bgcolor: "error.lighter",
            color: "error.dark",
            fontWeight: 600,
            "& .MuiChip-icon": { color: "error.dark" },
          }}
        />
      );
    case "warning":
      return (
        <Chip
          icon={<IconifyIcon icon="ph:warning-circle" fontSize={16} />}
          label="Warning"
          size="small"
          sx={{
            bgcolor: "warning.lighter",
            color: "warning.dark",
            fontWeight: 600,
            "& .MuiChip-icon": { color: "warning.dark" },
          }}
        />
      );
    case "reviewed":
      return (
        <Chip
          icon={<IconifyIcon icon="ph:eye" fontSize={16} />}
          label="Reviewed"
          size="small"
          sx={{
            bgcolor: "info.lighter",
            color: "info.dark",
            fontWeight: 600,
            "& .MuiChip-icon": { color: "info.dark" },
          }}
        />
      );
    default:
      return null;
  }
};
