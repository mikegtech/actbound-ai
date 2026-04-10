import { Box, Typography, Breadcrumbs, Link as MuiLink } from "@mui/material";
import { Link as RouterLink } from "@tanstack/react-router";
import IconifyIcon from "components/base/IconifyIcon";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string; to?: string }>;
}

export const PageHeader = ({
  title,
  subtitle,
  breadcrumbs,
}: PageHeaderProps) => {
  return (
    <Box sx={{ mb: 4 }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs
          separator={
            <IconifyIcon
              icon="material-symbols:chevron-right-rounded"
              sx={{ fontSize: 16 }}
            />
          }
          aria-label="breadcrumb"
          sx={{ mb: 1.5 }}
        >
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            const target = crumb.to ?? crumb.href;
            return target && !isLast ? (
              <MuiLink
                key={index}
                color="inherit"
                component={RouterLink}
                to={target}
                underline="hover"
                variant="body2"
              >
                {crumb.label}
              </MuiLink>
            ) : (
              <Typography
                key={index}
                color="text.primary"
                variant="body2"
                sx={{ fontWeight: 500 }}
              >
                {crumb.label}
              </Typography>
            );
          })}
        </Breadcrumbs>
      )}
      <Typography
        variant="h3"
        sx={{ fontWeight: 600, color: "text.primary", mb: subtitle ? 0.5 : 0 }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body1" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Box>
  );
};
