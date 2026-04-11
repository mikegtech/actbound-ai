import React, { useState } from "react";
import {
  Box,
  Typography,
  Stack,
  Tabs,
  Tab,
  Paper,
  Divider,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { PageHeader } from "components/common/PageHeader";
import IconifyIcon from "components/base/IconifyIcon";
import { UnavailableAction } from "components/common/UnavailableAction";
import { useConnectedAccounts } from "pages/delegations/api/useDelegationQueries";
import { useSettingsSnapshot } from "./api/useSettingsQueries";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function SettingsTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      style={{ flexGrow: 1 }}
      {...other}
    >
      {value === index && <Box sx={{ py: 0, px: 4 }}>{children}</Box>}
    </div>
  );
}

const Settings = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down("md"));
  const {
    data: settings,
    isLoading: settingsLoading,
    isError: settingsError,
  } = useSettingsSnapshot();
  const {
    data: connectedAccounts,
    isLoading: accountsLoading,
    isError: accountsError,
  } = useConnectedAccounts();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 5 }, maxWidth: 1440, mx: "auto" }}>
      <Stack spacing={4}>
        {/* Header Block */}
        <PageHeader
          title="Settings"
          subtitle="Review read-only frontend settings for identity, defaults, Connected Accounts, and security controls."
        />

        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Settings are backed by typed frontend mock data. Mutation controls are
          disabled until safe gateway-backed flows exist, so no fake success
          states are shown.
        </Alert>

        {settingsError && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            Failed to load settings snapshot.
          </Alert>
        )}

        {accountsError && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            Failed to load Connected Account data for settings.
          </Alert>
        )}

        {/* Content Layout */}
        <Paper
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 3,
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            minHeight: 600,
          }}
        >
          {/* Vertical Nav */}
          <Box
            sx={{
              borderRight: 1,
              borderBottom: { xs: 1, md: 0 },
              borderColor: "divider",
              minWidth: { md: 240 },
              py: 3,
            }}
          >
            <Tabs
              orientation={isCompact ? "horizontal" : "vertical"}
              variant="scrollable"
              value={tabIndex}
              onChange={handleTabChange}
              sx={{
                "& .MuiTab-root": {
                  alignItems: "flex-start",
                  textAlign: "left",
                  px: 3,
                  py: 2,
                  minHeight: 48,
                  fontWeight: 600,
                  textTransform: "none",
                  fontSize: 15,
                },
              }}
            >
              <Tab
                label="Identity & Profile"
                icon={<IconifyIcon icon="ph:user-circle" />}
                iconPosition="start"
                sx={{ gap: 1.5 }}
              />
              <Tab
                label="Organizational Defaults"
                icon={<IconifyIcon icon="ph:buildings" />}
                iconPosition="start"
                sx={{ gap: 1.5 }}
              />
              <Tab
                label="Connected Accounts"
                icon={<IconifyIcon icon="ph:plug" />}
                iconPosition="start"
                sx={{ gap: 1.5 }}
              />
              <Tab
                label="Security & Auth"
                icon={<IconifyIcon icon="ph:shield-check" />}
                iconPosition="start"
                sx={{ gap: 1.5 }}
              />
            </Tabs>
          </Box>

          {/* Settings Content Panels */}
          <Box sx={{ flexGrow: 1, py: 4 }}>
            <SettingsTabPanel value={tabIndex} index={0}>
              <Stack spacing={3} maxWidth={600}>
                <Typography variant="h5" fontWeight={700}>
                  Profile Integrity
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  These settings map to your authenticated sub-identity claims.
                  Changes may require clearing the local session.
                </Typography>

                <Box mt={2}>
                  <Typography variant="subtitle2" mb={1} fontWeight={600}>
                    Principal Name
                  </Typography>
                  <TextField
                    fullWidth
                    value={settings?.profile.principalName ?? ""}
                    size="small"
                    variant="outlined"
                    disabled
                    helperText={
                      settingsLoading
                        ? "Loading typed profile snapshot..."
                        : "Read-only mock profile. Profile persistence is not wired yet."
                    }
                  />
                </Box>
                <Box mt={2}>
                  <Typography variant="subtitle2" mb={1} fontWeight={600}>
                    Contact Email Address
                  </Typography>
                  <TextField
                    fullWidth
                    value={settings?.profile.email ?? ""}
                    size="small"
                    variant="outlined"
                    disabled
                    helperText={
                      settingsLoading
                        ? "Loading typed profile snapshot..."
                        : "Read-only mock profile. Profile persistence is not wired yet."
                    }
                  />
                </Box>
                <Box pt={2}>
                  <UnavailableAction
                    variant="contained"
                    disableElevation
                    reason="Saving identifiers is disabled until profile persistence exists."
                    sx={{ borderRadius: 2 }}
                  >
                    Save Identifiers
                  </UnavailableAction>
                </Box>
              </Stack>
            </SettingsTabPanel>

            <SettingsTabPanel value={tabIndex} index={1}>
              <Stack spacing={3} maxWidth={600}>
                <Typography variant="h5" fontWeight={700}>
                  Global Defaults
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Review the default frontend trust-boundary behavior for
                  assistant requests that do not match an explicit delegation.
                </Typography>

                <Box
                  mt={2}
                  p={3}
                  sx={{
                    bgcolor: "background.elevation1",
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography variant="body1" fontWeight={600} mb={1}>
                    {settings?.defaultBoundary.label ??
                      "Unrecognized Delegation Handling"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {settings?.defaultBoundary.description ??
                      "Loading default boundary snapshot..."}
                  </Typography>
                  {settingsLoading && (
                    <CircularProgress size={20} sx={{ mb: 2 }} />
                  )}
                  <UnavailableAction
                    variant="outlined"
                    color="primary"
                    size="small"
                    reason="Default boundary changes are disabled until a safe settings mutation flow exists."
                  >
                    Toggle Default
                  </UnavailableAction>
                </Box>
              </Stack>
            </SettingsTabPanel>

            <SettingsTabPanel value={tabIndex} index={2}>
              <Stack spacing={3} maxWidth={600}>
                <Typography variant="h5" fontWeight={700}>
                  Connected Accounts
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Connected accounts are read from the same Trust Core mock data
                  used by Delegations, avoiding conflicting settings copy.
                </Typography>

                {accountsLoading ? (
                  <Box py={4}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    {connectedAccounts?.map((account) => (
                      <Box
                        key={account.id}
                        p={2}
                        sx={{
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 2,
                        }}
                      >
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          justifyContent="space-between"
                          spacing={1}
                        >
                          <Box>
                            <Typography variant="body1" fontWeight={600}>
                              {account.provider.toUpperCase()} -{" "}
                              {account.accountName}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                            >
                              {account.id}
                              {account.identityEmail
                                ? ` - ${account.identityEmail}`
                                : ""}
                            </Typography>
                          </Box>
                          <Chip
                            label={account.connectionState.replace("_", " ")}
                            color={
                              account.connectionState === "HEALTHY"
                                ? "success"
                                : account.connectionState === "DISCONNECTED"
                                  ? "error"
                                  : "warning"
                            }
                            size="small"
                            sx={{
                              alignSelf: { xs: "flex-start", sm: "center" },
                            }}
                          />
                        </Stack>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          mt={1}
                        >
                          Used by {account.assistantIds.length} assistant
                          {account.assistantIds.length === 1 ? "" : "s"} in the
                          current frontend trust model.
                        </Typography>
                      </Box>
                    ))}
                    {connectedAccounts?.length === 0 && (
                      <Box
                        p={3}
                        sx={{
                          border: "1px dashed",
                          borderColor: "divider",
                          borderRadius: 2,
                          textAlign: "center",
                        }}
                      >
                        <IconifyIcon
                          icon="ph:plug"
                          fontSize={32}
                          sx={{ color: "text.secondary", mb: 1 }}
                        />
                        <Typography variant="body1" fontWeight={600}>
                          No connected accounts listed
                        </Typography>
                      </Box>
                    )}
                    <UnavailableAction
                      variant="outlined"
                      reason="Connected Account management is read-only until mutation flows exist."
                    >
                      Manage Connected Accounts
                    </UnavailableAction>
                  </Stack>
                )}
              </Stack>
            </SettingsTabPanel>

            <SettingsTabPanel value={tabIndex} index={3}>
              <Stack spacing={3} maxWidth={600}>
                <Typography variant="h5" fontWeight={700}>
                  Security Enforcement
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Review active frontend mock contexts and delegated principal
                  counts. Destructive auth actions remain disabled.
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Box
                  p={3}
                  sx={{
                    bgcolor: "background.elevation1",
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography variant="body1" fontWeight={600} mb={1}>
                    Current Session Snapshot
                  </Typography>
                  {settingsLoading ? (
                    <CircularProgress size={20} />
                  ) : (
                    <Stack spacing={0.5}>
                      <Typography variant="body2" color="text.secondary">
                        Active contexts:{" "}
                        {settings?.security.activeContexts ?? 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Delegated principals:{" "}
                        {settings?.security.delegatedPrincipalCount ?? 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {settings?.security.sessionPolicy}
                      </Typography>
                    </Stack>
                  )}
                </Box>

                <Box>
                  <Typography variant="body1" color="error" fontWeight={600}>
                    Danger Zone
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    mt={0.5}
                    mb={2}
                  >
                    Destroy the current core session bounds permanently. All
                    assistants operating on this delegated principal will be
                    suspended.
                  </Typography>
                  <UnavailableAction
                    variant="contained"
                    color="error"
                    disableElevation
                    reason="Session revocation is disabled until a safe auth mutation flow exists."
                  >
                    Revoke All Sessions
                  </UnavailableAction>
                </Box>
              </Stack>
            </SettingsTabPanel>
          </Box>
        </Paper>
      </Stack>
    </Box>
  );
};

export default Settings;
