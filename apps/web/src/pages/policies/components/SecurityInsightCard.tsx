import { Paper, Typography, Button } from "@mui/material";
import IconifyIcon from "components/base/IconifyIcon";

interface Props {
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const SecurityInsightCard = ({
  title = "Security Insight",
  message,
  actionLabel,
  onAction,
}: Props) => {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderColor: "warning.main",
        bgcolor: "warning.lighter",
        borderRadius: 2,
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          mb: 1,
          color: "warning.dark",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <IconifyIcon icon="material-symbols:lightbulb-circle-outline-rounded" />
        {title}
      </Typography>
      <Typography
        variant="body2"
        sx={{ mb: actionLabel ? 2 : 0, color: "warning.dark" }}
      >
        {message}
      </Typography>
      {actionLabel && (
        <Button
          size="small"
          variant="text"
          color="warning"
          onClick={onAction}
          endIcon={
            <IconifyIcon icon="material-symbols:arrow-right-alt-rounded" />
          }
        >
          {actionLabel}
        </Button>
      )}
    </Paper>
  );
};
