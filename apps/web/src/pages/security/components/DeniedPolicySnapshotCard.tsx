import { Card, Typography, Stack, Box, Avatar } from "@mui/material";
import { Icon } from "@iconify/react";
import { EntityRouteLink } from "components/common/EntityRouteLink";
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
          <EntityRouteLink
            type="policy"
            id={snapshot.policyId}
            label={snapshot.policyName}
            variant="subtitle2"
          />
        </Box>
        <Typography variant="caption" color="text.secondary">
          {dayjs(snapshot.deniedAt).fromNow()}
        </Typography>
      </Stack>

      <Typography variant="body2" color="text.secondary" mb={0.5}>
        <Box component="span" fontWeight={500} color="text.primary">
          Assistant:
        </Box>{" "}
        <EntityRouteLink
          type="assistant"
          id={snapshot.assistantId}
          label={snapshot.assistantName}
          variant="body2"
        />
      </Typography>

      <Typography variant="body2" color="text.secondary" mb={0.5}>
        <Box component="span" fontWeight={500} color="text.primary">
          Action:
        </Box>{" "}
        {snapshot.actionAttempted} on{" "}
        <EntityRouteLink
          type="resource"
          id={snapshot.resourceId}
          label={snapshot.resourceName}
          variant="body2"
        />{" "}
        ({snapshot.resourceType})
      </Typography>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {snapshot.delegationId && (
          <EntityRouteLink
            type="delegation"
            id={snapshot.delegationId}
            label="Delegation"
            variant="caption"
          />
        )}
        {snapshot.organizationId && (
          <EntityRouteLink
            type="organization"
            id={snapshot.organizationId}
            label="Organization"
            variant="caption"
          />
        )}
        {snapshot.auditEventId && (
          <EntityRouteLink
            type="audit_event"
            id={snapshot.auditEventId}
            label="Open audit"
            variant="caption"
          />
        )}
      </Stack>
    </Card>
  );
};
