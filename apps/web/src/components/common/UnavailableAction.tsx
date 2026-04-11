import { Button, Tooltip, type ButtonProps } from "@mui/material";

interface UnavailableActionProps extends Omit<ButtonProps, "disabled"> {
  reason?: string;
}

export const UnavailableAction = ({
  reason = "This action is not wired in the frontend mock yet.",
  children,
  ...buttonProps
}: UnavailableActionProps) => {
  return (
    <Tooltip title={reason}>
      <span
        style={{
          display: buttonProps.fullWidth ? "block" : "inline-flex",
          width: buttonProps.fullWidth ? "100%" : undefined,
        }}
      >
        <Button {...buttonProps} disabled>
          {children}
        </Button>
      </span>
    </Tooltip>
  );
};
