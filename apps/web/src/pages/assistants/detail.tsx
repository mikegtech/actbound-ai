import {
  Box,
  Typography,
  Stack,
  Divider,
  Paper,
  Grid,
  Chip,
  type ChipProps,
} from "@mui/material";
import { Link as RouterLink } from "@tanstack/react-router";
import { PageHeader } from "components/common/PageHeader";
import { SectionWrapper } from "components/common/SectionWrapper";
import { useAssistantDetail } from "./api/useAssistantQueries";
import { useAssistantTrustBoundarySummary } from "./api/useAssistantTrustBoundaryQueries";
import { AssistantStatusBadge } from "./components/AssistantStatusBadge";
import { CapabilitySummarySection } from "./components/CapabilitySummarySection";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "components/common/StateViews";
import IconifyIcon from "components/base/IconifyIcon";
import dayjs from "dayjs";
import { UnavailableAction } from "components/common/UnavailableAction";
import type {
  AssistantBoundaryLink,
  AssistantConnectedAccountLink,
  AssistantTrustSignal,
} from "./types";

interface AssistantDetailProps {
  id: string;
}

const connectionStateColor = (
  state: AssistantConnectedAccountLink["connectionState"],
): ChipProps["color"] => {
  if (state === "HEALTHY") return "success";
  if (state === "NEEDS_ATTENTION") return "warning";
  if (state === "DISCONNECTED") return "error";
  return "default";
};

const signalColor = (
  severity: AssistantTrustSignal["severity"],
): ChipProps["color"] => {
  if (severity === "high") return "error";
  if (severity === "warning") return "warning";
  return "default";
};

const BoundaryLinkRow = ({ item }: { item: AssistantBoundaryLink }) => {
  const content = (
    <Box>
      <Typography component="span" variant="body2" color="primary">
        {item.name}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block">
        {item.id}
        {item.meta ? ` - ${item.meta}` : ""}
      </Typography>
    </Box>
  );

  if (item.route === "/organizations/$organizationId") {
    return (
      <RouterLink
        to="/organizations/$organizationId"
        params={{ organizationId: item.id }}
        style={{ textDecoration: "none" }}
      >
        {content}
      </RouterLink>
    );
  }

  if (item.route === "/resources/$resourceId") {
    return (
      <RouterLink
        to="/resources/$resourceId"
        params={{ resourceId: item.id }}
        style={{ textDecoration: "none" }}
      >
        {content}
      </RouterLink>
    );
  }

  if (item.route === "/policies/$policyId") {
    return (
      <RouterLink
        to="/policies/$policyId"
        params={{ policyId: item.id }}
        style={{ textDecoration: "none" }}
      >
        {content}
      </RouterLink>
    );
  }

  if (item.route === "/delegations/$delegationId") {
    return (
      <RouterLink
        to="/delegations/$delegationId"
        params={{ delegationId: item.id }}
        style={{ textDecoration: "none" }}
      >
        {content}
      </RouterLink>
    );
  }

  return content;
};

