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
import { useOrganizationsList } from "./api/useOrganizationQueries";
import { OrganizationCard } from "./components/OrganizationCard";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "components/common/StateViews";
import IconifyIcon from "components/base/IconifyIcon";
import { UnavailableAction } from "components/common/UnavailableAction";
import { useState } from "react";

const Organizations = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const {
    data: organizations,
    isLoading,
    isError,
    error,
    refetch,
  } = useOrganizationsList();

  if (isLoading) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <PageHeader
          title="Organizations Directory"
          subtitle="Review organization boundaries, health signals, and mapped ActBound entities."
        />
        <LoadingState />
      </Box>
    );
  }

  if (isError || !organizations) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <PageHeader
          title="Organizations Directory"
          subtitle="Review organization boundaries, health signals, and mapped ActBound entities."
        />
        <ErrorState error={error as Error} onRetry={refetch} />
      </Box>
    );
  }

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredOrganizations = normalizedSearchTerm
    ? organizations.filter((organization) =>
        [
          organization.name,
          organization.id,
          organization.internalCode,
          organization.status,
        ].some((value) => value.toLowerCase().includes(normalizedSearchTerm)),
      )
    : organizations;

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader
        title="Organizations Directory"
        subtitle="Review organization boundaries, health signals, and mapped ActBound entities."
      />

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{ mb: 4 }}
        justifyContent="space-between"
      >
        <TextField
          placeholder="Search organizations..."
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
            reason="Organization filtering facets are not wired to the frontend mock yet."
            futureCapability="This will eventually filter organizations by status, health, resource coverage, and trust-boundary posture."
            startIcon={
              <IconifyIcon icon="material-symbols:filter-list-rounded" />
            }
          >
            Filter
          </UnavailableAction>
          <UnavailableAction
            variant="contained"
            actionKind="create"
            reason="Organization creation is disabled until the create flow exists."
            futureCapability="This will eventually open a validated organization creation workflow backed by gateway mutation support."
            startIcon={
              <IconifyIcon icon="material-symbols:domain-add-rounded" />
            }
          >
            New Organization
          </UnavailableAction>
        </Stack>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 6 }}>
        <Grid size={{ xs: 12, lg: 9 }}>
          <SectionWrapper title="Global Status">
            {filteredOrganizations.length === 0 ? (
              <EmptyState
                title="No Organizations Found"
                description={
                  normalizedSearchTerm
                    ? "No organizations match the current search."
                    : "There are no active organizations."
                }
              />
            ) : (
              <Grid container spacing={3}>
                {filteredOrganizations.map((org) => (
                  <Grid size={{ xs: 12, md: 6, xl: 4 }} key={org.id}>
                    <OrganizationCard organization={org} />
                  </Grid>
                ))}
              </Grid>
            )}
            <Typography
              variant="body2"
              sx={{ mt: 3, color: "text.secondary", textAlign: "center" }}
            >
              Showing {filteredOrganizations.length} of {organizations.length}{" "}
              organizations
            </Typography>
          </SectionWrapper>
        </Grid>

        <Grid size={{ xs: 12, lg: 3 }}>
          <Stack spacing={3}>
            <SectionWrapper title="Policy Posture Preview">
              <Typography variant="body2" sx={{ mb: 2 }}>
                Static preview for organization-level policy coverage. Live
                posture export is not wired in this frontend pass.
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  height: 160,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "background.default",
                  mb: 2,
                }}
              >
                <IconifyIcon
                  icon="material-symbols:area-chart-rounded"
                  sx={{ fontSize: 48, color: "text.disabled" }}
                />
              </Paper>
              <UnavailableAction
                size="small"
                variant="text"
                actionKind="review"
                reason="Detailed organization posture export is not implemented yet."
                futureCapability="This will eventually export a generated organization posture report from gateway-backed review data."
                endIcon={
                  <IconifyIcon icon="material-symbols:download-rounded" />
                }
              >
                Download Detailed Assessment
              </UnavailableAction>
            </SectionWrapper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Organizations;
