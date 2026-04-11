import { Typography, type TypographyProps } from "@mui/material";
import { Link as RouterLink } from "@tanstack/react-router";
import type { MouseEventHandler, ReactNode } from "react";

export type ActBoundEntityType =
  | "assistant"
  | "organization"
  | "resource"
  | "policy"
  | "delegation"
  | "audit_event"
  | "security_signal"
  | "connected_account";

interface EntityRouteLinkProps {
  type: ActBoundEntityType;
  id: string;
  label: ReactNode;
  variant?: TypographyProps["variant"];
  color?: TypographyProps["color"];
  fontWeight?: TypographyProps["fontWeight"];
  stopPropagation?: boolean;
}

const linkStyle = { textDecoration: "none" };

export const hasEntityRoute = (type: ActBoundEntityType) =>
  type !== "connected_account";

export const entityTypeLabel = (type: ActBoundEntityType) =>
  type.replace("_", " ");

export const EntityRouteLink = ({
  type,
  id,
  label,
  variant = "body2",
  color = "primary",
  fontWeight = 600,
  stopPropagation = false,
}: EntityRouteLinkProps) => {
  const text = (
    <Typography
      component="span"
      variant={variant}
      color={hasEntityRoute(type) ? color : "text.primary"}
      fontWeight={fontWeight}
    >
      {label}
    </Typography>
  );

  const handleClick: MouseEventHandler<HTMLAnchorElement> | undefined =
    stopPropagation
      ? (event) => {
          event.stopPropagation();
        }
      : undefined;

  if (type === "assistant") {
    return (
      <RouterLink
        to="/assistants/$assistantId"
        params={{ assistantId: id }}
        style={linkStyle}
        onClick={handleClick}
      >
        {text}
      </RouterLink>
    );
  }

  if (type === "organization") {
    return (
      <RouterLink
        to="/organizations/$organizationId"
        params={{ organizationId: id }}
        style={linkStyle}
        onClick={handleClick}
      >
        {text}
      </RouterLink>
    );
  }

  if (type === "resource") {
    return (
      <RouterLink
        to="/resources/$resourceId"
        params={{ resourceId: id }}
        style={linkStyle}
        onClick={handleClick}
      >
        {text}
      </RouterLink>
    );
  }

  if (type === "policy") {
    return (
      <RouterLink
        to="/policies/$policyId"
        params={{ policyId: id }}
        style={linkStyle}
        onClick={handleClick}
      >
        {text}
      </RouterLink>
    );
  }

  if (type === "delegation") {
    return (
      <RouterLink
        to="/delegations/$delegationId"
        params={{ delegationId: id }}
        style={linkStyle}
        onClick={handleClick}
      >
        {text}
      </RouterLink>
    );
  }

  if (type === "audit_event") {
    return (
      <RouterLink to="/audit" style={linkStyle} onClick={handleClick}>
        {text}
      </RouterLink>
    );
  }

  if (type === "security_signal") {
    return (
      <RouterLink to="/security" style={linkStyle} onClick={handleClick}>
        {text}
      </RouterLink>
    );
  }

  return text;
};
