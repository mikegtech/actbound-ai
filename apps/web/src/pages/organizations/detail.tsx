import { Box, Typography, Stack, Divider, Grid } from "@mui/material";
import { PageHeader } from "components/common/PageHeader";
import { SectionWrapper } from "components/common/SectionWrapper";
import { useOrganizationDetail } from "./api/useOrganizationQueries";
import { OrganizationHealthBadge } from "./components/OrganizationHealthBadge";
import { LoadingState, ErrorState } from "components/common/StateViews";
import IconifyIcon from "components/base/IconifyIcon";
import dayjs from "dayjs";
import { UnavailableAction } from "components/common/UnavailableAction";

interface OrganizationDetailProps {
  id: string;
}

const OrganizationDetail = ({ id }: OrganizationDetailProps) => {
  const {
    data: organization,
    isLoading,
    isError,
    error,
    refetch,
  } = useOrganizationDetail(id);

  if (isLoading) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <PageHeader
          title="Loading..."
          breadcrumbs={[
            { label: "Organizations", to: "/organizations" },
            { label: "Detail" },
          ]}
        />
        <LoadingState />
      </Box>
    );
  }

  if (isError || !organization) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <PageHeader
          title="Error"
          breadcrumbs={[
            { label: "Organizations", to: "/organizations" },
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
        title={organization.name}
        subtitle={organization.description}
        breadcrumbs={[
          { label: "Organizations", to: "/organizations" },
          { label: organization.name },
        ]}
      />

      <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
        <UnavailableAction
          variant="outlined"
          reason="Organization settings are read-only until the settings flow is wired."
          startIcon={
            <IconifyIcon icon="material-symbols:settings-outline-rounded" />
          }
        >
          Manage Settings
        </UnavailableAction>
        <UnavailableAction
          variant="outlined"
          reason="Organization access review is not wired to policy/audit data yet."
          startIcon={
            <IconifyIcon icon="material-symbols:shield-lock-outline-rounded" />
          }
        >
          Review Access
        </UnavailableAction>
      </Stack>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={4}>
            <SectionWrapper title="Identity Profile">
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Internal Code
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: "monospace" }}>
                    {organization.internalCode}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Security Health Score
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <OrganizationHealthBadge score={organization.healthScore} />
                  </Box>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Established
                  </Typography>
                  <Typography variant="body1">
                    {dayjs(organization.createdAt).format("MMMM D, YYYY")}
                  </Typography>
                </Box>
              </Stack>
            </SectionWrapper>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={4}>
            <SectionWrapper title="Associated Infrastructure">
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={3}
                sx={{ mt: 2 }}
              >
                <Box
                  sx={{
                    p: 3,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    flex: 1,
                    textAlign: "center",
                  }}
                >
                  <Typography variant="h3" sx={{ fontWeight: 600 }}>
                    {organization.assistantCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Autonomous Assistants
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 3,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    flex: 1,
                    textAlign: "center",
                  }}
                >
                  <Typography variant="h3" sx={{ fontWeight: 600 }}>
                    {organization.resourceCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Protected Resources
                  </Typography>
                </Box>
              </Stack>
            </SectionWrapper>

            <SectionWrapper title="Delegation Maps">
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
                  icon="material-symbols:account-tree-outline-rounded"
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
                  No active mapped topologies
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ textAlign: "center" }}
                >
                  Delegation topology will appear here after delegation records
                  are linked to this organization.
                </Typography>
              </Box>
            </SectionWrapper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OrganizationDetail;
