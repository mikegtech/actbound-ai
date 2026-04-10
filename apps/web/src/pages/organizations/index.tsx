import {
  Box,
  Typography,
  Button,
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

const Organizations = () => {
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
          subtitle="Manage tenant identities, health scores, and cross-entity compliance."
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
          subtitle="Manage tenant identities, health scores, and cross-entity compliance."
        />
        <ErrorState error={error as Error} onRetry={refetch} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader
        title="Organizations Directory"
        subtitle="Manage tenant identities, health scores, and cross-entity compliance."
      />

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{ mb: 4 }}
        justifyContent="space-between"
      >
        <TextField
          placeholder="Search organizations..."
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
          <Button
            variant="outlined"
            startIcon={
              <IconifyIcon icon="material-symbols:filter-list-rounded" />
            }
          >
            Filter
          </Button>
          <Button
            variant="contained"
            startIcon={
              <IconifyIcon icon="material-symbols:domain-add-rounded" />
            }
          >
            New Organization
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 6 }}>
        <Grid size={{ xs: 12, lg: 9 }}>
          <SectionWrapper title="Global Status">
            {organizations.length === 0 ? (
              <EmptyState
                title="No Organizations Found"
                description="There are no active organizations."
              />
            ) : (
              <Grid container spacing={3}>
                {organizations.map((org) => (
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
              {organizations.length} Total Entities
            </Typography>
          </SectionWrapper>
        </Grid>

        <Grid size={{ xs: 12, lg: 3 }}>
          <Stack spacing={3}>
            <SectionWrapper title="Policy Adherence Heatmap">
              <Typography variant="body2" sx={{ mb: 2 }}>
                Cross-entity compliance density across 8 core security
                verticals.
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
              <Button
                size="small"
                variant="text"
                endIcon={
                  <IconifyIcon icon="material-symbols:download-rounded" />
                }
              >
                Download Detailed Assessment
              </Button>
            </SectionWrapper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Organizations;
