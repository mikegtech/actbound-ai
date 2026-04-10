import { Chip } from "@mui/material";

interface Props {
  score: number;
}

export const OrganizationHealthBadge = ({ score }: Props) => {
  let color: "success" | "warning" | "error" = "success";
  if (score < 80) color = "warning";
  if (score < 50) color = "error";

  return (
    <Chip
      label={`${score}% Health`}
      color={color}
      size="small"
      variant="filled"
      sx={{ fontWeight: 600, fontSize: "0.75rem" }}
    />
  );
};
