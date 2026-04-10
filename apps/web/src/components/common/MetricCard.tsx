import { Box, Typography, Paper, Stack } from "@mui/material";
import IconifyIcon from "components/base/IconifyIcon";

export interface MetricCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color?: "primary" | "success" | "warning" | "error" | "info";
}

export const MetricCard = ({
  title,
  value,
  icon,
  trend,
  trendValue,
  color = "primary",
}: MetricCardProps) => {
  const getTrendColor = () => {
    if (trend === "up") return "success.main";
    if (trend === "down") return "error.main";
    return "text.secondary";
  };

  const getTrendIcon = () => {
    if (trend === "up") return "material-symbols:trending-up-rounded";
    if (trend === "down") return "material-symbols:trending-down-rounded";
    return "material-symbols:trending-flat-rounded";
  };

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 3,
        display: "flex",
        flexDirection: "column",
        height: "100%",
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
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {title}
        </Typography>
        <Box
          sx={{
            p: 1,
            borderRadius: 2,
            bgcolor: `background.default`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconifyIcon
            icon={icon}
            sx={{ fontSize: 24, color: `${color}.main` }}
          />
        </Box>
      </Box>
      <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
        {value}
      </Typography>
      {trendValue && (
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <IconifyIcon
            icon={getTrendIcon()}
            sx={{ color: getTrendColor(), fontSize: 16 }}
          />
          <Typography
            variant="caption"
            sx={{ color: getTrendColor(), fontWeight: 600 }}
          >
            {trendValue}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            vs last week
          </Typography>
        </Stack>
      )}
    </Paper>
  );
};
