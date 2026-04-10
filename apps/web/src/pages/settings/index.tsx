import React, { useState } from "react";
import {
  Box,
  Typography,
  Stack,
  Tabs,
  Tab,
  Paper,
  Divider,
  Button,
  TextField,
} from "@mui/material";
import { PageHeader } from "components/common/PageHeader";
import IconifyIcon from "components/base/IconifyIcon";

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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 5 }, maxWidth: 1440, mx: "auto" }}>
      <Stack spacing={4}>
        {/* Header Block */}
        <PageHeader
          title="Settings"
          subtitle="Manage organizational identity profiles, global boundary defaults, and cross-platform integrations for your localized ActBound gateway."
        />

        {/* Content Layout */}
        <Paper
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 3,
            display: "flex",
            minHeight: 600,
          }}
        >
          {/* Vertical Nav */}
          <Box
            sx={{
              borderRight: 1,
              borderColor: "divider",
              minWidth: 240,
              py: 3,
            }}
          >
            <Tabs
              orientation="vertical"
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
                label="Gateway Integrations"
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
                    placeholder="System Administrator"
                    size="small"
                    variant="outlined"
                  />
                </Box>
                <Box mt={2}>
                  <Typography variant="subtitle2" mb={1} fontWeight={600}>
                    Contact Email Address
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="admin@domain.com"
                    size="small"
                    variant="outlined"
                  />
                </Box>
                <Box pt={2}>
                  <Button
                    variant="contained"
                    disableElevation
                    sx={{ borderRadius: 2 }}
                  >
                    Save Identifiers
                  </Button>
                </Box>
              </Stack>
            </SettingsTabPanel>

            <SettingsTabPanel value={tabIndex} index={1}>
              <Stack spacing={3} maxWidth={600}>
                <Typography variant="h5" fontWeight={700}>
                  Global Defaults
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Specify the fail-over logic boundaries when active specific
                  policies are untethered.
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
                    Unrecognized Delegation Handling
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Automatically DENY requests originating from assistant
                    workflows lacking immediate verification trust bounds.
                  </Typography>
                  <Button variant="outlined" color="primary" size="small">
                    Toggle Default
                  </Button>
                </Box>
              </Stack>
            </SettingsTabPanel>

            <SettingsTabPanel value={tabIndex} index={2}>
              <Stack spacing={3} maxWidth={600}>
                <Typography variant="h5" fontWeight={700}>
                  Registered Integration Systems
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  OAuth mappings enabling autonomous ActBound capabilities over
                  third-party REST services.
                </Typography>

                <Box
                  mt={2}
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
                    No External Providers Linked
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    Use the Delegations page to manually approve the primary
                    external bridges.
                  </Typography>
                </Box>
              </Stack>
            </SettingsTabPanel>

            <SettingsTabPanel value={tabIndex} index={3}>
              <Stack spacing={3} maxWidth={600}>
                <Typography variant="h5" fontWeight={700}>
                  Security Enforcement
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Review active tokens or force global revocations for all your
                  active contexts.
                </Typography>

                <Divider sx={{ my: 2 }} />

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
                  <Button variant="contained" color="error" disableElevation>
                    Revoke All Sessions
                  </Button>
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
