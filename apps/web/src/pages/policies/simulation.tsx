import {
  Box,
  Typography,
  Button,
  Stack,
  Divider,
  Grid,
  Paper,
  Chip,
} from "@mui/material";
import { PageHeader } from "components/common/PageHeader";
import { SectionWrapper } from "components/common/SectionWrapper";
import {
  usePolicySimulationTrace,
  usePolicyDetail,
} from "./api/usePolicyQueries";
import { SimulationStepNode } from "./components/SimulationStepNode";
import { LoadingState, ErrorState } from "components/common/StateViews";
import IconifyIcon from "components/base/IconifyIcon";

interface SimulationProps {
  id: string;
}

const PolicySimulation = ({ id }: SimulationProps) => {
  const { data: policy } = usePolicyDetail(id);
  const {
    data: trace,
    isLoading,
    isError,
    error,
    refetch,
  } = usePolicySimulationTrace(id);

  if (isLoading) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <PageHeader
          title="Running Engine Trace..."
          breadcrumbs={[
            { label: "Policies", href: "/policies" },
            { label: "Simulation" },
          ]}
        />
        <LoadingState />
      </Box>
    );
  }

  if (isError || !trace) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <PageHeader
          title="Engine Error"
          breadcrumbs={[
            { label: "Policies", href: "/policies" },
            { label: "Simulation" },
          ]}
        />
        <ErrorState error={error as Error} onRetry={refetch} />
      </Box>
    );
  }

  const decisionColor =
    trace.decision === "ALLOWED"
      ? "success"
      : trace.decision === "DENIED"
        ? "error"
        : "warning";

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader
        title="Policy Trace Analysis"
        subtitle={`Contextual sandbox run against ${policy?.name || "Policy"}`}
        breadcrumbs={[
          { label: "Policies", href: "/policies" },
          { label: policy?.name || id, href: `/policies/${id}` },
          { label: "Trace Simulation" },
        ]}
      />

      <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
        <Button
          variant="outlined"
          startIcon={<IconifyIcon icon="material-symbols:refresh-rounded" />}
          onClick={() => refetch()}
        >
          Re-evaluate
        </Button>
      </Stack>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={4}>
            <SectionWrapper title="Evaluation Result">
              <Box
                sx={{
                  p: 4,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid",
                  borderColor: `${decisionColor}.main`,
                  borderRadius: 3,
                  bgcolor: `${decisionColor}.lighter`,
                }}
              >
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    color: `${decisionColor}.dark`,
                    textAlign: "center",
                    letterSpacing: 1,
                  }}
                >
                  {trace.decision}
                </Typography>
              </Box>
            </SectionWrapper>

            <SectionWrapper title="Request Context">
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Source Base
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontFamily: "monospace", mt: 0.5 }}
                  >
                    {trace.context.sourceIp}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Chronology Context
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {trace.context.shiftStatus}
                  </Typography>
                </Box>
              </Stack>
            </SectionWrapper>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={4}>
            <SectionWrapper title="Execution Logic Trace">
              <Paper
                variant="outlined"
                sx={{ p: 4, borderRadius: 3, bgcolor: "background.paper" }}
              >
                {trace.steps.map((step, idx) => (
                  <SimulationStepNode
                    key={step.id}
                    step={step}
                    isLast={idx === trace.steps.length - 1}
                  />
                ))}
              </Paper>
            </SectionWrapper>

            <SectionWrapper title="Policy Hierarchy">
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                sx={{ mt: 2 }}
              >
                <Chip label="ActBound Global Security" variant="outlined" />
                <IconifyIcon
                  icon="material-symbols:arrow-right-alt-rounded"
                  sx={{ color: "text.disabled" }}
                />
                <Chip
                  label="Execution Terminal Node"
                  variant="filled"
                  color="primary"
                />
              </Stack>
            </SectionWrapper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PolicySimulation;
