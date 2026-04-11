import {
  Box,
  Typography,
  Stack,
  Button,
  CircularProgress,
  Grid,
  Alert,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { Link } from "@tanstack/react-router";
import { PageHeader } from "components/common/PageHeader";
import {
  useSecurityPosture,
  useRiskIndicators,
  useDeniedPolicySnapshots,
} from "./api/useSecurityQueries";
import { SecurityPostureCard } from "./components/SecurityPostureCard";
import { RiskAttentionCard } from "./components/RiskAttentionCard";
import { DeniedPolicySnapshotCard } from "./components/DeniedPolicySnapshotCard";

const SecurityDashboard = () => {
  const {
    data: posture,
    isLoading: postureLoading,
    isError: postureError,
  } = useSecurityPosture();
  const {
    data: risks,
    isLoading: risksLoading,
    isError: risksError,
  } = useRiskIndicators();
  const {
    data: denials,
    isLoading: denialsLoading,
    isError: denialsError,
  } = useDeniedPolicySnapshots();

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={4}
      >
        <PageHeader
          title="Security Posture"
          subtitle="Monitor the health and compliance of your AI delegation boundaries."
        />
        <Button
          component={Link}
          to="/security/controls"
          variant="contained"
          startIcon={<Icon icon="lucide:sliders" />}
        >
          My Controls
        </Button>
      </Stack>

      {(postureError || risksError || denialsError) && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          Some security posture data failed to load from the frontend mock.
          Refresh this page after the query recovers.
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <SecurityPostureCard posture={posture} isLoading={postureLoading} />
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={4}>
            <Box>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Attention Required
              </Typography>
              {risksLoading ? (
                <CircularProgress size={24} />
              ) : risks?.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No active risks detected.
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {risks?.map((risk) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={risk.id}>
                      <RiskAttentionCard indicator={risk} />
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>

            <Box>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Recent Policy Denials
              </Typography>
              {denialsLoading ? (
                <CircularProgress size={24} />
              ) : denials?.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No denied anomalies in the last 24h.
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {denials?.map((denial) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={denial.id}>
                      <DeniedPolicySnapshotCard snapshot={denial} />
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SecurityDashboard;
