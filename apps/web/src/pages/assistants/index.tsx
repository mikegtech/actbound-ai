import {
  Box,
  Typography,
  Button,
  Stack,
  TextField,
  InputAdornment,
  Grid,
} from "@mui/material";
import { PageHeader } from "components/common/PageHeader";
import { SectionWrapper } from "components/common/SectionWrapper";
import { useAssistantsList } from "./api/useAssistantQueries";
import { AssistantCard } from "./components/AssistantCard";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "components/common/StateViews";
import IconifyIcon from "components/base/IconifyIcon";

const Assistants = () => {
  const {
    data: assistants,
    isLoading,
    isError,
    error,
    refetch,
  } = useAssistantsList();

  if (isLoading) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <PageHeader
          title="Assistants Directory"
          subtitle="Manage autonomous agents, define their operational scopes, and monitor runtime efficiency across the organization."
        />
        <LoadingState />
      </Box>
    );
  }

  if (isError || !assistants) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <PageHeader
          title="Assistants Directory"
          subtitle="Manage autonomous agents, define their operational scopes, and monitor runtime efficiency across the organization."
        />
        <ErrorState error={error as Error} onRetry={refetch} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader
        title="Assistants Directory"
        subtitle="Manage autonomous agents, define their operational scopes, and monitor runtime efficiency across the organization."
      />

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{ mb: 4 }}
        justifyContent="space-between"
      >
        <TextField
          placeholder="Search assistants by name or ID..."
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
            startIcon={<IconifyIcon icon="material-symbols:add-rounded" />}
          >
            New Assistant
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 6 }}>
        <Grid size={{ xs: 12, lg: 9 }}>
          <SectionWrapper title="Active Agents">
            {assistants.length === 0 ? (
              <EmptyState
                title="No Assistants Found"
                description="There are no assistants configured in your organization yet."
              />
            ) : (
              <Grid container spacing={3}>
                {assistants.map((assistant) => (
                  <Grid size={{ xs: 12, md: 6, xl: 4 }} key={assistant.id}>
                    <AssistantCard assistant={assistant} />
                  </Grid>
                ))}
              </Grid>
            )}
            <Typography
              variant="body2"
              sx={{ mt: 3, color: "text.secondary", textAlign: "center" }}
            >
              Showing {assistants.length} of {assistants.length} Assistants
            </Typography>
          </SectionWrapper>
        </Grid>

        <Grid size={{ xs: 12, lg: 3 }}>
          <Stack spacing={3}>
            <SectionWrapper title="Automate Access Reviews">
              <Typography variant="body2" sx={{ mb: 2 }}>
                Set up your assistants to automatically flag unusual scoping
                changes or runtime anomalies across your engineering
                departments.
              </Typography>
              <Button
                size="small"
                variant="text"
                endIcon={
                  <IconifyIcon icon="material-symbols:arrow-right-alt-rounded" />
                }
              >
                Configure Rules
              </Button>
            </SectionWrapper>

            <SectionWrapper title="Boost Assistant Autonomy">
              <Typography variant="body2" sx={{ mb: 2 }}>
                Assistants in 'Independent' mode currently perform 40% faster
                than 'Delegated' tasks. Review your security thresholds to
                safely switch modes.
              </Typography>
              <Button
                size="small"
                variant="text"
                endIcon={
                  <IconifyIcon icon="material-symbols:arrow-right-alt-rounded" />
                }
              >
                Review Thresholds
              </Button>
            </SectionWrapper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Assistants;
