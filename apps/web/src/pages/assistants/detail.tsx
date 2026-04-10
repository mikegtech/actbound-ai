import {
  Box,
  Typography,
  Button,
  Stack,
  Divider,
  Paper,
  Grid,
} from "@mui/material";
import { PageHeader } from "components/common/PageHeader";
import { SectionWrapper } from "components/common/SectionWrapper";
import { useAssistantDetail } from "./api/useAssistantQueries";
import { AssistantStatusBadge } from "./components/AssistantStatusBadge";
import { CapabilitySummarySection } from "./components/CapabilitySummarySection";
import { LoadingState, ErrorState } from "components/common/StateViews";
import IconifyIcon from "components/base/IconifyIcon";
import dayjs from "dayjs";

interface AssistantDetailProps {
  id: string;
}

const AssistantDetail = ({ id }: AssistantDetailProps) => {
  const {
    data: assistant,
    isLoading,
    isError,
    error,
    refetch,
  } = useAssistantDetail(id);

  if (isLoading) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <PageHeader
          title="Loading..."
          breadcrumbs={[
            { label: "Assistants", href: "/assistants" },
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
            { label: "Assistants", href: "/assistants" },
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
          { label: "Assistants", href: "/assistants" },
          { label: assistant.name },
        ]}
      />

      <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
        <Button
          variant="outlined"
          startIcon={
            <IconifyIcon icon="material-symbols:edit-document-outline-rounded" />
          }
        >
          Edit Profile
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<IconifyIcon icon="material-symbols:block-rounded" />}
        >
          Restrict
        </Button>
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
                  <Typography variant="body1">
                    {assistant.organizationId}
                  </Typography>
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

            <SectionWrapper title="Connected Integrations">
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  display: "flex",
                  alignItems: "center",
                  bgcolor: "transparent",
                }}
              >
                <IconifyIcon
                  icon="material-symbols:account-tree-outline-rounded"
                  sx={{ fontSize: 32, color: "text.disabled", mr: 2 }}
                />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    OAuth Delegations Configured
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    All bounded integrations will appear here.
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

export default AssistantDetail;
