import { Box, Typography, Stack, Divider, Grid } from "@mui/material";
import { Link as RouterLink } from "@tanstack/react-router";
import { PageHeader } from "components/common/PageHeader";
import { SectionWrapper } from "components/common/SectionWrapper";
import { useResourceDetail } from "./api/useResourceQueries";
import { ResourceSensitivityBadge } from "./components/ResourceSensitivityBadge";
import { LoadingState, ErrorState } from "components/common/StateViews";
import IconifyIcon from "components/base/IconifyIcon";
import dayjs from "dayjs";
import { UnavailableAction } from "components/common/UnavailableAction";

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
            { label: "Resources", to: "/resources" },
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
            { label: "Resources", to: "/resources" },
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
          { label: "Resources", to: "/resources" },
          { label: resource.name },
        ]}
      />

      <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
        <UnavailableAction
          variant="outlined"
          actionKind="review"
          reason="Attached policy lookup is not wired to resource data yet."
          futureCapability="This will eventually inspect policies attached to this resource without mutating resource state."
          startIcon={
            <IconifyIcon icon="material-symbols:policy-outline-rounded" />
          }
        >
          View Attached Policies
        </UnavailableAction>
        <UnavailableAction
          variant="outlined"
          actionKind="review"
          reason="Resource-specific audit filtering is not implemented yet."
          futureCapability="This will eventually open an audit view filtered to this resource and related assistant/delegation events."
          startIcon={<IconifyIcon icon="material-symbols:history-rounded" />}
        >
          Audit History
        </UnavailableAction>
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
                    Owning Organization
                  </Typography>
                  <Typography variant="body1">
                    <RouterLink
                      to="/organizations/$organizationId"
                      params={{ organizationId: resource.organizationId }}
                      style={{ textDecoration: "none" }}
                    >
                      <Typography component="span" color="primary">
                        {resource.organizationName}
                      </Typography>
                    </RouterLink>
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
                  Mock binding count only. Linked assistants will appear once
                  relationship data is wired.
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
