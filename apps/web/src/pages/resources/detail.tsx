import { Box, Typography, Button, Stack, Divider, Grid } from "@mui/material";
import { PageHeader } from "components/common/PageHeader";
import { SectionWrapper } from "components/common/SectionWrapper";
import { useResourceDetail } from "./api/useResourceQueries";
import { ResourceSensitivityBadge } from "./components/ResourceSensitivityBadge";
import { LoadingState, ErrorState } from "components/common/StateViews";
import IconifyIcon from "components/base/IconifyIcon";
import dayjs from "dayjs";

interface ResourceDetailProps {
  id: string;
}

const ResourceDetail = ({ id }: ResourceDetailProps) => {
  const {
    data: resource,
    isLoading,
    isError,
    error,
    refetch,
  } = useResourceDetail(id);

  if (isLoading) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <PageHeader
          title="Loading..."
          breadcrumbs={[
            { label: "Resources", href: "/resources" },
            { label: "Detail" },
          ]}
        />
        <LoadingState />
      </Box>
    );
  }

  if (isError || !resource) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <PageHeader
          title="Error"
          breadcrumbs={[
            { label: "Resources", href: "/resources" },
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
        title={resource.name}
        subtitle={resource.description}
        breadcrumbs={[
          { label: "Resources", href: "/resources" },
          { label: resource.name },
        ]}
      />

      <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
        <Button
          variant="outlined"
          startIcon={
            <IconifyIcon icon="material-symbols:policy-outline-rounded" />
          }
        >
          View Attached Policies
        </Button>
        <Button
          variant="outlined"
          startIcon={<IconifyIcon icon="material-symbols:history-rounded" />}
        >
          Audit History
        </Button>
      </Stack>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={4}>
            <SectionWrapper title="Resource Posture">
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Asset Type
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ textTransform: "uppercase" }}
                  >
                    {resource.category}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Sensitivity Classification
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <ResourceSensitivityBadge
                      sensitivity={resource.sensitivity}
                    />
                  </Box>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Delegation Parent
                  </Typography>
                  <Typography variant="body1">
                    {resource.organizationId}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Last Audited
                  </Typography>
                  <Typography variant="body1">
                    {dayjs(resource.lastAuditedAt).format(
                      "MMMM D, YYYY h:mm A",
                    )}
                  </Typography>
                </Box>
              </Stack>
            </SectionWrapper>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={4}>
            <SectionWrapper title="Delegated Assistants">
              <Box
                sx={{
                  p: 4,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px dashed",
                  borderColor: "divider",
                  borderRadius: 3,
                  bgcolor: "background.default",
                }}
              >
                <IconifyIcon
                  icon="material-symbols:smart-toy-outline-rounded"
                  sx={{ fontSize: 40, color: "text.disabled", mb: 2 }}
                />
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 600,
                    color: "text.secondary",
                    textAlign: "center",
                  }}
                >
                  {resource.assistantAccessCount} Active Bindings
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ textAlign: "center" }}
                >
                  Assistants actively scoped to read or mutate this resource.
                </Typography>
              </Box>
            </SectionWrapper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ResourceDetail;
