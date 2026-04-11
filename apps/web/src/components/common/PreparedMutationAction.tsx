import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
  type AlertColor,
  type ButtonProps,
} from "@mui/material";
import { useState, type ReactNode } from "react";

export type PreparedMutationKind =
  | "standard"
  | "create"
  | "configure"
  | "review"
  | "security"
  | "destructive";

interface PreparedMutationActionProps extends Omit<ButtonProps, "onClick"> {
  reason: string;
  actionKind?: PreparedMutationKind;
  futureCapability?: string;
  dialogTitle?: string;
  children: ReactNode;
}

const alertSeverityByKind: Record<PreparedMutationKind, AlertColor> = {
  standard: "info",
  create: "info",
  configure: "warning",
  review: "warning",
  security: "warning",
  destructive: "error",
};

const defaultFutureCapabilityByKind: Record<PreparedMutationKind, string> = {
  standard: "This will require a gateway-backed mutation before it can run.",
  create:
    "This will require a gateway-backed create workflow before it can run.",
  configure:
    "This will require a gateway-backed configuration workflow before it can run.",
  review:
    "This will require gateway-backed review data or action handling before it can run.",
  security:
    "This will require a gateway-backed security mutation with audit evidence before it can run.",
  destructive:
    "This will require confirmation, authorization, gateway mutation handling, and audit evidence before it can run.",
};

export const PreparedMutationAction = ({
  reason,
  actionKind = "standard",
  futureCapability,
  dialogTitle,
  children,
  color,
  variant,
  ...buttonProps
}: PreparedMutationActionProps) => {
  const [open, setOpen] = useState(false);
  const severity = alertSeverityByKind[actionKind];
  const resolvedColor =
    color ?? (actionKind === "destructive" ? "error" : "primary");

  return (
    <>
      <Button
        {...buttonProps}
        color={resolvedColor}
        variant={
          variant ?? (actionKind === "destructive" ? "contained" : "outlined")
        }
        onClick={() => setOpen(true)}
      >
        {children}
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {dialogTitle ?? `Prepared action: ${children}`}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Alert severity={severity} sx={{ borderRadius: 2 }}>
              {reason}
            </Alert>
            <Box>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Future production behavior
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {futureCapability ?? defaultFutureCapabilityByKind[actionKind]}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              No backend call was made and no frontend state was persisted. This
              control is intentionally gated until the matching gateway-backed
              mutation exists.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button disabled color={resolvedColor} variant="contained">
            Gateway mutation required
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
