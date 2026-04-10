import { Link, SvgIcon, type SvgIconProps, Typography } from "@mui/material";
import { Link as RouterLink } from "@tanstack/react-router";
import paths from "routes/paths";

interface LogoProps extends SvgIconProps {
  showName?: boolean;
}

const Logo = ({
  sx,
  viewBox = "0 0 40 40",
  showName = true,
  ...rest
}: LogoProps) => {
  return (
    <Link
      component={RouterLink}
      to={paths.dashboard}
      underline="none"
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
      }}
    >
      <SvgIcon
        viewBox={viewBox}
        sx={{
          height: 36,
          width: 36,
          ...sx,
        }}
        {...rest}
      >
        <path
          d="M20 2L4 9V20C4 30.12 10.84 39.46 20 42C29.16 39.46 36 30.12 36 20V9L20 2Z"
          fill="#0052CC"
        />
        <path
          d="M20 12C16.6863 12 14 14.6863 14 18V22C14 25.3137 16.6863 28 20 28C23.3137 28 26 25.3137 26 22V18C26 14.6863 23.3137 12 20 12ZM20 16C21.1046 16 22 16.8954 22 18V22C22 23.1046 21.1046 24 20 24C18.8954 24 18 23.1046 18 22V18C18 16.8954 18.8954 16 20 16Z"
          fill="white"
        />
        <path d="M11 18H13V22H11V18Z" fill="white" fillOpacity="0.6" />
        <path d="M27 18H29V22H27V18Z" fill="white" fillOpacity="0.6" />
      </SvgIcon>
      {showName && (
        <Typography
          sx={{
            fontFamily: "Manrope",
            color: "text.primary",
            fontWeight: 800,
            fontSize: 22,
            letterSpacing: "-0.5px",
          }}
        >
          ActBound
        </Typography>
      )}
    </Link>
  );
};

export default Logo;
