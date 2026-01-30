import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Button,
  Typography,
  Stack,
  IconButton,
  CircularProgress,
  Grid2 as Grid,
  useTheme,
  Tooltip,
  TextField,
  Chip,
  Alert,
} from "@mui/material";
import {
  getWeekRange,
  nextWeek,
  prevWeek,
  getCurrentWeekStart,
  fetchLessonsForWeek,
  fetchInvoicesForWeek,
  getWeeklyReportStatusBreakdown,
  updateInvoice,
  fetchWeekMeta,
} from "../../utils/InvoiceUtils";
import { getFunctions, httpsCallable } from "firebase/functions";
import { PieChart } from "@mui/x-charts/PieChart";
import { Edit, Refresh } from "@mui/icons-material";
import { app } from "../../data/firebase";
import EditInvoiceDialog from "../../components/Invoice/EditInvoiceDialog";
import XeroExportResultsDialog from "../../components/Invoice/XeroExportResultsDialog";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ErrorIcon from "@mui/icons-material/Error";
import LockIcon from "@mui/icons-material/Lock";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import Header from "../../components/Global/Header";
import dayjs from "dayjs";
import { toast } from "react-toastify";

const functions = getFunctions(app, "australia-southeast1");
const valueFormatter = (item) =>
  `${Math.round(item.value)}% (${item.count} ${
    item.count === 1 ? "report" : "reports"
  })`;

