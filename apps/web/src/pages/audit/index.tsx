import React, { useState } from "react";
import { Box, Stack, CircularProgress, Alert } from "@mui/material";
import { PageHeader } from "components/common/PageHeader";
import { useAuditEvents } from "./api/useAuditQueries";
import { AuditTable } from "./components/AuditTable";
import { AuditEventDrawer } from "./components/AuditEventDrawer";
import type { AuditEventDto } from "./types";

const Audit = () => {
  const { data: events, isLoading, error } = useAuditEvents();
  const [selectedEvent, setSelectedEvent] = useState<AuditEventDto | null>(
    null,
  );

  const handleRowClick = (event: AuditEventDto) => {
    setSelectedEvent(event);
  };

  const handleCloseDrawer = () => {
    setSelectedEvent(null);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 5 }, maxWidth: 1440, mx: "auto" }}>
      <Stack spacing={4}>
        <PageHeader
          title="Audit Log"
          subtitle="Investigate organizational activity boundaries. Monitor autonomous assistant decisions, policy evaluation barriers, and identity trace pathways across all operations."
        />

        {error && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            Failed to load continuous audit evaluation streams.
          </Alert>
        )}

        {isLoading ? (
          <Box display="flex" justifyContent="center" py={10}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <AuditTable events={events || []} onRowClick={handleRowClick} />
        )}
      </Stack>

      <AuditEventDrawer
        open={Boolean(selectedEvent)}
        event={selectedEvent}
        onClose={handleCloseDrawer}
      />
    </Box>
  );
};

export default Audit;
