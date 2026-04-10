import { Box, Typography, Paper } from "@mui/material";
import { ReactNode } from "react";

export interface SectionWrapperProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}

export const SectionWrapper = ({
  title,
  action,
  children,
}: SectionWrapperProps) => {
  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "none",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        {action && <Box>{action}</Box>}
      </Box>
      <Box>{children}</Box>
    </Paper>
  );
};
