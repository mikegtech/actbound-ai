import {
  Box,
  Typography,
  Stack,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Paper,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import React, { useState } from "react";
import { PageHeader } from "components/common/PageHeader";
import {
  useDelegations,
  useConnectedAccounts,
  useDelegationPostureSummary,
} from "./api/useDelegationQueries";
import { DelegationCard } from "./components/DelegationCard";
import { ConnectedAccountCard } from "./components/ConnectedAccountCard";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`delegations-tabpanel-${index}`}
      aria-labelledby={`delegations-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 4 }}>{children}</Box>}
    </div>
  );
}

const Delegations = () => {
  const [tabIndex, setTabIndex] = useState(0);

  const {
    data: delegations,
    isLoading: delegationsLoading,
    error: delegationsError,
  } = useDelegations();
  const {
    data: accounts,
    isLoading: accountsLoading,
    error: accountsError,
  } = useConnectedAccounts();
  const {
    data: postureSummary,
    isLoading: postureLoading,
    error: postureError,
  } = useDelegationPostureSummary();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 5 }, maxWidth: 1440, mx: "auto" }}>
      <Stack spacing={4}>
        <PageHeader
          title="Trust Core"
          subtitle="Review delegated authority, connected account health, and assistant trust boundaries across the current frontend scope."
        />

        {postureError && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            Failed to load delegation posture summary.
          </Alert>
        )}

        <Grid container spacing={2}>
          {[
            {
              label: "Total Delegations",
              value: postureSummary?.totalDelegations,
              helper: "All frontend mock grants",
            },
            {
              label: "Active / Pending",
              value:
                postureSummary &&
                `${postureSummary.activeDelegations} / ${postureSummary.pendingDelegations}`,
              helper: "Granted authority needing review",
            },
            {
              label: "Revoked",
              value: postureSummary?.revokedDelegations,
              helper: "Closed or expired trust paths",
            },
            {
              label: "Connections Healthy",
              value:
                postureSummary &&
                `${postureSummary.healthyConnections} healthy, ${postureSummary.attentionConnections} attention`,
              helper: "Connected account posture",
            },
          ].map((metric) => (
            <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={metric.label}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2.5,
                  height: "100%",
                  bgcolor: "surfaceContainerLowest.main",
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {metric.label}
                </Typography>
                <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>
                  {postureLoading ? "..." : metric.value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {metric.helper}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabIndex}
            onChange={handleTabChange}
            aria-label="trust core tabs"
          >
            <Tab
              label="Active Delegations"
              sx={{ fontWeight: 600, letterSpacing: 0.5 }}
            />
            <Tab
              label="Connected Accounts"
              sx={{ fontWeight: 600, letterSpacing: 0.5 }}
            />
          </Tabs>
        </Box>

        <CustomTabPanel value={tabIndex} index={0}>
          {delegationsError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              Failed to load delegations overview.
            </Alert>
          )}
          {delegationsLoading ? (
            <Box display="flex" justifyContent="center" py={10}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {delegations?.map((delegation) => (
                <Grid size={{ xs: 12, md: 6, lg: 4 }} key={delegation.id}>
                  <DelegationCard delegation={delegation} />
                </Grid>
              ))}
              {delegations?.length === 0 && (
                <Grid size={12}>
                  <Box
                    p={5}
                    textAlign="center"
                    bgcolor="surfaceContainerLow.main"
                    borderRadius={2}
                  >
                    <Typography variant="body1" color="text.secondary">
                      No active delegations found over current scope context.
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </CustomTabPanel>

        <CustomTabPanel value={tabIndex} index={1}>
          {accountsError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              Failed to load Connected Account health.
            </Alert>
          )}
          {accountsLoading ? (
            <Box display="flex" justifyContent="center" py={10}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {accounts?.map((account) => (
                <Grid size={{ xs: 12, md: 6, lg: 4 }} key={account.id}>
                  <ConnectedAccountCard account={account} />
                </Grid>
              ))}
              {accounts?.length === 0 && (
                <Grid size={12}>
                  <Box
                    p={5}
                    textAlign="center"
                    bgcolor="surfaceContainerLow.main"
                    borderRadius={2}
                  >
                    <Typography variant="body1" color="text.secondary">
                      No Connected Accounts mapped to the target boundary.
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </CustomTabPanel>
      </Stack>
    </Box>
  );
};

export default Delegations;
