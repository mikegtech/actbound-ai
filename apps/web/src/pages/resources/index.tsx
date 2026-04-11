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
import { useResourcesList } from "./api/useResourceQueries";
import { ResourceCard } from "./components/ResourceCard";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "components/common/StateViews";
import IconifyIcon from "components/base/IconifyIcon";
import { UnavailableAction } from "components/common/UnavailableAction";
import { useState } from "react";

const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

const Resources = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const {
    data: resources,
    isLoading,
    isError,
    error,
    refetch,
  } = useResourcesList();

  if (isLoading) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <PageHeader
          title="Resources Directory"
          subtitle="Review protected resources, sensitivity, ownership, and assistant access paths."
        />
        <LoadingState />
      </Box>
    );
  }

  if (isError || !resources) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <PageHeader
          title="Resources Directory"
          subtitle="Review protected resources, sensitivity, ownership, and assistant access paths."
        />
        <ErrorState error={error as Error} onRetry={refetch} />
      </Box>
    );
  }

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredResources = normalizedSearchTerm
    ? resources.filter((resource) =>
        [
          resource.name,
          resource.id,
          resource.category,
          resource.sensitivity,
          resource.organizationId,
          resource.organizationName,
        ].some((value) => value.toLowerCase().includes(normalizedSearchTerm)),
      )
    : resources;

  const highSensitivityCount = resources.filter((resource) =>
    ["critical", "high"].includes(resource.sensitivity),
  ).length;
  const accessPathCount = resources.reduce(
    (total, resource) => total + resource.assistantAccessCount,
    0,
  );
  const recentlyAuditedCount = resources.filter(
    (resource) =>
      Date.now() - new Date(resource.lastAuditedAt).getTime() <= sevenDaysMs,
  ).length;

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader
        title="Resources Directory"
        subtitle="Review protected resources, sensitivity, ownership, and assistant access paths."
      />

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper
            sx={{
              p: 3,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              boxShadow: "none",
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              {resources.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Resources
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper
            sx={{
              p: 3,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              boxShadow: "none",
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              {highSensitivityCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              High/Critical Sensitivity
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper
            sx={{
              p: 3,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              boxShadow: "none",
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              {accessPathCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Assistant Access Paths
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper
            sx={{
              p: 3,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              boxShadow: "none",
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              {recentlyAuditedCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Audited This Week
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{ mb: 4 }}
        justifyContent="space-between"
      >
        <TextField
          placeholder="Search resources..."
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
            reason="Resource filtering facets are not wired to the frontend mock yet."
            startIcon={
              <IconifyIcon icon="material-symbols:filter-list-rounded" />
            }
          >
            Filter
          </UnavailableAction>
        </Stack>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 6 }}>
        <Grid size={{ xs: 12, lg: 9 }}>
          <SectionWrapper title="Protected Assets">
            {filteredResources.length === 0 ? (
              <EmptyState
                title="No Resources Found"
                description={
                  normalizedSearchTerm
                    ? "No resources match the current search."
                    : "There are no protected resources mapped in the system."
                }
              />
            ) : (
              <Grid container spacing={3}>
                {filteredResources.map((resource) => (
                  <Grid size={{ xs: 12, md: 6, xl: 4 }} key={resource.id}>
                    <ResourceCard resource={resource} />
                  </Grid>
                ))}
              </Grid>
            )}
            <Typography
              variant="body2"
              sx={{ mt: 3, color: "text.secondary", textAlign: "center" }}
            >
              Showing {filteredResources.length} of {resources.length} protected
              resources
            </Typography>
          </SectionWrapper>
        </Grid>

        <Grid size={{ xs: 12, lg: 3 }}>
          <Stack spacing={3}>
            <SectionWrapper title="Resource Distribution">
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
                  icon="material-symbols:pie-chart-outline-rounded"
                  sx={{ fontSize: 48, color: "text.disabled" }}
                />
              </Paper>
            </SectionWrapper>

            <SectionWrapper title="Security Posture Recommendation">
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderColor: "warning.main",
                  bgcolor: "warning.lighter",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ mb: 1, color: "warning.dark" }}
                >
                  This static recommendation will become actionable once policy
                  and resource access review data are connected.
                </Typography>
                <UnavailableAction
                  size="small"
                  variant="text"
                  color="warning"
                  reason="Resource access review actions are not implemented yet."
                  endIcon={
                    <IconifyIcon icon="material-symbols:arrow-right-alt-rounded" />
                  }
                >
                  Review Actions
                </UnavailableAction>
              </Paper>
            </SectionWrapper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Resources;
