import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { Link as RouterLink } from "@tanstack/react-router";
import {
  EntityRouteLink,
  entityTypeLabel,
} from "components/common/EntityRouteLink";
import { UnavailableAction } from "components/common/UnavailableAction";
import { useSecurityControls } from "./api/useSecurityQueries";

const SecurityControls = () => {
  const { data: controls, isLoading, isError } = useSecurityControls();

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 800, mx: "auto" }}>
      <RouterLink to="/security" style={{ textDecoration: "none" }}>
        <Button
          startIcon={<Icon icon="lucide:arrow-left" />}
          sx={{ mb: 3 }}
          color="inherit"
        >
          Back to Posture
        </Button>
      </RouterLink>

      <Typography variant="h4" fontWeight={700} gutterBottom>
        My Security Controls
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>
        Review typed frontend controls tied to Connected Account posture and
        Trust Core delegation boundaries. Mutation controls stay disabled until
        safe gateway flows exist.
      </Typography>

      {isError && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          Failed to load typed security control data.
        </Alert>
      )}

      {isLoading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <Stack spacing={3}>
          {controls?.map((control) => {
            const delegationTarget =
              control.relatedDelegationId ?? control.sourceId;

            return (
              <Card key={control.id} sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                  <Box
                    sx={{
                      p: 1,
                      bgcolor:
                        control.severity === "high"
                          ? "error.lighter"
                          : "warning.lighter",
                      color:
                        control.severity === "high"
                          ? "error.main"
                          : "warning.main",
                      borderRadius: 1,
                    }}
                  >
                    <Icon
                      icon={
                        control.sourceType === "connected_account"
                          ? "lucide:key"
                          : "lucide:lock"
                      }
                      width={24}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="h6" fontWeight={600}>
                        {control.title}
                      </Typography>
                      <Chip
                        label={control.severity}
                        color={
                          control.severity === "high" ? "error" : "warning"
                        }
                        size="small"
                      />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {entityTypeLabel(control.sourceType)}:{" "}
                      {control.sourceType === "delegation" ? (
                        <EntityRouteLink
                          type="delegation"
                          id={control.sourceId}
                          label={control.sourceLabel}
                          variant="caption"
                        />
                      ) : (
                        control.sourceLabel
                      )}
                    </Typography>
                    {control.relatedDelegationId && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                      >
                        Boundary:{" "}
                        <EntityRouteLink
                          type="delegation"
                          id={control.relatedDelegationId}
                          label={control.relatedDelegationId}
                          variant="caption"
                        />
                      </Typography>
                    )}
                  </Box>
                </Stack>

                <Typography variant="body2" color="text.secondary" mb={3}>
                  {control.description}
                </Typography>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                  <UnavailableAction
                    variant={
                      control.actionLabel === "Revoke Delegation"
                        ? "contained"
                        : "outlined"
                    }
                    color={
                      control.actionLabel === "Revoke Delegation"
                        ? "error"
                        : "primary"
                    }
                    actionKind={
                      control.actionLabel === "Revoke Delegation"
                        ? "destructive"
                        : "security"
                    }
                    reason={control.actionReason}
                    futureCapability={
                      control.actionLabel === "Revoke Delegation"
                        ? "This will eventually require confirmation, authorization, gateway revocation handling, and audit evidence before changing the delegation state."
                        : "This will eventually rotate Connected Account credentials through a gateway-backed security mutation with audit evidence."
                    }
                    startIcon={
                      <Icon
                        icon={
                          control.actionLabel === "Revoke Delegation"
                            ? "lucide:x-circle"
                            : "lucide:refresh-cw"
                        }
                      />
                    }
                  >
                    {control.actionLabel}
                  </UnavailableAction>
                  <RouterLink
                    to="/delegations/$delegationId"
                    params={{ delegationId: delegationTarget }}
                    style={{ textDecoration: "none" }}
                  >
                    <Button variant="text">Review Trust Boundary</Button>
                  </RouterLink>
                </Stack>
              </Card>
            );
          })}
        </Stack>
      )}
    </Box>
  );
};

export default SecurityControls;
