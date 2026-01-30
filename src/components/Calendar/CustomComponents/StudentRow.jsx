import { Box, Typography, Tooltip } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

function StudentRow({ report }) {
  const { studentName, status } = report;

  const isCancelled = status === "cancelled";
  const isReported = status && status !== "cancelled";

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      gap={0.5}
      sx={{ minHeight: 16 }}
    >
      {isCancelled && (
        <Tooltip title={`Status: ${status}`}>
          <CancelIcon
            sx={{
              fontSize: 14,
              color: "error.main",
            }}
          />
        </Tooltip>
      )}

      {isReported && (
        <Tooltip title={`Status: ${status}`}>
          <CheckCircleIcon
            sx={{
              fontSize: 14,
              color: "success.main",
            }}
          />
        </Tooltip>
      )}

      <Typography
        variant="caption"
        noWrap
        sx={{
          textDecoration: isCancelled ? "line-through" : "none",
          color: isCancelled ? "error.main" : "inherit",
          opacity: isCancelled ? 0.7 : 1,
          flexGrow: 1,
        }}
      >
        {studentName}
      </Typography>
    </Box>
  );
}

export default StudentRow;
