import {
  Box,
  Typography,
  Stack,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import React, { useState } from "react";
import { PageHeader } from "components/common/PageHeader";
import {
  useDelegations,
  useConnectedAccounts,
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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 5 }, maxWidth: 1440, mx: "auto" }}>
      <Stack spacing={4}>
        <PageHeader
          title="Trust Core"
          subtitle="Manage delegated authority across your organization. Monitor active assistant access limits, external connected accounts, and the scope of capabilities granted to autonomous agents."
        />

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
              Failed to load connected account integration health.
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
                      No connected integrations mapped to the target boundary.
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
