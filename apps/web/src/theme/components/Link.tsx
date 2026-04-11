import type { Theme } from "@mui/material";
import type { Components } from "@mui/material/styles";
import { Link as TanStackLink } from "@tanstack/react-router";
import type { AnchorHTMLAttributes, Ref } from "react";

interface LinkBehaviorProps extends Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
> {
  href: string;
  ref?: Ref<HTMLAnchorElement>;
}

export const LinkBehavior = ({ ref, href, ...other }: LinkBehaviorProps) => {
  // Handle hash links and external links with native anchor
  if (href?.startsWith("#") || href?.startsWith("http")) {
    return <a ref={ref} href={href} {...other} />;
  }
  return <TanStackLink to={href} {...other} />;
};

export const HashLinkBehavior = ({
  ref,
  href,
  ...other
}: LinkBehaviorProps) => {
  if (href?.includes("#")) {
    return <a ref={ref} href={href} {...other} />;
  }
  return <TanStackLink to={href} {...other} />;
};

const Link: Components<Omit<Theme, "components">>["MuiLink"] = {
  defaultProps: {
    component: LinkBehavior,
    underline: "hover",
  },
  styleOverrides: {
    underlineHover: () => ({
      position: "relative",
      backgroundImage: `linear-gradient(currentcolor, currentcolor)`,
      backgroundSize: "0% 1px",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "left bottom",
      transition: "background-size 0.25s ease-in",
      "&:hover": {
        textDecoration: "none",
        backgroundSize: "100% 1px",
      },
    }),
  },
};

export default Link;
