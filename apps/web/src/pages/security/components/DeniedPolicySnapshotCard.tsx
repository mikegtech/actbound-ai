import { Card, Typography, Stack, Box, Avatar } from "@mui/material";
import { Icon } from "@iconify/react";
import type { DeniedPolicySnapshot } from "../types";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export const DeniedPolicySnapshotCard = ({
  snapshot,
}: {
  snapshot: DeniedPolicySnapshot;
}) => {
  return (
    <Card sx={{ p: 2 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={1.5}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Avatar
            sx={{
              width: 24,
              height: 24,
              bgcolor: "error.lighter",
              color: "error.main",
            }}
          >
            <Icon icon="lucide:shield-ban" width={14} />
          </Avatar>
          <Typography variant="subtitle2" fontWeight={600}>
            {snapshot.policyName}
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          {dayjs(snapshot.deniedAt).fromNow()}
        </Typography>
      </Stack>

      <Typography variant="body2" color="text.secondary" mb={0.5}>
        <Box component="span" fontWeight={500} color="text.primary">
          Assistant:
        </Box>{" "}
        {snapshot.assistantName}
      </Typography>

      <Typography variant="body2" color="text.secondary">
        <Box component="span" fontWeight={500} color="text.primary">
          Action:
        </Box>{" "}
        {snapshot.actionAttempted} on {snapshot.resourceType}
      </Typography>
    </Card>
  );
};
