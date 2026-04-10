import {
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "@tanstack/react-router";
import IconifyIcon from "components/base/IconifyIcon";
import { MetricCard } from "components/common/MetricCard";
import { PageHeader } from "components/common/PageHeader";
import { SectionWrapper } from "components/common/SectionWrapper";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "components/common/StateViews";
import dayjs from "dayjs";
import paths from "routes/paths";
import { useDashboardData } from "./api/useDashboardQueries";

const dashboardActions = [
  {
    label: "Review Assistants",
    to: paths.assistants,
    icon: "material-symbols:robot-2-outline-rounded",
  },
  {
    label: "Inspect Policies",
    to: paths.policies,
    icon: "material-symbols:policy-outline-rounded",
  },
  {
    label: "Check Resources",
    to: paths.resources,
    icon: "material-symbols:cloud-done-outline-rounded",
  },
  {
    label: "Review Delegations",
    to: paths.delegations,
    icon: "material-symbols:account-tree-outline-rounded",
  },
  {
    label: "Open Security",
    to: paths.security,
    icon: "material-symbols:security-rounded",
  },
  {
    label: "Open Audit",
    to: paths.audit,
    icon: "material-symbols:manage-search-outline-rounded",
  },
];

const dashboardSubtitle =
  "Monitor bounded assistants, delegations, policy posture, and recent enforcement signals.";

const Dashboard = () => {
  const { data, isLoading, isError, error, refetch } = useDashboardData();

  if (isLoading) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <PageHeader title="Trust Control Plane" subtitle={dashboardSubtitle} />
        <LoadingState />
      </Box>
    );
  }

  if (isError || !data) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <PageHeader title="Trust Control Plane" subtitle={dashboardSubtitle} />
        <ErrorState error={error as Error} onRetry={refetch} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader title="Trust Control Plane" subtitle={dashboardSubtitle} />

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.5}
        sx={{ mb: 4, flexWrap: "wrap" }}
      >
        {dashboardActions.map((action) => (
          <Button
            key={action.to}
            component={RouterLink}
            to={action.to}
            variant="outlined"
            startIcon={<IconifyIcon icon={action.icon} />}
          >
            {action.label}
          </Button>
        ))}
      </Stack>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Assistants In Scope"
            value={data.metrics.activeAssistants}
            icon="material-symbols:robot-2-outline-rounded"
            trend="up"
            trendValue="+2"
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Protected Resources"
            value={data.metrics.protectedResources}
            icon="material-symbols:cloud-done-outline-rounded"
            trend="up"
            trendValue="+14"
            color="info"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Delegations Live"
            value={data.metrics.activeDelegations}
            icon="material-symbols:account-tree-outline-rounded"
            trend="neutral"
            color="success"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Denied Actions (24h)"
            value={data.metrics.recentPolicyEvents}
            icon="material-symbols:warning-outline-rounded"
            trend="down"
            trendValue="-1"
            color="error"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={3}>
            <SectionWrapper
              title="Recent Enforcement Activity"
              action={
                <Button
                  component={RouterLink}
                  to={paths.audit}
                  size="small"
                  endIcon={
                    <IconifyIcon icon="material-symbols:arrow-right-alt-rounded" />
                  }
                >
                  View audit
                </Button>
              }
            >
              {data.recentAuditEvents.length === 0 ? (
                <EmptyState
                  title="No recent enforcement activity"
                  description="Decision and execution events will appear here when assistants or users operate within the control plane."
                />
              ) : (
                <List disablePadding>
                  {data.recentAuditEvents.map((evt, index) => (
                    <Box key={evt.id}>
                      <ListItem sx={{ py: 2, px: 0 }}>
                        <ListItemIcon>
                          <Box
                            sx={{
                              p: 1,
                              borderRadius: "50%",
                              bgcolor:
                                evt.severity === "warning"
                                  ? "warning.lighter"
                                  : "info.lighter",
                              color:
                                evt.severity === "warning"
                                  ? "warning.main"
                                  : "info.main",
                            }}
                          >
                            <IconifyIcon
                              icon={
                                evt.severity === "warning"
                                  ? "material-symbols:warning-outline-rounded"
                                  : "material-symbols:info-outline-rounded"
                              }
                            />
                          </Box>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600 }}
                            >
                              {evt.actor}
                            </Typography>
                          }
                          secondary={evt.description}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {dayjs(evt.timestamp).format("MMM D, h:mm A")}
                        </Typography>
                      </ListItem>
                      {index < data.recentAuditEvents.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              )}
            </SectionWrapper>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
            <SectionWrapper
              title="Policy Enforcement Posture"
              action={
                <Button
                  component={RouterLink}
                  to={paths.policies}
                  size="small"
                  endIcon={
                    <IconifyIcon icon="material-symbols:arrow-right-alt-rounded" />
                  }
                >
                  Review policies
                </Button>
              }
            >
              <Stack spacing={2}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Overall Status
                  </Typography>
                  <Chip
                    label={data.policyPosture.overallStatus.toUpperCase()}
                    color={
                      data.policyPosture.overallStatus === "secure"
                        ? "success"
                        : "warning"
                    }
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
                <Divider />
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Active Policies
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {data.policyPosture.activePolicies} /{" "}
                    {data.policyPosture.totalPolicies}
                  </Typography>
                </Box>
                <Divider />
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Violations (24h)
                  </Typography>
                  <Typography
                    variant="body1"
                    color={
                      data.policyPosture.violationsInLast24h > 0
                        ? "error.main"
                        : "text.primary"
                    }
                    sx={{ fontWeight: 600 }}
                  >
                    {data.policyPosture.violationsInLast24h}
                  </Typography>
                </Box>
              </Stack>
            </SectionWrapper>

            <SectionWrapper
              title="Delegated Connections"
              action={
                <Button
                  component={RouterLink}
                  to={paths.delegations}
                  size="small"
                  endIcon={
                    <IconifyIcon icon="material-symbols:arrow-right-alt-rounded" />
                  }
                >
                  Review delegations
                </Button>
              }
            >
              {data.connectedAccounts.length === 0 ? (
                <EmptyState
                  title="No delegated connections"
                  description="Bound external accounts will appear here after delegated access is configured."
                />
              ) : (
                <List disablePadding>
                  {data.connectedAccounts.map((acc, index) => (
                    <Box key={acc.id}>
                      <ListItem sx={{ py: 1.5, px: 0 }}>
                        <ListItemText
                          primary={
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600 }}
                            >
                              {acc.accountName}
                            </Typography>
                          }
                          secondary={`${acc.provider} · Last sync ${dayjs(
                            acc.lastSync,
                          ).fromNow()}`}
                        />
                        <Chip
                          label={acc.status}
                          size="small"
                          color={
                            acc.status === "active"
                              ? "success"
                              : acc.status === "error"
                                ? "error"
                                : "default"
                          }
                          variant="outlined"
                        />
                      </ListItem>
                      {index < data.connectedAccounts.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              )}
            </SectionWrapper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
