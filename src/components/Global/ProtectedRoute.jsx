import { Box, Typography, Paper, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import usePermissions from "../../hooks/usePermissions";
import LockIcon from "@mui/icons-material/Lock";

const ProtectedRoute = ({
  children,
  minimumRole,
  permission,
  fallbackMessage = "You don't have permission to access this page.",
}) => {
  const navigate = useNavigate();
  const { loading, hasMinimumRole, hasPermission } = usePermissions();

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  let hasAccess = true;
  if (minimumRole) {
    hasAccess = hasMinimumRole(minimumRole);
  } else if (permission) {
    hasAccess = hasPermission(permission);
  }

  if (!hasAccess) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="60vh"
        m={4}
      >
        <Paper
          sx={{
            p: 4,
            textAlign: "center",
            maxWidth: 400,
          }}
        >
          <LockIcon
            sx={{
              fontSize: 64,
              color: "text.disabled",
              mb: 2,
            }}
          />
          <Typography variant="h5" gutterBottom>
            Access Restricted
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            {fallbackMessage}
          </Typography>
          <Button variant="contained" onClick={() => navigate("/")}>
            Return to Dashboard
          </Button>
        </Paper>
      </Box>
    );
  }

  return children;
};

export default ProtectedRoute;
