import {
  Box,
  Card,
  Stack,
  Typography,
  CircularProgress,
  useTheme,
} from "@mui/material";
import { Icon } from "@iconify/react";
import type { SecurityPosture } from "../types";

export const SecurityPostureCard = ({
  posture,
  isLoading,
}: {
  posture?: SecurityPosture;
  isLoading: boolean;
}) => {
  const theme = useTheme();

  if (isLoading || !posture) {
    return (
      <Card
        sx={{
          p: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
        }}
      >
        <CircularProgress />
      </Card>
    );
  }

  const isWarning = posture.overallState === "warning";
  const isHealthy = posture.overallState === "healthy";

  const iconColor = isWarning
    ? theme.palette.warning.main
    : isHealthy
      ? theme.palette.success.main
      : theme.palette.error.main;

  return (
    <Card sx={{ p: 3, height: "100%" }}>
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: `${iconColor}20`,
            color: iconColor,
            display: "flex",
          }}
        >
          <Icon
            icon={
              isHealthy
                ? "lucide:shield-check"
                : isWarning
                  ? "lucide:shield-alert"
                  : "lucide:shield-x"
            }
            width={28}
          />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={600}>
            System Posture
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textTransform: "capitalize" }}
          >
            State: {posture.overallState}
          </Typography>
        </Box>
      </Stack>

      <Stack spacing={2}>
        <Box display="flex" justifyContent="space-between">
          <Typography variant="body2" color="text.secondary">
            Denied Anomalies (24h)
          </Typography>
          <Typography
            variant="body2"
            fontWeight={600}
            color={
              posture.deniedOperationsLast24h > 0
                ? "warning.main"
                : "text.primary"
            }
          >
            {posture.deniedOperationsLast24h}
          </Typography>
        </Box>
        <Box display="flex" justifyContent="space-between">
          <Typography variant="body2" color="text.secondary">
            High-Sensitivity Hooks
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {posture.activeHighSensitivityGrants}
          </Typography>
        </Box>
      </Stack>
    </Card>
  );
};