const InvoicesPage = () => {
  const theme = useTheme();
  const [weekStart, setWeekStart] = useState(getCurrentWeekStart());
  const [weekLessons, setWeekLessons] = useState([]);
  const [existingInvoices, setExistingInvoices] = useState([]);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [statusBreakdown, setStatusBreakdown] = useState([]);
  const [search, setSearch] = useState("");
  const [weekMeta, setWeekMeta] = useState(null);
  const [loading, setLoading] = useState(false);

  const [exporting, setExporting] = useState(false);
  const [exportResults, setExportResults] = useState(null);
  const [showExportResults, setShowExportResults] = useState(false);

  const statusColorMap = {
    Present: theme.palette.success.main,
    Partial: theme.palette.info.main,
    "No Show": theme.palette.warning.main,
    Unreported: theme.palette.error.main,
  };

  const week = getWeekRange(weekStart);

  const today = dayjs().startOf("day");
  const weekEndFriday = week.end.startOf("day");

  const isPastOrCurrentFriday =
    today.isSame(weekEndFriday, "day") || today.isAfter(weekEndFriday, "day");

  const isFutureWeek = today.isBefore(weekEndFriday, "day");

  const alreadyGenerated = weekMeta?.generated === true;

  const hasExportErrors = existingInvoices.some((inv) => inv.xeroExportError);
  const failedInvoices = existingInvoices.filter((inv) => inv.xeroExportError);
  const allExported =
    existingInvoices.length > 0 &&
    existingInvoices.every((inv) => inv.exportedToXero);

  const canGenerate =
    weekLessons.length > 0 &&
    isPastOrCurrentFriday &&
    !alreadyGenerated &&
    !weekMeta?.locked;

  const canExport = alreadyGenerated && !weekMeta?.locked;
  const canRetryExport =
    alreadyGenerated && hasExportErrors && !weekMeta?.locked;

  const load = async () => {
    setLoading(true);
    const lessons = await fetchLessonsForWeek(week.start, week.end);
    setWeekLessons(lessons);
    setStatusBreakdown(getWeeklyReportStatusBreakdown(lessons));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [weekStart]);

  useEffect(() => {
    const loadInvoices = async () => {
      const inv = await fetchInvoicesForWeek(week.start.format("YYYY-MM-DD"));
      setExistingInvoices(inv);
    };
    loadInvoices();
  }, [weekStart]);

  useEffect(() => {
    const loadMeta = async () => {
      const meta = await fetchWeekMeta(week.start);
      setWeekMeta(meta);
    };
    loadMeta();
  }, [weekStart]);

  const generateInvoices = async () => {
    setLoading(true);
    try {
      const generateFn = httpsCallable(functions, "generateWeeklyInvoices");
      await generateFn({
        start: week.start.format("YYYY-MM-DD"),
        end: week.end.format("YYYY-MM-DD"),
      });

      const inv = await fetchInvoicesForWeek(week.start.format("YYYY-MM-DD"));
      setExistingInvoices(inv);

      const meta = await fetchWeekMeta(week.start);
      setWeekMeta(meta);

      toast.success("Invoices generated successfully");
    } catch (error) {
      console.error("Failed to generate invoices:", error);
      toast.error("Failed to generate invoices: " + error.message);
    }
    setLoading(false);
  };

  const handleExportToXero = async (invoiceIds = null) => {
    setExporting(true);
    try {
      const exportFn = httpsCallable(functions, "exportInvoicesToXero");
      const result = await exportFn({
        weekStart: week.start.format("YYYY-MM-DD"),
        invoiceIds: invoiceIds,
      });

      setExportResults(result.data);
      setShowExportResults(true);

      const inv = await fetchInvoicesForWeek(week.start.format("YYYY-MM-DD"));
      setExistingInvoices(inv);

      const meta = await fetchWeekMeta(week.start);
      setWeekMeta(meta);

      if (result.data.allExported) {
        toast.success(
          `Successfully exported ${result.data.exported} invoices to XERO`
        );
      } else {
        toast.warning(
          `Exported ${result.data.exported} invoices, ${result.data.errors} failed`
        );
      }
    } catch (error) {
      console.error("Failed to export invoices:", error);
      toast.error("Failed to export invoices: " + error.message);
    }
    setExporting(false);
  };

  const handleRetryAllFailed = async () => {
    const failedIds = failedInvoices.map((inv) => inv.id);
    await handleExportToXero(failedIds);
  };

  const handleRetryItem = async (item) => {
    await handleExportToXero([item.invoiceId]);
  };

  const filteredStatus = statusBreakdown.filter((item) => item.count > 0);
  const filteredColors = filteredStatus.map((s) => statusColorMap[s.label]);

  const filteredInvoices = existingInvoices.filter((inv) => {
    const term = search.toLowerCase();

    const familyMatch = inv.familyName?.toLowerCase().includes(term);
    const emailMatch = inv.parentEmail?.toLowerCase().includes(term);
    const studentMatch = inv.lineItems?.some((li) =>
      li.studentName?.toLowerCase().includes(term)
    );

    return familyMatch || emailMatch || studentMatch;
  });

  const weekTotals = existingInvoices.reduce(
    (acc, inv) => ({
      subtotal: acc.subtotal + (inv.subtotal || inv.total || 0),
      discount: acc.discount + (inv.totalDiscount || 0),
      credit: acc.credit + (inv.totalCredit || 0),
      total: acc.total + (inv.total || 0),
    }),
    { subtotal: 0, discount: 0, credit: 0, total: 0 }
  );

  const formatLineItem = (item) => {
    const hasDiscount = item.discountAmount > 0;
    const hasCredit = item.creditApplied > 0;
    const baseText = `${item.duration}h x ${item.studentName} with ${
      item.tutorName
    } - (${dayjs(item.date).format("DD/MM/YYYY")}) - ${item.subject}`;

    return {
      baseText,
      hasDiscount,
      hasCredit,
      originalPrice: item.originalPrice || item.price,
      discountAmount: item.discountAmount || 0,
      creditApplied: item.creditApplied || 0,
      finalPrice: item.price,
      discountDescription: item.discountDescription,
      creditDescription: item.creditDescription,
    };
  };

  const getGenerateDisabledReason = () => {
    if (weekMeta?.locked) {
      return "Invoices have been exported to XERO and cannot be regenerated";
    }
    if (alreadyGenerated) {
      return "Invoices have already been generated for this week";
    }
    if (isFutureWeek) {
      return `Invoices can be generated from ${weekEndFriday.format(
        "dddd, MMM D, YYYY"
      )}`;
    }
    if (weekLessons.length === 0) {
      return "No lessons found for this week";
    }
    return "";
  };

  return (
    <Box p={4}>
      <Header title="Invoices" subtitle="Manage lesson invoicing" />

      <Paper sx={{ p: 2, mb: 3, display: "flex", alignItems: "center" }}>
        <IconButton onClick={() => setWeekStart(prevWeek)}>
          <ArrowBackIcon />
        </IconButton>

        <Box flexGrow={1} textAlign="center">
          <Typography variant="h6">
            {week.start.format("MMM D, YYYY")} -{" "}
            {week.end.format("MMM D, YYYY")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Saturday - Friday
          </Typography>
        </Box>

        <Button
          sx={{ mr: 2 }}
          variant="outlined"
          onClick={() => setWeekStart(getCurrentWeekStart())}
        >
          Current Week
        </Button>

        <IconButton onClick={() => setWeekStart(nextWeek)}>
          <ArrowForwardIcon />
        </IconButton>
      </Paper>

      <Paper
        sx={{
          p: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Box>
          {alreadyGenerated && (
            <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 2 }}>
              Invoices generated on{" "}
              {weekMeta?.lastGenerated
                ? dayjs(weekMeta.lastGenerated.toDate()).format(
                    "MMM D, YYYY h:mm A"
                  )
                : "this week"}
            </Alert>
          )}

          {weekMeta?.locked && (
            <Alert severity="info" icon={<LockIcon />} sx={{ mb: 2 }}>
              All invoices have been exported to XERO
            </Alert>
          )}

          {hasExportErrors && !weekMeta?.locked && (
            <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
              {failedInvoices.length} invoice
              {failedInvoices.length > 1 ? "s" : ""} failed to export to XERO.
              Fix the issues and retry.
            </Alert>
          )}

          {isFutureWeek && !alreadyGenerated && !weekMeta?.locked && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Invoices can be generated from{" "}
              {weekEndFriday.format("dddd, MMM D, YYYY")}
            </Alert>
          )}

          {weekLessons.length > 0 &&
            !alreadyGenerated &&
            !weekMeta?.locked &&
            !isFutureWeek && (
              <Tooltip title={canGenerate ? "" : getGenerateDisabledReason()}>
                <span>
                  <Button
                    variant="contained"
                    disabled={!canGenerate || loading}
                    onClick={generateInvoices}
                  >
                    {loading ? (
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                    ) : null}
                    Generate Weekly Invoices
                  </Button>
                </span>
              </Tooltip>
            )}

          {weekLessons.length > 0 &&
            !canGenerate &&
            !alreadyGenerated &&
            !weekMeta?.locked &&
            !isFutureWeek && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {getGenerateDisabledReason()}
              </Typography>
            )}

          <Box mt={2} display="flex" gap={1}>
            {canExport && !allExported && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleExportToXero()}
                disabled={exporting}
                startIcon={exporting ? <CircularProgress size={16} /> : null}
              >
                {exporting ? "Exporting..." : "Export to XERO"}
              </Button>
            )}

            {canRetryExport && (
              <Button
                variant="outlined"
                size="small"
                color="warning"
                onClick={handleRetryAllFailed}
                disabled={exporting}
                startIcon={
                  exporting ? <CircularProgress size={16} /> : <Refresh />
                }
              >
                Retry Failed ({failedInvoices.length})
              </Button>
            )}
          </Box>

          {existingInvoices.length > 0 && (
            <Box mt={3}>
              <Typography variant="subtitle2" color="text.secondary">
                Week Summary
              </Typography>
              <Stack spacing={0.5} mt={1}>
                <Typography variant="body2">
                  Subtotal: ${weekTotals.subtotal.toFixed(2)}
                </Typography>
                {weekTotals.discount > 0 && (
                  <Typography variant="body2" color="success.main">
                    Discounts: -${weekTotals.discount.toFixed(2)}
                  </Typography>
                )}
                {weekTotals.credit > 0 && (
                  <Typography variant="body2" color="primary.main">
                    Credits: -${weekTotals.credit.toFixed(2)}
                  </Typography>
                )}
                <Typography variant="h6" color="primary">
                  Total: ${weekTotals.total.toFixed(2)}
                </Typography>
              </Stack>
            </Box>
          )}
        </Box>

        <Stack direction="row" gap={1} spacing={1} alignItems="center">
          <Box width={400}>
            <PieChart
              series={[
                {
                  innerRadius: 30,
                  paddingAngle: 5,
                  cornerRadius: 4,
                  data: filteredStatus,
                  highlightScope: { fade: "global", highlight: "item" },
                  faded: {
                    innerRadius: 30,
                    additionalRadius: -30,
                    color: "gray",
                  },
                  valueFormatter,
                },
              ]}
              height={200}
              colors={filteredColors}
            />
          </Box>
        </Stack>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : existingInvoices.length > 0 ? (
        <Paper sx={{ p: 2 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h6">
              Invoices ({existingInvoices.length})
            </Typography>
            <TextField
              size="small"
              label="Search invoices"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ width: 250 }}
            />
          </Box>

          {filteredInvoices.map((inv) => (
            <Paper
              key={inv.id}
              sx={{
                p: 2,
                mb: 2,
                border: inv.xeroExportError
                  ? `2px solid ${theme.palette.warning.main}`
                  : inv.exportedToXero
                  ? `1px solid ${theme.palette.success.main}`
                  : "1px solid transparent",
              }}
            >
              <Grid
                container
                justifyContent="space-between"
                alignItems="center"
              >
                <Grid>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="h6">{inv.familyName}</Typography>
                    {inv.exportedToXero && (
                      <Tooltip
                        title={`Exported to XERO (Invoice #${
                          inv.xeroInvoiceNumber || "N/A"
                        })`}
                      >
                        <CheckCircleIcon color="success" fontSize="small" />
                      </Tooltip>
                    )}
                    {inv.xeroExportError && (
                      <Tooltip title={inv.xeroExportError}>
                        <Chip
                          size="small"
                          icon={<ErrorIcon />}
                          label="Export Failed"
                          color="warning"
                          onClick={() => handleExportToXero([inv.id])}
                          sx={{ cursor: "pointer" }}
                        />
                      </Tooltip>
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {inv.parentEmail}
                  </Typography>
                </Grid>

                <Grid display="flex" alignItems="center" gap={1}>
                  <Typography variant="h6" color="primary">
                    ${inv.total?.toFixed(2)}
                  </Typography>

                  <Tooltip
                    sx={{
                      visibility: inv.editedSinceGeneration
                        ? "visible"
                        : "hidden",
                    }}
                    title="This invoice has been modified since generation"
                  >
                    <ErrorIcon color="warning" fontSize="small" />
                  </Tooltip>

                  {weekMeta?.locked ? (
                    <Tooltip title="This invoice cannot be modified as it has been exported to XERO">
                      <LockIcon color="disabled" />
                    </Tooltip>
                  ) : (
                    <IconButton onClick={() => setEditingInvoice(inv)}>
                      <Edit />
                    </IconButton>
                  )}

                  {inv.xeroExportError && !weekMeta?.locked && (
                    <Tooltip title="Retry export for this invoice">
                      <IconButton
                        onClick={() => handleExportToXero([inv.id])}
                        disabled={exporting}
                        size="small"
                        color="warning"
                      >
                        <Refresh />
                      </IconButton>
                    </Tooltip>
                  )}
                </Grid>
              </Grid>

              <Box pt={1}>
                {inv.lineItems.map((item, index) => {
                  const formatted = formatLineItem(item);
                  return (
                    <Box px={2} key={index} py={0.5}>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="flex-start"
                      >
                        <Typography
                          variant="subtitle2"
                          color="text.secondary"
                          sx={{ flex: 1 }}
                        >
                          {formatted.baseText}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1} ml={2}>
                          {(formatted.hasDiscount || formatted.hasCredit) &&
                            formatted.originalPrice !==
                              formatted.finalPrice && (
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  textDecoration: "line-through",
                                  color: "text.disabled",
                                  fontSize: "0.75rem",
                                }}
                              >
                                ${formatted.originalPrice.toFixed(2)}
                              </Typography>
                            )}
                          <Typography
                            variant="subtitle2"
                            color={
                              formatted.hasDiscount || formatted.hasCredit
                                ? "success.main"
                                : "text.secondary"
                            }
                            fontWeight={
                              formatted.hasDiscount || formatted.hasCredit
                                ? "bold"
                                : "normal"
                            }
                          >
                            ${formatted.finalPrice.toFixed(2)}
                          </Typography>
                          {formatted.hasDiscount && (
                            <Tooltip title={formatted.discountDescription}>
                              <Chip
                                size="small"
                                label={`-$${formatted.discountAmount.toFixed(
                                  2
                                )}`}
                                color="success"
                                variant="outlined"
                                sx={{ fontSize: "0.65rem", height: 18 }}
                              />
                            </Tooltip>
                          )}
                          {formatted.hasCredit && (
                            <Tooltip title={formatted.creditDescription}>
                              <Chip
                                size="small"
                                label={`-$${formatted.creditApplied.toFixed(
                                  2
                                )}`}
                                color="primary"
                                variant="outlined"
                                sx={{ fontSize: "0.65rem", height: 18 }}
                              />
                            </Tooltip>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Paper>
          ))}
        </Paper>
      ) : (
        alreadyGenerated === false && (
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <Typography color="text.secondary">
              No invoices generated for this week yet.
            </Typography>
          </Paper>
        )
      )}

      <EditInvoiceDialog
        open={Boolean(editingInvoice)}
        invoice={editingInvoice}
        onClose={() => setEditingInvoice(null)}
        onSave={async (updatedInvoice) => {
          try {
            await updateInvoice(
              week.start.format("YYYY-MM-DD"),
              updatedInvoice.id,
              updatedInvoice
            );
            const inv = await fetchInvoicesForWeek(
              week.start.format("YYYY-MM-DD")
            );
            setExistingInvoices(inv);
          } catch (error) {
            console.error("Failed to save invoice: ", error);
          }

          setEditingInvoice(null);
        }}
      />

      <XeroExportResultsDialog
        open={showExportResults}
        onClose={() => setShowExportResults(false)}
        results={exportResults}
        type="invoices"
        onRetryAll={handleRetryAllFailed}
        onRetryItem={handleRetryItem}
        retrying={exporting}
      />
    </Box>
  );
};

export default InvoicesPage;
