import {
  Box,
  Typography,
  Stack,
  TextField,
  InputAdornment,
  Grid,
  Paper,
} from "@mui/material";
import { PageHeader } from "components/common/PageHeader";
import { SectionWrapper } from "components/common/SectionWrapper";
import { usePoliciesList } from "./api/usePolicyQueries";
import { PolicyCard } from "./components/PolicyCard";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "components/common/StateViews";
import IconifyIcon from "components/base/IconifyIcon";
import { UnavailableAction } from "components/common/UnavailableAction";
import { useState } from "react";

const Policies = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const {
    data: policies,
    isLoading,
    isError,
    error,
    refetch,
  } = usePoliciesList();

  if (isLoading) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <PageHeader
          title="Policy Engine"
          subtitle="Review frontend policy definitions, rule conditions, and trace readiness for governed assistant actions."
        />
        <LoadingState />
      </Box>
    );
  }

  if (isError || !policies) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <PageHeader
          title="Policy Engine"
          subtitle="Review frontend policy definitions, rule conditions, and trace readiness for governed assistant actions."
        />
        <ErrorState error={error as Error} onRetry={refetch} />
      </Box>
    );
  }

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredPolicies = normalizedSearchTerm
    ? policies.filter((policy) =>
        [
          policy.name,
          policy.id,
          policy.env,
          policy.scope,
          policy.status,
          policy.author,
        ].some((value) => value.toLowerCase().includes(normalizedSearchTerm)),
      )
    : policies;
  const activePolicyCount = policies.filter(
    (policy) => policy.status === "active",
  ).length;
  const warningPolicyCount = policies.filter(
    (policy) => policy.status === "warning",
  ).length;

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader
        title="Policy Engine"
        subtitle="Review frontend policy definitions, rule conditions, and trace readiness for governed assistant actions."
      />

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{ mb: 4 }}
        justifyContent="space-between"
      >
        <TextField
          placeholder="Search policies..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          size="small"
          sx={{ width: { xs: "100%", md: 400 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <IconifyIcon icon="material-symbols:search-rounded" />
              </InputAdornment>
            ),
          }}
        />
        <Stack direction="row" spacing={2}>
          <UnavailableAction
            variant="outlined"
            actionKind="review"
            reason="Policy filtering facets are not wired to the frontend mock yet."
            futureCapability="This will eventually filter policies by status, scope, environment, owner, and evaluation posture."
            startIcon={
              <IconifyIcon icon="material-symbols:filter-list-rounded" />
            }
          >
            Filter
          </UnavailableAction>
          <UnavailableAction
            variant="contained"
            actionKind="create"
            reason="Policy creation is disabled until the policy authoring flow exists."
            futureCapability="This will eventually open a validated policy authoring workflow backed by gateway mutation support."
            startIcon={<IconifyIcon icon="material-symbols:post-add-rounded" />}
          >
            New Policy
          </UnavailableAction>
        </Stack>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 6 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <SectionWrapper title="Active Rulesets">
            {filteredPolicies.length === 0 ? (
              <EmptyState
                title="No Policies Found"
                description={
                  normalizedSearchTerm
                    ? "No policies match the current search."
                    : "The policy engine has no active constraints."
                }
              />
            ) : (
              <Stack spacing={3}>
                {filteredPolicies.map((policy) => (
                  <PolicyCard key={policy.id} policy={policy} />
                ))}
              </Stack>
            )}
          </SectionWrapper>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
            <SectionWrapper title="Access Frameworks">
              <Stack spacing={2}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Relationship-Based (ReBAC)
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    Authorization based on ownership, parenthood, or
                    hierarchical associations. Use for: Project owners, team
                    folders.
                  </Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Global Guardrails
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    Organization-wide invariants that cannot be bypassed by
                    local policies. Use for: Compliance, Regional lockdowns.
                  </Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Attribute-Based (ABAC)
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    Dynamic permissions using runtime attributes like IP, Time,
                    or Risk Score. Use for: Zero-trust, MFA requirements.
                  </Typography>
                </Paper>
              </Stack>
            </SectionWrapper>

            <SectionWrapper title="Engine Health">
              <Paper
                variant="outlined"
                sx={{ p: 2, display: "flex", alignItems: "center", gap: 2 }}
              >
                <IconifyIcon
                  icon="material-symbols:check-circle-rounded"
                  sx={{ color: "success.main", fontSize: 32 }}
                />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {activePolicyCount} of {policies.length} policies active
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {warningPolicyCount}{" "}
                    {warningPolicyCount === 1
                      ? "warning policy requires"
                      : "warning policies require"}{" "}
                    review
                  </Typography>
                </Box>
              </Paper>
            </SectionWrapper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Policies;
