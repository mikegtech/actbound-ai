import {
  Box,
  Typography,
  Button,
  type SxProps,
  type Theme,
} from "@mui/material";
import IconifyIcon from "components/base/IconifyIcon";

interface LoaderProps {
  sx?: SxProps<Theme>;
}
// Stub for inline loading to avoid circular loader dependencies
const InlineLoader = ({ sx }: LoaderProps) => (
  <IconifyIcon
    icon="line-md:loading-twotone-loop"
    sx={{ fontSize: 40, color: "primary.main", ...sx }}
  />
);

export const LoadingState = () => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: 200,
      }}
    >
      <InlineLoader />
    </Box>
  );
};

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState = ({
  title,
  description,
  icon = "material-symbols:inbox-outline-rounded",
  action,
}: EmptyStateProps) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        p: 6,
        minHeight: 250,
        bgcolor: "background.default",
        borderRadius: 3,
        border: "1px dashed",
        borderColor: "divider",
      }}
    >
      <IconifyIcon
        icon={icon}
        sx={{ fontSize: 48, color: "text.disabled", mb: 2 }}
      />
      <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
        {title}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: action ? 3 : 0, maxWidth: 400 }}
      >
        {description}
      </Typography>
      {action && (
        <Button
          variant="outlined"
          onClick={action.onClick}
          startIcon={<IconifyIcon icon="material-symbols:add-rounded" />}
        >
          {action.label}
        </Button>
      )}
    </Box>
  );
};

export interface ErrorStateProps {
  title?: string;
  error?: Error | string;
  onRetry?: () => void;
}

export const ErrorState = ({
  title = "Failed to load content",
  error,
  onRetry,
}: ErrorStateProps) => {
  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "An unexpected error occurred.";
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        p: 6,
        minHeight: 250,
        bgcolor: "error.lighter",
        borderRadius: 3,
        border: "1px solid",
        borderColor: "error.light",
      }}
    >
      <IconifyIcon
        icon="material-symbols:error-outline-rounded"
        sx={{ fontSize: 48, color: "error.main", mb: 2 }}
      />
      <Typography
        variant="h6"
        color="error.dark"
        sx={{ mb: 1, fontWeight: 600 }}
      >
        {title}
      </Typography>
      <Typography
        variant="body2"
        color="error.main"
        sx={{ mb: onRetry ? 3 : 0, maxWidth: 400 }}
      >
        {errorMessage}
      </Typography>
      {onRetry && (
        <Button
          variant="contained"
          color="error"
          onClick={onRetry}
          startIcon={<IconifyIcon icon="material-symbols:refresh-rounded" />}
        >
          Try Again
        </Button>
      )}
    </Box>
  );
};
