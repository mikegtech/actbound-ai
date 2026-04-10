import { Box, Typography } from "@mui/material";
import { SimulationTraceStep } from "../types";
import IconifyIcon from "components/base/IconifyIcon";

interface Props {
  step: SimulationTraceStep;
  isLast?: boolean;
}

export const SimulationStepNode = ({ step, isLast = false }: Props) => {
  const getIconData = () => {
    switch (step.outcome) {
      case "success":
        return {
          icon: "material-symbols:check-circle-rounded",
          color: "success.main",
        };
      case "failure":
        return { icon: "material-symbols:cancel-rounded", color: "error.main" };
      default:
        return { icon: "material-symbols:info-rounded", color: "info.main" };
    }
  };

  const { icon, color } = getIconData();

  return (
    <Box sx={{ display: "flex", position: "relative", pb: isLast ? 0 : 3 }}>
      {!isLast && (
        <Box
          sx={{
            position: "absolute",
            top: 24,
            bottom: 0,
            left: 11,
            width: 2,
            bgcolor: "divider",
          }}
        />
      )}
      <Box sx={{ mr: 2, mt: 0.5, zIndex: 1 }}>
        <IconifyIcon
          icon={icon}
          sx={{ color, fontSize: 24, bgcolor: "background.paper" }}
        />
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {step.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {step.detail}
        </Typography>
      </Box>
    </Box>
  );
};
