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
import { useResourcesList } from "./api/useResourceQueries";
import { ResourceCard } from "./components/ResourceCard";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "components/common/StateViews";
import IconifyIcon from "components/base/IconifyIcon";

const Resources = () => {
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
          subtitle="Centralized management of documents, APIs, servers, and virtual assets."
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
          subtitle="Centralized management of documents, APIs, servers, and virtual assets."
        />
        <ErrorState error={error as Error} onRetry={refetch} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader
        title="Resources Directory"
        subtitle="Centralized management of documents, APIs, servers, and virtual assets."
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
              1,248
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Assets
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
              84
            </Typography>
            <Typography variant="body2" color="text.secondary">
              High Sensitivity
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
              99.8%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Access Integrity
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper
            sx={{
              p: 3,
              border: "1px solid",
              borderColor: "error.main",
              bgcolor: "error.lighter",
              borderRadius: 2,
              boxShadow: "none",
            }}
          >
            <Typography
              variant="h4"
              sx={{ fontWeight: 600, color: "error.main" }}
            >
              14
            </Typography>
            <Typography variant="body2" sx={{ color: "error.main" }}>
              Policy Violations
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
        </Stack>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 6 }}>
        <Grid size={{ xs: 12, lg: 9 }}>
          <SectionWrapper title="Protected Assets">
            {resources.length === 0 ? (
              <EmptyState
                title="No Resources Found"
                description="There are no protected resources mapped in the system."
              />
            ) : (
              <Grid container spacing={3}>
                {resources.map((resource) => (
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
              Showing {resources.length} of 1,248 parameters
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
                  System has detected 3 APIs with excessive permissions. We
                  recommend revoking access for legacy organizational units.
                </Typography>
                <Button
                  size="small"
                  variant="text"
                  color="warning"
                  endIcon={
                    <IconifyIcon icon="material-symbols:arrow-right-alt-rounded" />
                  }
                >
                  Review Actions
                </Button>
              </Paper>
            </SectionWrapper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Resources;
