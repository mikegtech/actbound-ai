import { Box, Paper, Typography, Stack, Button, Divider } from "@mui/material";
import { Policy } from "../types";
import { PolicyStatusBadge } from "./PolicyStatusBadge";
import IconifyIcon from "components/base/IconifyIcon";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Link } from "@tanstack/react-router";

dayjs.extend(relativeTime);

interface Props {
  policy: Policy;
}

export const PolicyCard = ({ policy }: Props) => {
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
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {policy.name}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block" }}
          >
            env: {policy.env} • scope: {policy.scope}
          </Typography>
        </Box>
        <PolicyStatusBadge status={policy.status} />
      </Box>

      <Typography variant="body2" sx={{ mb: 3, flex: 1 }}>
        {policy.description}
      </Typography>

      <Stack spacing={1.5} sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="caption" color="text.secondary">
            Last Updated
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {dayjs(policy.updatedAt).fromNow()}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="caption" color="text.secondary">
            Author
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {policy.author}
          </Typography>
        </Box>
      </Stack>

      <Divider sx={{ mb: 2, mx: -3 }} />

      <Link
        to="/policies/$policyId"
        params={{ policyId: policy.id }}
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
          View Logic
        </Button>
      </Link>
    </Paper>
  );
};