const AssistantDetail = ({ id }: AssistantDetailProps) => {
  const {
    data: assistant,
    isLoading,
    isError,
    error,
    refetch,
  } = useAssistantDetail(id);
  const {
    data: trustBoundary,
    isLoading: trustBoundaryLoading,
    isError: trustBoundaryError,
  } = useAssistantTrustBoundarySummary(id);

  if (isLoading) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <PageHeader
          title="Loading..."
          breadcrumbs={[
            { label: "Assistants", to: "/assistants" },
            { label: "Detail" },
          ]}
        />
        <LoadingState />
      </Box>
    );
  }

  if (isError || !assistant) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <PageHeader
          title="Error"
          breadcrumbs={[
            { label: "Assistants", to: "/assistants" },
            { label: "Detail" },
          ]}
        />
        <ErrorState error={error as Error} onRetry={refetch} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader
        title={assistant.name}
        subtitle={assistant.description}
        breadcrumbs={[
          { label: "Assistants", to: "/assistants" },
          { label: assistant.name },
        ]}
      />

      <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
        <UnavailableAction
          variant="outlined"
          actionKind="configure"
          reason="Assistant profile editing is not implemented in the frontend mock yet."
          futureCapability="This will eventually open a validated edit flow for assistant identity metadata and profile fields."
          startIcon={
            <IconifyIcon icon="material-symbols:edit-document-outline-rounded" />
          }
        >
          Edit Profile
        </UnavailableAction>
        <UnavailableAction
          variant="outlined"
          color="error"
          actionKind="destructive"
          reason="Restriction changes are disabled until a safe mutation flow exists."
          futureCapability="This will eventually require confirmation, authorization, audit evidence, and gateway mutation handling before restricting an assistant."
          startIcon={<IconifyIcon icon="material-symbols:block-rounded" />}
        >
          Restrict
        </UnavailableAction>
      </Stack>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={4}>
            <SectionWrapper title="Identity & Posture">
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Internal Code
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: "monospace" }}>
                    {assistant.internalCode}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <AssistantStatusBadge status={assistant.status} />
                  </Box>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Organization
                  </Typography>
                  <RouterLink
                    to="/organizations/$organizationId"
                    params={{ organizationId: assistant.organizationId }}
                    style={{ textDecoration: "none" }}
                  >
                    <Typography
                      component="span"
                      variant="body1"
                      color="primary"
                    >
                      {trustBoundary?.organization.name ??
                        assistant.organizationId}
                    </Typography>
                  </RouterLink>
                  {trustBoundary?.organization.meta && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      {trustBoundary.organization.meta}
                    </Typography>
                  )}
                </Box>
                <Divider />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Last Active
                  </Typography>
                  <Typography variant="body1">
                    {dayjs(assistant.lastActiveAt).format("MMM D, YYYY h:mm A")}
                  </Typography>
                </Box>
              </Stack>
            </SectionWrapper>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={4}>
            <CapabilitySummarySection capabilities={assistant.capabilities} />

            <SectionWrapper title="Trust Boundary Context">
              {trustBoundaryLoading ? (
                <LoadingState />
              ) : trustBoundaryError || !trustBoundary ? (
                <EmptyState
                  title="Boundary summary unavailable"
                  description="No typed frontend boundary summary exists for this assistant yet. Mutating controls remain disabled until gateway-backed flows are defined."
                  icon="material-symbols:account-tree-outline-rounded"
                />
              ) : (
                <Stack spacing={3}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
                        <Typography variant="subtitle2" fontWeight={700} mb={1}>
                          Reachable Resources
                        </Typography>
                        {trustBoundary.reachableResources.length > 0 ? (
                          <Stack spacing={1.5}>
                            {trustBoundary.reachableResources.map(
                              (resource) => (
                                <BoundaryLinkRow
                                  key={resource.id}
                                  item={resource}
                                />
                              ),
                            )}
                          </Stack>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No reachable resources are listed in the frontend
                            mock.
                          </Typography>
                        )}
                      </Paper>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
                        <Typography variant="subtitle2" fontWeight={700} mb={1}>
                          Delegated Accounts
                        </Typography>
                        {trustBoundary.delegatedAccounts.length > 0 ? (
                          <Stack spacing={1.5}>
                            {trustBoundary.delegatedAccounts.map((account) => (
                              <Box key={account.id}>
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  alignItems="center"
                                >
                                  <Typography variant="body2" fontWeight={600}>
                                    {account.provider}
                                  </Typography>
                                  <Chip
                                    label={account.connectionState.replace(
                                      "_",
                                      " ",
                                    )}
                                    color={connectionStateColor(
                                      account.connectionState,
                                    )}
                                    size="small"
                                  />
                                </Stack>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  display="block"
                                >
                                  {account.accountName} - {account.id}
                                </Typography>
                              </Box>
                            ))}
                          </Stack>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No delegated connected accounts are listed.
                          </Typography>
                        )}
                      </Paper>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
                        <Typography variant="subtitle2" fontWeight={700} mb={1}>
                          Governing Policies
                        </Typography>
                        {trustBoundary.governingPolicies.length > 0 ? (
                          <Stack spacing={1.5}>
                            {trustBoundary.governingPolicies.map((policy) => (
                              <BoundaryLinkRow key={policy.id} item={policy} />
                            ))}
                          </Stack>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No governing policies are listed for this mock
                            assistant.
                          </Typography>
                        )}
                      </Paper>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
                        <Typography variant="subtitle2" fontWeight={700} mb={1}>
                          Delegations
                        </Typography>
                        {trustBoundary.delegations.length > 0 ? (
                          <Stack spacing={1.5}>
                            {trustBoundary.delegations.map((delegation) => (
                              <BoundaryLinkRow
                                key={delegation.id}
                                item={delegation}
                              />
                            ))}
                          </Stack>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No active delegation relationship is listed.
                          </Typography>
                        )}
                      </Paper>
                    </Grid>
                  </Grid>

                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
                      Audit & Security Signals
                    </Typography>
                    <Stack spacing={1}>
                      {[
                        ...trustBoundary.auditSignals,
                        ...trustBoundary.securitySignals,
                      ].length > 0 ? (
                        [
                          ...trustBoundary.auditSignals,
                          ...trustBoundary.securitySignals,
                        ].map((signal) => (
                          <Stack
                            key={signal.id}
                            direction={{ xs: "column", sm: "row" }}
                            justifyContent="space-between"
                            spacing={1}
                          >
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {signal.label}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
                              >
                                {signal.id}
                              </Typography>
                            </Box>
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                            >
                              <Chip
                                label={signal.severity}
                                color={signalColor(signal.severity)}
                                size="small"
                              />
                              <RouterLink
                                to={
                                  signal.route === "/audit"
                                    ? "/audit"
                                    : "/security"
                                }
                                style={{ textDecoration: "none" }}
                              >
                                <Typography variant="caption" color="primary">
                                  Open{" "}
                                  {signal.route === "/audit"
                                    ? "audit"
                                    : "security"}
                                </Typography>
                              </RouterLink>
                            </Stack>
                          </Stack>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No audit or security signals are listed for this
                          assistant.
                        </Typography>
                      )}
                    </Stack>
                  </Paper>
                </Stack>
              )}
            </SectionWrapper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AssistantDetail;
