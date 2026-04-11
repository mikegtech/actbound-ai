import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
} from "@mui/material";
import IconifyIcon from "components/base/IconifyIcon";
import { EntityRouteLink } from "components/common/EntityRouteLink";
import type { AuditEventDto } from "../types";
import { AuditStatusBadge } from "./AuditStatusBadge";

interface AuditTableProps {
  events: AuditEventDto[];
  onRowClick: (event: AuditEventDto) => void;
}

export const AuditTable = ({ events, onRowClick }: AuditTableProps) => {
  if (!events || events.length === 0) {
    return (
      <Box
        p={5}
        textAlign="center"
        bgcolor="background.elevation1"
        borderRadius={2}
      >
        <Typography variant="body1" color="text.secondary">
          No audit events found.
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2 }}>
      <Table sx={{ minWidth: 650 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>
              Actor
            </TableCell>
            <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>
              Event / Action
            </TableCell>
            <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>
              Target Resource
            </TableCell>
            <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>
              Status
            </TableCell>
            <TableCell
              align="right"
              sx={{ color: "text.secondary", fontWeight: 600 }}
            >
              Timestamp
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {events.map((event) => (
            <TableRow
              key={event.id}
              hover
              onClick={() => onRowClick(event)}
              sx={{
                cursor: "pointer",
                "&:last-child td, &:last-child th": { border: 0 },
              }}
            >
              <TableCell>
                <Box display="flex" alignItems="center" gap={1.5}>
                  {event.actor.principalType === "assistant" ? (
                    <IconifyIcon
                      icon="ph:robot"
                      sx={{ color: "text.secondary", fontSize: 20 }}
                    />
                  ) : (
                    <IconifyIcon
                      icon="ph:user"
                      sx={{ color: "text.secondary", fontSize: 20 }}
                    />
                  )}
                  <Box>
                    {event.actor.principalType === "assistant" &&
                    event.assistantContext ? (
                      <EntityRouteLink
                        type="assistant"
                        id={event.assistantContext.assistantId}
                        label={event.actor.displayName || event.actor.sub}
                        variant="body2"
                        stopPropagation
                      />
                    ) : (
                      <Typography variant="body2" fontWeight={500}>
                        {event.actor.displayName || event.actor.sub}
                      </Typography>
                    )}
                    {event.actor.principalType === "assistant" && (
                      <Typography variant="caption" color="text.secondary">
                        Automated Request
                      </Typography>
                    )}
                  </Box>
                </Box>
              </TableCell>

              <TableCell>
                <Box>
                  <Typography variant="body2" fontWeight={500}>
                    {event.eventType}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontFamily="monospace"
                  >
                    {event.action}
                  </Typography>
                </Box>
              </TableCell>

              <TableCell>
                {event.resource ? (
                  <Box>
                    {event.resource.routeType ? (
                      <EntityRouteLink
                        type={event.resource.routeType}
                        id={event.resource.id}
                        label={event.resource.displayName}
                        variant="body2"
                        stopPropagation
                      />
                    ) : (
                      <Typography variant="body2" fontWeight={500}>
                        {event.resource.displayName}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {event.resource.type}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    -
                  </Typography>
                )}
              </TableCell>

              <TableCell>
                <AuditStatusBadge signal={event.decision.signal} />
              </TableCell>

              <TableCell align="right">
                <Typography variant="body2" color="text.secondary">
                  {new Date(event.occurredAt).toLocaleString()}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
