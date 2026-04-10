import { IconButton } from "@mui/material";
import IconifyIcon from "components/base/IconifyIcon";
import { useSnackbar } from "notistack";

interface SnackbarCloseButtonProps {
  snackbarKey: number | string;
}

const SnackbarCloseButton = ({ snackbarKey }: SnackbarCloseButtonProps) => {
  const { closeSnackbar } = useSnackbar();

  return (
    <IconButton
      className="notistack-close-btn"
      onClick={() => closeSnackbar(snackbarKey)}
      sx={{ mr: 1 }}
    >
      <IconifyIcon
        icon="material-symbols:close-rounded"
        sx={{
          fontSize: 20,
        }}
      />
    </IconButton>
  );
};

export default SnackbarCloseButton;
