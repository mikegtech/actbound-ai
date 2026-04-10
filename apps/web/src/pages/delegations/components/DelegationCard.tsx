import {
  Box,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography,
  Chip,
  Button,
} from "@mui/material";
import { Delegation } from "../types";
import { DelegationStatusBadge } from "./DelegationStatusBadge";
import IconifyIcon from "components/base/IconifyIcon";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

interface Props {
  delegation: Delegation;
}

export const DelegationCard = ({ delegation }: Props) => {
  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "surfaceContainerLowest.main",
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={2}
        >
          <Box>
            <Typography
              variant="h6"
              sx={{ fontFamily: "Manrope", fontWeight: 700 }}
            >
              {delegation.assistant.name}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              fontFamily="Space Grotesk"
            >
              ID: {delegation.id}
            </Typography>
          </Box>
          <DelegationStatusBadge status={delegation.status} />
        </Stack>

        <Stack spacing={1.5} mb={3}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconifyIcon
              icon="ic:outline-account-circle"
              color="text.secondary"
            />
            <Typography variant="body2">
              <Typography
                component="span"
                variant="body2"
                color="text.secondary"
                mr={0.5}
              >
                Granted by:
              </Typography>
              {delegation.grantor.name}
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconifyIcon icon="ic:outline-domain" color="text.secondary" />
            <Typography variant="body2">
              <Typography
                component="span"
                variant="body2"
                color="text.secondary"
                mr={0.5}
              >
                Boundary:
              </Typography>
              {delegation.organization.name}
            </Typography>
          </Stack>
        </Stack>

        <Typography
          variant="caption"
          color="text.secondary"
          textTransform="uppercase"
          fontWeight={600}
          letterSpacing={0.5}
          mb={1}
          display="block"
        >
          Delegated Scopes
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}>
          {delegation.scopes.map((scope) => (
            <Chip
              key={scope}
              label={scope}
              size="small"
              sx={{
                bgcolor: "surfaceDim.main",
                fontFamily: "Space Grotesk",
                fontSize: "0.75rem",
              }}
            />
          ))}
        </Box>

        <Box sx={{ mt: "auto" }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="caption" color="text.secondary">
              Created {dayjs(delegation.createdAt).fromNow()}
            </Typography>
            {delegation.expiresAt && (
              <Typography variant="caption" color="warning.main">
                Expires {dayjs(delegation.expiresAt).fromNow()}
              </Typography>
            )}
          </Stack>
        </Box>
      </CardContent>
      <Divider />
      <Box
        sx={{
          p: 1.5,
          textAlign: "center",
          bgcolor: "surfaceContainerLow.main",
        }}
      >
        <Button
          variant="text"
          size="small"
          endIcon={<IconifyIcon icon="ic:baseline-arrow-right-alt" />}
        >
          View Detail
        </Button>
      </Box>
    </Card>
  );
};
