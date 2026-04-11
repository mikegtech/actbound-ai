import {
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
  type ChipProps,
} from "@mui/material";
import { Link as RouterLink } from "@tanstack/react-router";
import IconifyIcon from "components/base/IconifyIcon";
import { PageHeader } from "components/common/PageHeader";
import { SectionWrapper } from "components/common/SectionWrapper";
import { ErrorState, LoadingState } from "components/common/StateViews";
import { UnavailableAction } from "components/common/UnavailableAction";
import dayjs from "dayjs";
import {
  useConnectedAccountDetail,
  useDelegationDetail,
} from "./api/useDelegationQueries";
import { ConnectionStateBadge } from "./components/ConnectionStateBadge";
import { DelegationStatusBadge } from "./components/DelegationStatusBadge";

interface DelegationDetailProps {
  id: string;
}

const connectedAccountColor = (state?: string): ChipProps["color"] => {
  if (state === "HEALTHY") return "success";
  if (state === "NEEDS_ATTENTION") return "warning";
  if (state === "DISCONNECTED") return "error";
  return "default";
};

const idLabel = (value: string, label: string) => (
  <Typography variant="caption" color="text.secondary" display="block">
    {label}: {value}
  </Typography>
);

const DelegationDetail = ({ id }: DelegationDetailProps) => {
  const {
    data: delegation,
    isLoading,
    isError,
    error,
    refetch,
  } = useDelegationDetail(id);
  const { data: connectedAccount, isLoading: accountLoading } =
    useConnectedAccountDetail(delegation?.connectedAccountId);

  if (isLoading) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <PageHeader
          title="Loading..."
          breadcrumbs={[
            { label: "Trust Core", to: "/delegations" },
            { label: "Delegation" },
          ]}
        />
        <LoadingState />
      </Box>
    );
  }

  if (isError || !delegation) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <PageHeader
          title="Delegation not available"
          breadcrumbs={[
            { label: "Trust Core", to: "/delegations" },
            { label: "Delegation" },
          ]}
        />
        <ErrorState error={error as Error} onRetry={refetch} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1280, mx: "auto" }}>
      <PageHeader
        title={delegation.assistant.name}
        subtitle="Delegated authority boundary, connected account state, and relationship context for this assistant grant."
        breadcrumbs={[
          { label: "Trust Core", to: "/delegations" },
          { label: delegation.id },
        ]}
      />

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 4 }}>
        <RouterLink
          to="/assistants/$assistantId"
          params={{ assistantId: delegation.assistant.id }}
          style={{ textDecoration: "none" }}
        >
          <Button
            variant="outlined"
            startIcon={
              <IconifyIcon icon="material-symbols:smart-toy-outline" />
            }
          >
            Open Assistant
          </Button>
        </RouterLink>
        <UnavailableAction
          variant="outlined"
          color="error"
          reason="Delegation revocation is disabled until a safe mutation flow exists."
          startIcon={<IconifyIcon icon="material-symbols:block-rounded" />}
        >
          Revoke Delegation
        </UnavailableAction>
      </Stack>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={4}>
            <SectionWrapper title="Delegation Posture">
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <DelegationStatusBadge status={delegation.status} />
                  </Box>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Delegation ID
                  </Typography>
                  <Typography variant="body1" fontFamily="monospace">
                    {delegation.id}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Granted By
                  </Typography>
                  <Typography variant="body1">
                    {delegation.grantor.name}
                  </Typography>
                  {idLabel(delegation.grantor.id, "Principal")}
                </Box>
                <Divider />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Created
                  </Typography>
                  <Typography variant="body1">
                    {dayjs(delegation.createdAt).format("MMM D, YYYY h:mm A")}
                  </Typography>
                </Box>
                {delegation.expiresAt && (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Expires
                      </Typography>
                      <Typography variant="body1" color="warning.main">
                        {dayjs(delegation.expiresAt).format(
                          "MMM D, YYYY h:mm A",
                        )}
                      </Typography>
                    </Box>
                  </>
                )}
              </Stack>
            </SectionWrapper>

            <SectionWrapper title="Connected Account">
              {accountLoading ? (
                <LoadingState />
              ) : connectedAccount ? (
                <Stack spacing={2}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="body1" fontWeight={700}>
                      {connectedAccount.provider.toUpperCase()}
                    </Typography>
                    <ConnectionStateBadge
                      state={connectedAccount.connectionState}
                    />
                  </Stack>
                  <Typography variant="body2">
                    {connectedAccount.accountName}
                  </Typography>
                  {idLabel(connectedAccount.id, "Connected account")}
                  {connectedAccount.identityEmail && (
                    <Typography variant="caption" color="text.secondary">
                      Identity: {connectedAccount.identityEmail}
                    </Typography>
                  )}
                  <Chip
                    label={`State: ${connectedAccount.connectionState.replace("_", " ")}`}
                    color={connectedAccountColor(
                      connectedAccount.connectionState,
                    )}
                    size="small"
                    sx={{ alignSelf: "flex-start" }}
                  />
                  <UnavailableAction
                    variant="outlined"
                    size="small"
                    reason="Connection management is not implemented in the frontend mock yet."
                  >
                    Manage Connection
                  </UnavailableAction>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No connected account is attached to this frontend delegation
                  mock.
                </Typography>
              )}
            </SectionWrapper>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={4}>
            <SectionWrapper title="Trust Boundary Relationships">
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
                    <Typography variant="subtitle2" fontWeight={700} mb={1}>
                      Assistant
                    </Typography>
                    <RouterLink
                      to="/assistants/$assistantId"
                      params={{ assistantId: delegation.assistant.id }}
                      style={{ textDecoration: "none" }}
                    >
                      <Typography variant="body2" color="primary">
                        {delegation.assistant.name}
                      </Typography>
                    </RouterLink>
                    <Typography variant="caption" color="text.secondary">
                      {delegation.assistant.internalCode}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
                    <Typography variant="subtitle2" fontWeight={700} mb={1}>
                      Owning Organization
                    </Typography>
                    <RouterLink
                      to="/organizations/$organizationId"
                      params={{ organizationId: delegation.organization.id }}
                      style={{ textDecoration: "none" }}
                    >
                      <Typography variant="body2" color="primary">
                        {delegation.organization.name}
                      </Typography>
                    </RouterLink>
                    <Typography variant="caption" color="text.secondary">
                      {delegation.organization.id}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
                    <Typography variant="subtitle2" fontWeight={700} mb={1}>
                      Reachable Resources
                    </Typography>
                    <Stack spacing={1}>
                      {delegation.resourceIds.map((resourceId) => (
                        <RouterLink
                          key={resourceId}
                          to="/resources/$resourceId"
                          params={{ resourceId }}
                          style={{ textDecoration: "none" }}
                        >
                          <Typography variant="body2" color="primary">
                            {resourceId}
                          </Typography>
                        </RouterLink>
                      ))}
                    </Stack>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
                    <Typography variant="subtitle2" fontWeight={700} mb={1}>
                      Governing Policies
                    </Typography>
                    <Stack spacing={1}>
                      {delegation.policyIds.map((policyId) => (
                        <RouterLink
                          key={policyId}
                          to="/policies/$policyId"
                          params={{ policyId }}
                          style={{ textDecoration: "none" }}
                        >
                          <Typography variant="body2" color="primary">
                            {policyId}
                          </Typography>
                        </RouterLink>
                      ))}
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>
            </SectionWrapper>

            <SectionWrapper title="Delegated Scopes">
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {delegation.scopes.map((scope) => (
                  <Chip
                    key={scope}
                    label={scope}
                    size="small"
                    sx={{ fontFamily: "Space Grotesk" }}
                  />
                ))}
              </Box>
            </SectionWrapper>

            <SectionWrapper title="Audit & Security Cross-References">
              <Stack spacing={2}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    spacing={1}
                  >
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>
                        Audit Events
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {delegation.auditEventIds.length > 0
                          ? delegation.auditEventIds.join(", ")
                          : "No audit event IDs are attached to this mock delegation."}
                      </Typography>
                    </Box>
                    <RouterLink to="/audit" style={{ textDecoration: "none" }}>
                      <Button size="small" variant="text">
                        Open Audit
                      </Button>
                    </RouterLink>
                  </Stack>
                </Paper>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    spacing={1}
                  >
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>
                        Security Signals
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {delegation.securitySignalIds.length > 0
                          ? delegation.securitySignalIds.join(", ")
                          : "No active security signal IDs are attached."}
                      </Typography>
                    </Box>
                    <RouterLink
                      to="/security"
                      style={{ textDecoration: "none" }}
                    >
                      <Button size="small" variant="text">
                        Open Security
                      </Button>
                    </RouterLink>
                  </Stack>
                </Paper>
              </Stack>
            </SectionWrapper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DelegationDetail;
