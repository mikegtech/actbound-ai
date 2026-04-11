import {
  Box,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { ConnectedAccount } from "../types";
import { ConnectionStateBadge } from "./ConnectionStateBadge";
import IconifyIcon from "components/base/IconifyIcon";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { UnavailableAction } from "components/common/UnavailableAction";

dayjs.extend(relativeTime);

interface Props {
  account: ConnectedAccount;
}

export const ConnectedAccountCard = ({ account }: Props) => {
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
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <IconifyIcon
              icon="ic:outline-integration-instructions"
              fontSize={28}
              color="primary.main"
            />
            <Box>
              <Typography
                variant="subtitle1"
                sx={{
                  fontFamily: "Manrope",
                  fontWeight: 600,
                  textTransform: "capitalize",
                }}
              >
                {account.provider} Integration
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                fontFamily="Space Grotesk"
              >
                {account.id}
              </Typography>
            </Box>
          </Stack>
          <ConnectionStateBadge state={account.connectionState} />
        </Stack>

        <Stack spacing={2} sx={{ mt: 3, mb: 3 }}>
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              textTransform="uppercase"
              fontWeight={600}
              letterSpacing={0.5}
            >
              Account Bound
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 500 }}>
              {account.accountName}
            </Typography>
            {account.identityEmail && (
              <Typography variant="caption" color="text.secondary">
                Identity: {account.identityEmail}
              </Typography>
            )}
          </Box>

          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              textTransform="uppercase"
              fontWeight={600}
              letterSpacing={0.5}
            >
              Utilized By
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {account.assistantIds.length}{" "}
              {account.assistantIds.length === 1 ? "Assistant" : "Assistants"}
            </Typography>
          </Box>
        </Stack>

        <Box
          sx={{
            mt: "auto",
            p: 1.5,
            bgcolor: "surfaceContainerLow.main",
            borderRadius: 1,
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="caption" color="text.secondary">
              Connected: {dayjs(account.connectedAt).format("MMM D, YYYY")}
            </Typography>
            {account.lastSyncAt ? (
              <Typography variant="caption" color="text.secondary">
                Last sync: {dayjs(account.lastSyncAt).fromNow()}
              </Typography>
            ) : (
              <Typography variant="caption" color="warning.main">
                Never synced
              </Typography>
            )}
          </Stack>
        </Box>
      </CardContent>
      <Divider />
      <Box sx={{ p: 1.5, textAlign: "center", bgcolor: "transparent" }}>
        <UnavailableAction
          variant="text"
          size="small"
          color="primary"
          reason="Connection management is not implemented in the frontend mock yet."
        >
          Manage Connection
        </UnavailableAction>
      </Box>
    </Card>
  );
};
