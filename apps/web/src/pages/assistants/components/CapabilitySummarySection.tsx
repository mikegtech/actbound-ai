import { Box, Chip, Stack } from "@mui/material";
import { SectionWrapper } from "components/common/SectionWrapper";
import { AssistantCapability } from "../types";

interface Props {
  capabilities: AssistantCapability[];
}

export const CapabilitySummarySection = ({ capabilities }: Props) => {
  return (
    <SectionWrapper title="Bounded Capabilities">
      {capabilities.length === 0 ? (
        <Box
          sx={{
            p: 2,
            color: "text.secondary",
            border: "1px dashed",
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          No specific capabilities defined for this assistant.
        </Box>
      ) : (
        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          useFlexGap
          sx={{ mt: 1 }}
        >
          {capabilities.map((cap) => {
            let color: "success" | "error" | "warning" = "warning";
            if (cap.status === "allowed") color = "success";
            if (cap.status === "denied") color = "error";

            return (
              <Chip
                key={cap.id}
                label={cap.name}
                color={color}
                variant="outlined"
                size="small"
                sx={{
                  borderStyle: cap.status === "denied" ? "dashed" : "solid",
                  bgcolor: `background.default`,
                }}
              />
            );
          })}
        </Stack>
      )}
    </SectionWrapper>
  );
};
