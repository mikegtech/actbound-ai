import { Box, Paper, Typography, Stack, Button, Divider } from "@mui/material";
import { Organization } from "../types";
import { OrganizationHealthBadge } from "./OrganizationHealthBadge";
import IconifyIcon from "components/base/IconifyIcon";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Link } from "@tanstack/react-router";

dayjs.extend(relativeTime);

interface Props {
  organization: Organization;
}

export const OrganizationCard = ({ organization }: Props) => {
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
            {organization.name}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontFamily: "monospace" }}
          >
            ID: {organization.internalCode}
          </Typography>
        </Box>
        <OrganizationHealthBadge score={organization.healthScore} />
      </Box>

      <Typography variant="body2" sx={{ mb: 3, flex: 1 }}>
        {organization.description}
      </Typography>

      <Stack spacing={1.5} sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="caption" color="text.secondary">
            Assistants
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {organization.assistantCount}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="caption" color="text.secondary">
            Protected Resources
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {organization.resourceCount}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="caption" color="text.secondary">
            Established
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {dayjs(organization.createdAt).format("MMM YYYY")}
          </Typography>
        </Box>
      </Stack>

      <Divider sx={{ mb: 2, mx: -3 }} />

      <Link
        to="/organizations/$organizationId"
        params={{ organizationId: organization.id }}
        style={{ textDecoration: "none" }}
      >
        <Button
          fullWidth
          variant="outlined"
          endIcon={
            <IconifyIcon icon="material-symbols:arrow-right-alt-rounded" />
          }
        >
          View Directory
        </Button>
      </Link>
    </Paper>
  );
};
