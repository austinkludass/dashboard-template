import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Alert,
  Collapse,
  IconButton,
  Divider,
  CircularProgress,
} from "@mui/material";
import {
  CheckCircle,
  Error as ErrorIcon,
  ExpandMore,
  ExpandLess,
  Refresh,
  SkipNext,
} from "@mui/icons-material";
import { useState } from "react";

const XeroExportResultsDialog = ({
  open,
  onClose,
  results,
  type,
  onRetryAll,
  onRetryItem,
  retrying,
}) => {
  const [showSuccessful, setShowSuccessful] = useState(false);
  const [showFailed, setShowFailed] = useState(true);
  const [showSkipped, setShowSkipped] = useState(false);
  const [retryingItem, setRetryingItem] = useState(null);

  if (!results) return null;

  const successfulItems =
    results.results?.filter((r) => !r.skipped && !r.error) || [];
  const failedItems = results.errorDetails || [];
  const skippedItems = results.results?.filter((r) => r.skipped) || [];

  const handleRetryItem = async (item) => {
    setRetryingItem(item.invoiceId || item.tutorId);
    try {
      await onRetryItem?.(item);
    } finally {
      setRetryingItem(null);
    }
  };

  const getItemName = (item) => {
    return type === "invoices" ? item.familyName : item.tutorName;
  };

  const getItemId = (item) => {
    return type === "invoices" ? item.invoiceId : item.tutorId;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h5">
            {type === "invoices" ? "Invoice" : "Payroll"} Export Results
          </Typography>
          {results.allExported ? (
            <Chip
              icon={<CheckCircle />}
              label="All Exported"
              color="success"
              size="small"
            />
          ) : (
            <Chip
              icon={<ErrorIcon />}
              label="Partial Export"
              color="warning"
              size="small"
            />
          )}
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box display="flex" gap={2} mb={2}>
          <Box
            flex={1}
            p={1.5}
            bgcolor="success.main"
            borderRadius={1}
            textAlign="center"
            sx={{ opacity: 0.9 }}
          >
            <Typography variant="h4" color="white">
              {results.exported || 0}
            </Typography>
            <Typography variant="caption" color="white">
              Exported
            </Typography>
          </Box>
          <Box
            flex={1}
            p={1.5}
            bgcolor="error.main"
            borderRadius={1}
            textAlign="center"
            sx={{ opacity: 0.9 }}
          >
            <Typography variant="h4" color="white">
              {results.errors || 0}
            </Typography>
            <Typography variant="caption" color="white">
              Failed
            </Typography>
          </Box>
          <Box
            flex={1}
            p={1.5}
            bgcolor="grey.500"
            borderRadius={1}
            textAlign="center"
            sx={{ opacity: 0.9 }}
          >
            <Typography variant="h4" color="white">
              {results.skipped || 0}
            </Typography>
            <Typography variant="caption" color="white">
              Skipped
            </Typography>
          </Box>
        </Box>

        {failedItems.length > 0 && (
          <Box mb={2}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              sx={{ cursor: "pointer" }}
              onClick={() => setShowFailed(!showFailed)}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <ErrorIcon color="error" />
                <Typography variant="subtitle1" fontWeight="bold">
                  Failed ({failedItems.length})
                </Typography>
              </Box>
              <IconButton size="small">
                {showFailed ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>

            <Collapse in={showFailed}>
              <Alert severity="error" sx={{ mt: 1, mb: 1 }}>
                The following items could not be exported. Fix the issues in
                XERO or your app, then retry.
              </Alert>

              <List dense>
                {failedItems.map((item, idx) => (
                  <ListItem
                    key={idx}
                    secondaryAction={
                      onRetryItem && (
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => handleRetryItem(item)}
                          disabled={
                            retrying || retryingItem === getItemId(item)
                          }
                        >
                          {retryingItem === getItemId(item) ? (
                            <CircularProgress size={20} />
                          ) : (
                            <Refresh />
                          )}
                        </IconButton>
                      )
                    }
                    sx={{
                      bgcolor: "error.light",
                      borderRadius: 1,
                      mb: 0.5,
                      opacity: 0.9,
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <ErrorIcon color="error" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={getItemName(item)}
                      secondary={
                        <Typography
                          variant="caption"
                          color="error.dark"
                          sx={{
                            display: "block",
                            wordBreak: "break-word",
                            maxWidth: "90%",
                          }}
                        >
                          {item.error?.length > 150
                            ? `${item.error.substring(0, 150)}...`
                            : item.error}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </Box>
        )}

        <Divider sx={{ my: 1 }} />

        {successfulItems.length > 0 && (
          <Box mb={2}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              sx={{ cursor: "pointer" }}
              onClick={() => setShowSuccessful(!showSuccessful)}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <CheckCircle color="success" />
                <Typography variant="subtitle1" fontWeight="bold">
                  Successful ({successfulItems.length})
                </Typography>
              </Box>
              <IconButton size="small">
                {showSuccessful ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>

            <Collapse in={showSuccessful}>
              <List dense>
                {successfulItems.map((item, idx) => (
                  <ListItem
                    key={idx}
                    sx={{
                      bgcolor: "success.light",
                      borderRadius: 1,
                      mb: 0.5,
                      opacity: 0.8,
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <CheckCircle color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={getItemName(item)}
                      secondary={
                        type === "invoices"
                          ? `Invoice #${item.xeroInvoiceNumber || "N/A"}`
                          : `${item.hours || 0}h`
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </Box>
        )}

        {skippedItems.length > 0 && (
          <Box>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              sx={{ cursor: "pointer" }}
              onClick={() => setShowSkipped(!showSkipped)}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <SkipNext color="disabled" />
                <Typography variant="subtitle1" fontWeight="bold">
                  Skipped ({skippedItems.length})
                </Typography>
              </Box>
              <IconButton size="small">
                {showSkipped ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>

            <Collapse in={showSkipped}>
              <List dense>
                {skippedItems.map((item, idx) => (
                  <ListItem
                    key={idx}
                    sx={{
                      bgcolor: "grey.200",
                      borderRadius: 1,
                      mb: 0.5,
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <SkipNext color="disabled" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={getItemName(item)}
                      secondary={item.reason}
                    />
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        {failedItems.length > 0 && onRetryAll && (
          <Button
            startIcon={retrying ? <CircularProgress size={20} /> : <Refresh />}
            onClick={onRetryAll}
            disabled={retrying}
            color="warning"
            variant="contained"
          >
            Retry All Failed ({failedItems.length})
          </Button>
        )}
        <Button
          onClick={onClose}
          variant={failedItems.length > 0 ? "outlined" : "contained"}
        >
          {failedItems.length > 0 ? "Close" : "Done"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default XeroExportResultsDialog;
