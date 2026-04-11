import React from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Stack,
  Alert,
  Chip,
} from "@mui/material";
import IconifyIcon from "components/base/IconifyIcon";
import {
  EntityRouteLink,
  entityTypeLabel,
} from "components/common/EntityRouteLink";
import type { AuditEventDto } from "../types";
import { AuditStatusBadge } from "./AuditStatusBadge";

interface AuditEventDrawerProps {
  open: boolean;
  event: AuditEventDto | null;
  onClose: () => void;
}

export const AuditEventDrawer = ({
  open,
  event,
  onClose,
}: AuditEventDrawerProps) => {
  if (!event) return null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 480 },
          elevation: 4,
          borderLeft: 1,
          borderColor: "divider",
        },
      }}
    >
      <Box
        sx={{
          p: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h6" fontWeight={600} fontFamily="Manrope">
          Event Inspection
        </Typography>
        <IconButton onClick={onClose} size="small">
          <IconifyIcon icon="ph:x" />
        </IconButton>
      </Box>

      <Divider />

      <Box sx={{ p: 3, overflowY: "auto" }}>
        <Stack spacing={3}>
          {/* Header context */}
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              textTransform="uppercase"
              fontWeight={700}
            >
              Primary Signal
            </Typography>
            <Box mt={1}>
              <AuditStatusBadge signal={event.decision.signal} />
            </Box>
          </Box>

          {event.decision.reasons && event.decision.reasons.length > 0 && (
            <Alert
              severity={
                event.decision.signal === "denied" ? "error" : "warning"
              }
              sx={{ borderRadius: 2 }}
            >
              {event.decision.reasons.map((r, i) => (
                <div key={i}>
                  <strong>{r.code}</strong>: {r.message}
                </div>
              ))}
            </Alert>
          )}

          <Divider sx={{ borderStyle: "dashed" }} />

          {/* Actor & Action */}
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              textTransform="uppercase"
              fontWeight={700}
            >
              Execution Context
            </Typography>
            <Box
              sx={{
                mt: 1,
                p: 2,
                bgcolor: "background.elevation1",
                borderRadius: 2,
              }}
            >
              <Stack spacing={1.5}>
                <Box display="flex" alignItems="center" gap={1}>
                  {event.actor.principalType === "assistant" ? (
                    <IconifyIcon
                      icon="ph:robot"
                      fontSize={16}
                      sx={{ color: "text.secondary" }}
                    />
                  ) : (
                    <IconifyIcon
                      icon="ph:user"
                      fontSize={16}
                      sx={{ color: "text.secondary" }}
                    />
                  )}
                  {event.actor.principalType === "assistant" &&
                  event.assistantContext ? (
                    <EntityRouteLink
                      type="assistant"
                      id={event.assistantContext.assistantId}
                      label={event.actor.displayName || event.actor.sub}
                      variant="body2"
                    />
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{ fontFamily: "monospace" }}
                    >
                      {event.actor.displayName || event.actor.sub}
                    </Typography>
                  )}
                </Box>
                {event.assistantContext && (
                  <Box display="flex" alignItems="center" gap={1} pl={3}>
                    <Typography variant="caption" color="text.secondary">
                      Assistant context:
                    </Typography>
                    <EntityRouteLink
                      type="assistant"
                      id={event.assistantContext.assistantId}
                      label={event.assistantContext.displayName}
                      variant="caption"
                    />
                    {event.assistantContext.delegatedBySub && (
                      <Typography variant="caption" color="text.secondary">
                        delegated by {event.assistantContext.delegatedBySub}
                      </Typography>
                    )}
                  </Box>
                )}

                <Box pt={1}>
                  <Typography variant="body2">
                    <Typography
                      component="span"
                      color="text.secondary"
                      variant="body2"
                    >
                      Action:{" "}
                    </Typography>
                    <Typography
                      component="span"
                      fontWeight={600}
                      variant="body2"
                    >
                      {event.action}
                    </Typography>
                  </Typography>
                  <Typography variant="body2">
                    <Typography
                      component="span"
                      color="text.secondary"
                      variant="body2"
                    >
                      Event Type:{" "}
                    </Typography>
                    <Typography
                      component="span"
                      fontWeight={600}
                      variant="body2"
                    >
                      {event.eventType}
                    </Typography>
                  </Typography>
                  {event.resource && (
                    <Typography variant="body2">
                      <Typography
                        component="span"
                        color="text.secondary"
                        variant="body2"
                      >
                        Resource:{" "}
                      </Typography>
                      {event.resource.routeType ? (
                        <EntityRouteLink
                          type={event.resource.routeType}
                          id={event.resource.id}
                          label={event.resource.displayName}
                          variant="body2"
                        />
                      ) : (
                        <Typography
                          component="span"
                          fontWeight={600}
                          variant="body2"
                        >
                          {event.resource.displayName}
                        </Typography>
                      )}{" "}
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.secondary"
                      >
                        ({event.resource.type})
                      </Typography>
                    </Typography>
                  )}
                  {event.organizationId && (
                    <Typography variant="body2">
                      <Typography
                        component="span"
                        color="text.secondary"
                        variant="body2"
                      >
                        Organization:{" "}
                      </Typography>
                      <EntityRouteLink
                        type="organization"
                        id={event.organizationId}
                        label={event.organizationId}
                        variant="body2"
                      />
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Box>
          </Box>

          {event.linkedEntities && event.linkedEntities.length > 0 && (
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                textTransform="uppercase"
                fontWeight={700}
              >
                Linked Investigation Context
              </Typography>
              <Stack spacing={1.5} mt={1}>
                {event.linkedEntities.map((entity) => (
                  <Box
                    key={`${entity.type}-${entity.id}`}
                    sx={{
                      p: 1.5,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 2,
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      spacing={1}
                    >
                      <Box>
                        <EntityRouteLink
                          type={entity.type}
                          id={entity.id}
                          label={entity.label}
                          variant="body2"
                        />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          {entity.context}
                        </Typography>
                      </Box>
                      <Chip
                        label={entityTypeLabel(entity.type)}
                        size="small"
                        sx={{ textTransform: "capitalize" }}
                      />
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          {/* Temporal Data */}
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              textTransform="uppercase"
              fontWeight={700}
            >
              Timestamp
            </Typography>
            <Typography
              variant="body2"
              sx={{ mt: 0.5, fontFamily: "monospace" }}
            >
              {new Date(event.occurredAt).toLocaleString()}
            </Typography>
          </Box>

          <Divider sx={{ borderStyle: "dashed" }} />

          {/* Raw Metadata */}
          {event.metadata && (
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                textTransform="uppercase"
                fontWeight={700}
              >
                Extended Metadata
              </Typography>
              <Box
                component="pre"
                sx={{
                  mt: 1,
                  p: 2,
                  bgcolor: "background.elevation1",
                  borderRadius: 2,
                  overflowX: "auto",
                  fontSize: 12,
                  fontFamily: "monospace",
                  color: "text.secondary",
                }}
              >
                {JSON.stringify(event.metadata, null, 2)}
              </Box>
            </Box>
          )}
        </Stack>
      </Box>
    </Drawer>
  );
};
