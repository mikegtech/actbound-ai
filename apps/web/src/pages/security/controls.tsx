import { Box, Typography, Stack, Button, Card } from "@mui/material";
import { Icon } from "@iconify/react";
import { Link } from "@tanstack/react-router";

const SecurityControls = () => {
  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 800, mx: "auto" }}>
      <Button
        component={Link}
        to="/security"
        startIcon={<Icon icon="lucide:arrow-left" />}
        sx={{ mb: 3 }}
        color="inherit"
      >
        Back to Posture
      </Button>

      <Typography variant="h4" fontWeight={700} gutterBottom>
        My Security Controls
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>
        Manage and inspect personal boundaries tied directly to your active
        tokens and account states.
      </Typography>

      <Stack spacing={3}>
        <Card sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2} mb={2}>
            <Box
              sx={{
                p: 1,
                bgcolor: "primary.lighter",
                color: "primary.main",
                borderRadius: 1,
              }}
            >
              <Icon icon="lucide:key" width={24} />
            </Box>
            <Typography variant="h6" fontWeight={600}>
              Connected Account Review
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" mb={3}>
            2 integrations are currently operating via manual fallback. Please
            rotate keys to enforce automated PKCE.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Icon icon="lucide:refresh-cw" />}
          >
            Rotate Now
          </Button>
        </Card>

        <Card sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2} mb={2}>
            <Box
              sx={{
                p: 1,
                bgcolor: "error.lighter",
                color: "error.main",
                borderRadius: 1,
              }}
            >
              <Icon icon="lucide:lock" width={24} />
            </Box>
            <Typography variant="h6" fontWeight={600}>
              Delegations Pending Attention
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" mb={3}>
            1 delegation assigned to "Nightly Sync Agent" violated the temporal
            boundary condition.
          </Typography>
          <Button
            variant="contained"
            color="error"
            startIcon={<Icon icon="lucide:x-circle" />}
          >
            Revoke Delegation
          </Button>
        </Card>
      </Stack>
    </Box>
  );
};

export default SecurityControls;
