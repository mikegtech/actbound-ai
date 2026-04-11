import {
  PreparedMutationAction,
  type PreparedMutationKind,
} from "./PreparedMutationAction";
import type { ButtonProps } from "@mui/material";

interface UnavailableActionProps extends Omit<ButtonProps, "disabled"> {
  reason?: string;
  actionKind?: PreparedMutationKind;
  futureCapability?: string;
  dialogTitle?: string;
}

export const UnavailableAction = ({
  reason = "This action is not wired in the frontend mock yet.",
  children,
  actionKind,
  futureCapability,
  dialogTitle,
  ...buttonProps
}: UnavailableActionProps) => {
  return (
    <PreparedMutationAction
      {...buttonProps}
      reason={reason}
      actionKind={actionKind}
      futureCapability={futureCapability}
      dialogTitle={dialogTitle}
    >
      {children}
    </PreparedMutationAction>
  );
};
