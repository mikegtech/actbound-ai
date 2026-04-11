import { Card, Typography, Stack, Box, Chip } from "@mui/material";
import { Icon } from "@iconify/react";
import {
  EntityRouteLink,
  entityTypeLabel,
  type ActBoundEntityType,
} from "components/common/EntityRouteLink";
import type { RiskIndicator } from "../types";

const sourceRouteType = (
  indicator: RiskIndicator,
): ActBoundEntityType | null => {
  if (indicator.sourceType === "assistant") return "assistant";
  if (indicator.sourceType === "delegation") return "delegation";
  return null;
};

export const RiskAttentionCard = ({
  indicator,
}: {
  indicator: RiskIndicator;
}) => {
  const routedSourceType = sourceRouteType(indicator);

  return (
    <Card
      sx={{
        p: 2,
        borderLeft: 4,
        borderColor:
          indicator.severity === "high" ? "error.main" : "warning.main",
      }}
    >
      <Stack direction="row" alignItems="flex-start" spacing={2}>
        <Box
          sx={{
            mt: 0.5,
            color:
              indicator.severity === "high" ? "error.main" : "warning.main",
          }}
        >
          <Icon icon="lucide:alert-triangle" width={20} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={0.5}
          >
            {routedSourceType ? (
              <EntityRouteLink
                type={routedSourceType}
                id={indicator.sourceId}
                label={indicator.sourceName}
                variant="subtitle2"
              />
            ) : (
              <Typography variant="subtitle2" fontWeight={600}>
                {indicator.sourceName}
              </Typography>
            )}
            <Chip
              label={entityTypeLabel(indicator.sourceType)}
              size="small"
              color="default"
              sx={{
                textTransform: "capitalize",
                fontSize: "0.65rem",
                height: 20,
              }}
            />
          </Stack>
          {routedSourceType ? (
            <Box mb={1}>
              <EntityRouteLink
                type={routedSourceType}
                id={indicator.sourceId}
                label={indicator.sourceName}
                variant="caption"
                stopPropagation
              />
            </Box>
          ) : (
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              mb={1}
            >
              Connected account: {indicator.sourceName}
            </Typography>
          )}
          <Typography variant="body2">{indicator.description}</Typography>

          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            useFlexGap
            mt={1.5}
          >
            {indicator.relatedAssistantId && (
              <EntityRouteLink
                type="assistant"
                id={indicator.relatedAssistantId}
                label="Assistant"
                variant="caption"
              />
            )}
            {indicator.relatedDelegationId && (
              <EntityRouteLink
                type="delegation"
                id={indicator.relatedDelegationId}
                label="Delegation"
                variant="caption"
              />
            )}
            {indicator.relatedPolicyId && (
              <EntityRouteLink
                type="policy"
                id={indicator.relatedPolicyId}
                label="Policy"
                variant="caption"
              />
            )}
            {indicator.relatedResourceId && (
              <EntityRouteLink
                type="resource"
                id={indicator.relatedResourceId}
                label="Resource"
                variant="caption"
              />
            )}
            {indicator.auditEventId && (
              <EntityRouteLink
                type="audit_event"
                id={indicator.auditEventId}
                label="Open audit"
                variant="caption"
              />
            )}
          </Stack>
        </Box>
      </Stack>
    </Card>
  );
};
