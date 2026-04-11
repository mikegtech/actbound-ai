import { Box, Paper, Typography, Stack, Button, Divider } from "@mui/material";
import { Resource } from "../types";
import { ResourceSensitivityBadge } from "./ResourceSensitivityBadge";
import IconifyIcon from "components/base/IconifyIcon";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Link as RouterLink } from "@tanstack/react-router";

dayjs.extend(relativeTime);

interface Props {
  resource: Resource;
}

export const ResourceCard = ({ resource }: Props) => {
  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "none",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 2,
        }}
      >
        <Box>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, wordBreak: "break-all" }}
          >
            {resource.name}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ textTransform: "uppercase", mt: 0.5, display: "block" }}
          >
            {resource.category}
          </Typography>
        </Box>
        <ResourceSensitivityBadge sensitivity={resource.sensitivity} />
      </Box>

      <Typography variant="body2" sx={{ mb: 3, flex: 1 }}>
        {resource.description}
      </Typography>

      <Stack spacing={1.5} sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="caption" color="text.secondary">
            Owner
          </Typography>
          <RouterLink
            to="/organizations/$organizationId"
            params={{ organizationId: resource.organizationId }}
            style={{ textDecoration: "none" }}
          >
            <Typography component="span" variant="caption" color="primary">
              {resource.organizationName}
            </Typography>
          </RouterLink>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="caption" color="text.secondary">
            Access Paths
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {resource.assistantAccessCount}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="caption" color="text.secondary">
            Audited
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {dayjs(resource.lastAuditedAt).fromNow()}
          </Typography>
        </Box>
      </Stack>

      <Divider sx={{ mb: 2, mx: -3 }} />

      <RouterLink
        to="/resources/$resourceId"
        params={{ resourceId: resource.id }}
        style={{ textDecoration: "none" }}
      >
        <Button
          fullWidth
          variant="text"
          color="secondary"
          endIcon={
            <IconifyIcon icon="material-symbols:arrow-right-alt-rounded" />
          }
        >
          View Protections
        </Button>
      </RouterLink>
    </Paper>
  );
};
