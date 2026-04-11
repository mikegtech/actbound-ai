import { Box, Paper, Typography, Stack, Button, Divider } from "@mui/material";
import { Assistant } from "../types";
import { AssistantStatusBadge } from "./AssistantStatusBadge";
import IconifyIcon from "components/base/IconifyIcon";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Link } from "@tanstack/react-router";

dayjs.extend(relativeTime);

interface Props {
  assistant: Assistant;
}

export const AssistantCard = ({ assistant }: Props) => {
  const allowedCount = assistant.capabilities.filter(
    (c) => c.status === "allowed",
  ).length;

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
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {assistant.name}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontFamily: "monospace" }}
          >
            {assistant.internalCode}
          </Typography>
        </Box>
        <AssistantStatusBadge status={assistant.status} />
      </Box>

      <Typography variant="body2" sx={{ mb: 3, flex: 1 }}>
        {assistant.description}
      </Typography>

      <Stack spacing={1.5} sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="caption" color="text.secondary">
            Organization
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {assistant.organizationId}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="caption" color="text.secondary">
            Allowed Ops
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {allowedCount}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="caption" color="text.secondary">
            Last Active
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {dayjs(assistant.lastActiveAt).fromNow()}
          </Typography>
        </Box>
      </Stack>

      <Divider sx={{ mb: 2, mx: -3 }} />

      <Link
        to="/assistants/$assistantId"
        params={{ assistantId: assistant.id }}
        style={{ textDecoration: "none" }}
      >
        <Button
          fullWidth
          variant="outlined"
          endIcon={
            <IconifyIcon icon="material-symbols:arrow-right-alt-rounded" />
          }
        >
          View Detail
        </Button>
      </Link>
    </Paper>
  );
};
