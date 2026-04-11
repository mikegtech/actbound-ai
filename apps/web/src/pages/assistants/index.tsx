import {
  Box,
  Typography,
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
import { UnavailableAction } from "components/common/UnavailableAction";
import { useState } from "react";

const Assistants = () => {
  const [searchTerm, setSearchTerm] = useState("");
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
          subtitle="Review assistant identity, scoped capabilities, and delegated access visibility across the control plane."
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
          subtitle="Review assistant identity, scoped capabilities, and delegated access visibility across the control plane."
        />
        <ErrorState error={error as Error} onRetry={refetch} />
      </Box>
    );
  }

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredAssistants = normalizedSearchTerm
    ? assistants.filter((assistant) =>
        [
          assistant.name,
          assistant.id,
          assistant.internalCode,
          assistant.organizationId,
          assistant.status,
        ].some((value) => value.toLowerCase().includes(normalizedSearchTerm)),
      )
    : assistants;

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader
        title="Assistants Directory"
        subtitle="Review assistant identity, scoped capabilities, and delegated access visibility across the control plane."
      />

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{ mb: 4 }}
        justifyContent="space-between"
      >
        <TextField
          placeholder="Search assistants by name or ID..."
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
            reason="Assistant filtering facets are not wired to the frontend mock yet."
            startIcon={
              <IconifyIcon icon="material-symbols:filter-list-rounded" />
            }
          >
            Filter
          </UnavailableAction>
          <UnavailableAction
            variant="contained"
            reason="Assistant creation is intentionally disabled until the create flow exists."
            startIcon={<IconifyIcon icon="material-symbols:add-rounded" />}
          >
            New Assistant
          </UnavailableAction>
        </Stack>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 6 }}>
        <Grid size={{ xs: 12, lg: 9 }}>
          <SectionWrapper title="Active Agents">
            {filteredAssistants.length === 0 ? (
              <EmptyState
                title="No Assistants Found"
                description={
                  normalizedSearchTerm
                    ? "No assistants match the current search."
                    : "There are no assistants configured in your organization yet."
                }
              />
            ) : (
              <Grid container spacing={3}>
                {filteredAssistants.map((assistant) => (
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
              Showing {filteredAssistants.length} of {assistants.length}{" "}
              Assistants
            </Typography>
          </SectionWrapper>
        </Grid>

        <Grid size={{ xs: 12, lg: 3 }}>
          <Stack spacing={3}>
            <SectionWrapper title="Access Review Readiness">
              <Typography variant="body2" sx={{ mb: 2 }}>
                Assistant review rules will flag unusual scope changes after the
                frontend is connected to policy and audit data.
              </Typography>
              <UnavailableAction
                size="small"
                variant="text"
                reason="Rule configuration is not implemented in this frontend pass."
                endIcon={
                  <IconifyIcon icon="material-symbols:arrow-right-alt-rounded" />
                }
              >
                Configure Rules
              </UnavailableAction>
            </SectionWrapper>

            <SectionWrapper title="Threshold Review">
              <Typography variant="body2" sx={{ mb: 2 }}>
                Threshold reviews will compare assistant scopes against policy
                and security findings when those relationships are wired.
              </Typography>
              <UnavailableAction
                size="small"
                variant="text"
                reason="Threshold review is not wired to mock policy/security data yet."
                endIcon={
                  <IconifyIcon icon="material-symbols:arrow-right-alt-rounded" />
                }
              >
                Review Thresholds
              </UnavailableAction>
            </SectionWrapper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Assistants;
