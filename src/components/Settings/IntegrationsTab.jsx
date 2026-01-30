import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Collapse,
  useTheme,
} from "@mui/material";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../../data/firebase";
import { tokens } from "../../theme";
import LinkIcon from "@mui/icons-material/Link";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ReceiptIcon from "@mui/icons-material/Receipt";
import PaymentsIcon from "@mui/icons-material/Payments";
import RefreshIcon from "@mui/icons-material/Refresh";
import dayjs from "dayjs";

const functions = getFunctions(app, "australia-southeast1");

const IntegrationsTab = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [xeroStatus, setXeroStatus] = useState(null);
  const [exportHistory, setExportHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const xeroResult = params.get("xero");

    if (xeroResult === "success") {
      setSuccess("Successfully connected to XERO!");
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (xeroResult === "error") {
      const message = params.get("message") || "Unknown error";
      setError(`Failed to connect to XERO: ${message}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    loadXeroStatus();
  }, []);

  const loadXeroStatus = async () => {
    setLoading(true);
    try {
      const getStatusFn = httpsCallable(functions, "getXeroStatus");
      const result = await getStatusFn();
      setXeroStatus(result.data);

      if (result.data.connected) {
        loadExportHistory();
      }
    } catch (err) {
      console.error("Failed to load XERO status:", err);
      setError("Failed to load XERO connection status");
    } finally {
      setLoading(false);
    }
  };

  const loadExportHistory = async () => {
    setHistoryLoading(true);
    try {
      const getHistoryFn = httpsCallable(functions, "getXeroExportHistory");
      const result = await getHistoryFn({ limit: 20 });
      setExportHistory(result.data.history || []);
    } catch (err) {
      console.error("Failed to load export history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    try {
      const getAuthUrlFn = httpsCallable(functions, "getXeroAuthUrl");
      const result = await getAuthUrlFn({
        useSandbox: xeroStatus?.useSandbox || false,
      });

      window.location.href = result.data.authUrl;
    } catch (err) {
      console.error("Failed to get auth URL:", err);
      setError("Failed to initiate XERO connection");
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Are you sure you want to disconnect from XERO?")) {
      return;
    }

    setDisconnecting(true);
    setError(null);
    try {
      const disconnectFn = httpsCallable(functions, "disconnectXero");
      await disconnectFn();
      setXeroStatus({ connected: false });
      setExportHistory([]);
      setSuccess("Disconnected from XERO");
    } catch (err) {
      console.error("Failed to disconnect:", err);
      setError("Failed to disconnect from XERO");
    } finally {
      setDisconnecting(false);
    }
  };

  const handleToggleSandbox = async (event) => {
    const useSandbox = event.target.checked;

    try {
      if (xeroStatus?.connected) {
        if (
          !window.confirm(
            "Changing environment requires reconnecting to XERO. Continue?"
          )
        ) {
          return;
        }

        await httpsCallable(functions, "disconnectXero")();
        setXeroStatus({ connected: false, useSandbox });
        setExportHistory([]);
      } else {
        setXeroStatus((prev) => ({ ...prev, useSandbox }));
      }
    } catch (err) {
      console.error("Failed to toggle sandbox:", err);
      setError("Failed to change environment");
    }
  };

  const getExportTypeIcon = (type) => {
    return type === "invoices" ? (
      <ReceiptIcon color="primary" />
    ) : (
      <PaymentsIcon color="secondary" />
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
        >
          <Box>
            <Box display="flex" alignItems="center" gap={2} mb={1}>
              <img
                src="https://pnghdpro.com/wp-content/themes/pnghdpro/download/social-media-and-brands/xero-accounting-logo.png"
                alt="XERO"
                style={{ width: 32, height: 32 }}
              />
              <Typography variant="h5" fontWeight="bold">
                XERO
              </Typography>
              {xeroStatus?.connected ? (
                <Chip
                  icon={<CheckCircleIcon />}
                  label="Connected"
                  color="success"
                  size="small"
                />
              ) : (
                <Chip
                  icon={<LinkOffIcon />}
                  label="Not Connected"
                  color="default"
                  size="small"
                />
              )}
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Connect to XERO to automatically export invoices and payroll data.
            </Typography>

            {xeroStatus?.connected && (
              <Box>
                <Typography variant="body2">
                  <strong>Organisation:</strong> {xeroStatus.tenantName}
                </Typography>
                {xeroStatus.connectedAt && (
                  <Typography variant="body2" color="text.secondary">
                    Connected on{" "}
                    {dayjs(xeroStatus.connectedAt).format("MMM D, YYYY h:mm A")}
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          <Box
            display="flex"
            flexDirection="column"
            alignItems="flex-end"
            gap={1}
          >
            {xeroStatus?.connected ? (
              <Button
                variant="outlined"
                color="error"
                startIcon={<LinkOffIcon />}
                onClick={handleDisconnect}
                disabled={disconnecting}
              >
                {disconnecting ? <CircularProgress size={20} /> : "Disconnect"}
              </Button>
            ) : (
              <Button
                variant="contained"
                startIcon={<LinkIcon />}
                onClick={handleConnect}
                disabled={connecting}
              >
                {connecting ? (
                  <CircularProgress size={20} />
                ) : (
                  "Connect to XERO"
                )}
              </Button>
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={xeroStatus?.useSandbox || false}
                  onChange={handleToggleSandbox}
                />
              }
              label="Use Sandbox (Demo) Environment"
            />
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              Enable this for testing. Disable for production use.
            </Typography>
          </Box>

          {xeroStatus?.useSandbox && (
            <Chip
              label="SANDBOX MODE"
              color="warning"
              variant="outlined"
              size="small"
            />
          )}
        </Box>
      </Paper>

      {xeroStatus?.connected && (
        <Paper sx={{ p: 3 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h6">Export History</Typography>
            <IconButton onClick={loadExportHistory} disabled={historyLoading}>
              <RefreshIcon />
            </IconButton>
          </Box>

          {historyLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : exportHistory.length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
              py={4}
            >
              No exports yet. Export invoices or payroll from their respective
              pages.
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width={40} />
                    <TableCell>Type</TableCell>
                    <TableCell>Week</TableCell>
                    <TableCell>Exported</TableCell>
                    <TableCell align="center">Success</TableCell>
                    <TableCell align="center">Errors</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {exportHistory.map((export_) => (
                    <>
                      <TableRow
                        key={export_.id}
                        hover
                        sx={{ cursor: "pointer" }}
                        onClick={() =>
                          setExpandedRow(
                            expandedRow === export_.id ? null : export_.id
                          )
                        }
                      >
                        <TableCell>
                          <IconButton size="small">
                            {expandedRow === export_.id ? (
                              <ExpandLessIcon />
                            ) : (
                              <ExpandMoreIcon />
                            )}
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            {getExportTypeIcon(export_.type)}
                            <Typography
                              variant="body2"
                              textTransform="capitalize"
                            >
                              {export_.type}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {dayjs(export_.weekStart).format("MMM D, YYYY")}
                        </TableCell>
                        <TableCell>
                          {dayjs(export_.exportedAt).format(
                            "MMM D, YYYY h:mm A"
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={export_.successCount}
                            color="success"
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          {export_.errorCount > 0 ? (
                            <Chip
                              label={export_.errorCount}
                              color="error"
                              size="small"
                              variant="outlined"
                            />
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell
                          colSpan={6}
                          sx={{ py: 0, borderBottom: "none" }}
                        >
                          <Collapse
                            in={expandedRow === export_.id}
                            timeout="auto"
                            unmountOnExit
                          >
                            <Box sx={{ py: 2, px: 2 }}>
                              {export_.results?.length > 0 && (
                                <Box mb={2}>
                                  <Typography
                                    variant="subtitle2"
                                    color="success.main"
                                    gutterBottom
                                  >
                                    Successful Exports
                                  </Typography>
                                  {export_.results.map((result, idx) => (
                                    <Typography
                                      key={idx}
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      • {result.familyName || result.tutorName}
                                      {result.xeroInvoiceNumber &&
                                        ` → Invoice #${result.xeroInvoiceNumber}`}
                                      {result.hours && ` → ${result.hours}h`}
                                    </Typography>
                                  ))}
                                </Box>
                              )}

                              {export_.errorDetails?.length > 0 && (
                                <Box>
                                  <Typography
                                    variant="subtitle2"
                                    color="error.main"
                                    gutterBottom
                                  >
                                    Errors
                                  </Typography>
                                  {export_.errorDetails.map((err, idx) => (
                                    <Alert
                                      key={idx}
                                      severity="error"
                                      icon={<ErrorIcon fontSize="small" />}
                                      sx={{ mb: 1 }}
                                    >
                                      <Typography variant="body2">
                                        <strong>
                                          {err.familyName || err.tutorName}:
                                        </strong>{" "}
                                        {err.error}
                                      </Typography>
                                    </Alert>
                                  ))}
                                </Box>
                              )}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Setup Instructions
        </Typography>

        <Typography variant="body2" color="text.secondary" paragraph>
          To connect XERO, ensure the following:
        </Typography>

        <Box component="ol" sx={{ pl: 2 }}>
          <li>
            <Typography variant="body2" color="text.secondary">
              Your XERO organisation has families set up as{" "}
              <strong>Contacts</strong> with matching email addresses
            </Typography>
          </li>
          <li>
            <Typography variant="body2" color="text.secondary">
              Your tutors are set up as <strong>Employees</strong> in XERO
              Payroll AU with matching email addresses
            </Typography>
          </li>
          <li>
            <Typography variant="body2" color="text.secondary">
              You have a <strong>Sales account</strong> (code 200) configured
              for invoice revenue
            </Typography>
          </li>
          <li>
            <Typography variant="body2" color="text.secondary">
              For payroll, ensure tutors have <strong>Earnings Rates</strong>{" "}
              configured in their pay templates
            </Typography>
          </li>
        </Box>

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Tip:</strong> Use Sandbox mode first to test the integration
            without affecting your live XERO data.
          </Typography>
        </Alert>
      </Paper>
    </Box>
  );
};

export default IntegrationsTab;
