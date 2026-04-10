import {
  Box,
  Typography,
  Button,
  Stack,
  Divider,
  Grid,
  Paper,
} from "@mui/material";
import { PageHeader } from "components/common/PageHeader";
import { SectionWrapper } from "components/common/SectionWrapper";
import { usePolicyDetail } from "./api/usePolicyQueries";
import { SecurityInsightCard } from "./components/SecurityInsightCard";
import { LoadingState, ErrorState } from "components/common/StateViews";
import IconifyIcon from "components/base/IconifyIcon";
import { Link } from "@tanstack/react-router";

interface PolicyDetailProps {
  id: string;
}

const PolicyDetail = ({ id }: PolicyDetailProps) => {
  const {
    data: policy,
    isLoading,
    isError,
    error,
    refetch,
  } = usePolicyDetail(id);

  if (isLoading) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <PageHeader
          title="Loading..."
          breadcrumbs={[
            { label: "Policies", href: "/policies" },
            { label: "Editor" },
          ]}
        />
        <LoadingState />
      </Box>
    );
  }

  if (isError || !policy) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <PageHeader
          title="Error"
          breadcrumbs={[
            { label: "Policies", href: "/policies" },
            { label: "Editor" },
          ]}
        />
        <ErrorState error={error as Error} onRetry={refetch} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader
        title={policy.name}
        subtitle={policy.description}
        breadcrumbs={[
          { label: "Policies", href: "/policies" },
          { label: policy.name },
        ]}
      />

      <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
        <Button
          variant="contained"
          startIcon={<IconifyIcon icon="material-symbols:edit-rounded" />}
        >
          Edit Policy
        </Button>
        <Button
          variant="outlined"
          startIcon={<IconifyIcon icon="material-symbols:history-rounded" />}
        >
          History
        </Button>
      </Stack>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={4}>
            <SectionWrapper title="Policy Logic">
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
                  icon="material-symbols:code-blocks-outline-rounded"
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
                  No Logic Fragments Loaded
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ textAlign: "center" }}
                >
                  Connect CEDAR definitions or visual blocks to render
                  evaluation constraints.
                </Typography>
              </Box>
            </SectionWrapper>

            <SectionWrapper title="Sandbox Evaluation">
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Mock Access Request
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Run deterministic tests against the current policy logic.
                  </Typography>
                </Box>
                <Button
                  component={Link}
                  to="/policies/$policyId/simulation"
                  params={{ policyId: policy.id }}
                  variant="outlined"
                  color="primary"
                  endIcon={
                    <IconifyIcon icon="material-symbols:science-outline-rounded" />
                  }
                >
                  Run Trace Simulation
                </Button>
              </Paper>
            </SectionWrapper>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={4}>
            <SectionWrapper title="Security Insight">
              <SecurityInsightCard
                message="This policy currently has a broad 'Role' match. We recommend adding a 'Resource.Department' check to ensure cross-regional financial access is restricted by default. This would reduce potential exposure surface by 14.2%."
                actionLabel="Review Metrics"
              />
            </SectionWrapper>

            <SectionWrapper title="Recent Changes">
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Sarah Chen updated condition
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Today at 10:45 AM
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    System auto-archived version v0.4
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Yesterday at 6:12 PM
                  </Typography>
                </Box>
              </Stack>
            </SectionWrapper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PolicyDetail;
