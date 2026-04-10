import { Card, Typography, Stack, Box, Chip } from "@mui/material";
import { Icon } from "@iconify/react";
import type { RiskIndicator } from "../types";

export const RiskAttentionCard = ({
  indicator,
}: {
  indicator: RiskIndicator;
}) => {
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
            <Typography variant="subtitle2" fontWeight={600}>
              {indicator.sourceName}
            </Typography>
            <Chip
              label={indicator.sourceType.replace("_", " ")}
              size="small"
              color="default"
              sx={{
                textTransform: "capitalize",
                fontSize: "0.65rem",
                height: 20,
              }}
            />
          </Stack>
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            mb={1}
          >
            ID: {indicator.sourceId}
          </Typography>
          <Typography variant="body2">{indicator.description}</Typography>
        </Box>
      </Stack>
    </Card>
  );
};
