import { useState, useEffect, useMemo, useContext } from "react";
import {
  Box,
  Paper,
  Button,
  Typography,
  Stack,
  IconButton,
  CircularProgress,
  Chip,
  Alert,
  useTheme,
  Tooltip,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  TextField,
} from "@mui/material";
import {
  getWeekRange,
  nextWeek,
  prevWeek,
  getCurrentWeekStart,
  fetchPayrollMeta,
  fetchPayrollItems,
  fetchPendingRequests,
  calculateTutorHoursPreview,
  calculatePayrollTotals,
  calculatePreviewTotals,
  fetchTutors,
} from "../../utils/PayrollUtils";
import { fetchLessonsForWeek } from "../../utils/InvoiceUtils";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../../data/firebase";
import { tokens } from "../../theme";
import { AuthContext } from "../../context/AuthContext";
import XeroExportResultsDialog from "../../components/Invoice/XeroExportResultsDialog";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LockIcon from "@mui/icons-material/Lock";
import PendingIcon from "@mui/icons-material/Pending";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import RefreshIcon from "@mui/icons-material/Refresh";
import Header from "../../components/Global/Header";
import dayjs from "dayjs";
import { toast } from "react-toastify";

const functions = getFunctions(app, "australia-southeast1");

const PayrollPage = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { currentUser } = useContext(AuthContext);

  const [weekStart, setWeekStart] = useState(getCurrentWeekStart());
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [tutors, setTutors] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [payrollMeta, setPayrollMeta] = useState(null);
  const [payrollItems, setPayrollItems] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [expandedTutor, setExpandedTutor] = useState(null);
  const [processingRequest, setProcessingRequest] = useState(null);
  const [search, setSearch] = useState("");

  const [exporting, setExporting] = useState(false);
  const [exportResults, setExportResults] = useState(null);
  const [showExportResults, setShowExportResults] = useState(false);

  const week = getWeekRange(weekStart);
  const isGenerated = payrollMeta?.generated === true;
  const isLocked = payrollMeta?.locked === true;

  const today = dayjs().startOf("day");
  const weekEndFriday = week.end.startOf("day");

  const isPastOrCurrentFriday =
    today.isSame(weekEndFriday, "day") || today.isAfter(weekEndFriday, "day");

  const isFutureWeek = today.isBefore(weekEndFriday, "day");

  const canGenerate =
    lessons.length > 0 && isPastOrCurrentFriday && !isGenerated && !isLocked;

  const hasExportErrors = payrollItems.some((item) => item.xeroExportError);
  const failedPayrollItems = payrollItems.filter(
    (item) => item.xeroExportError
  );
  const allExported =
    payrollItems.length > 0 &&
    payrollItems.every((item) => item.exportedToXero);

  const canExport = isGenerated && !isLocked && pendingRequests.length === 0;
  const canRetryExport = isGenerated && hasExportErrors && !isLocked;

  useEffect(() => {
    const loadTutors = async () => {
      try {
        const tutorData = await fetchTutors();
        setTutors(tutorData);
      } catch (error) {
        toast.error("Failed to fetch tutors: " + error.message);
      }
    };
    loadTutors();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [meta, lessonData, requests] = await Promise.all([
          fetchPayrollMeta(week.start),
          fetchLessonsForWeek(week.start, week.end),
          fetchPendingRequests(week.start),
        ]);

        setPayrollMeta(meta);
        setLessons(lessonData);
        setPendingRequests(requests);

        if (meta?.generated) {
          const items = await fetchPayrollItems(week.start);
          setPayrollItems(items);
        } else {
          setPayrollItems([]);
        }
      } catch (error) {
        toast.error("Failed to fetch data: " + error.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [weekStart]);

  const previewData = useMemo(() => {
    if (isGenerated) return null;
    const tutorHours = calculateTutorHoursPreview(lessons, tutors);
    return Object.values(tutorHours)
      .filter((t) => t.lessonCount > 0)
      .sort((a, b) => b.lessonHours - a.lessonHours);
  }, [lessons, tutors, isGenerated]);

  const totals = useMemo(() => {
    if (isGenerated) {
      return calculatePayrollTotals(payrollItems);
    } else if (previewData) {
      const preview = calculatePreviewTotals(
        Object.fromEntries(previewData.map((t) => [t.tutorId, t]))
      );
      return {
        ...preview,
        additionalHours: 0,
        totalHours: preview.lessonHours,
      };
    }
    return {
      lessonHours: 0,
      additionalHours: 0,
      totalHours: 0,
      lessonCount: 0,
      tutorCount: 0,
    };
  }, [isGenerated, payrollItems, previewData]);

  const displayData = useMemo(() => {
    if (isGenerated) {
      return payrollItems.sort((a, b) => b.totalHours - a.totalHours);
    }
    return previewData || [];
  }, [isGenerated, payrollItems, previewData]);

  const filteredDisplayData = useMemo(() => {
    if (!search) return displayData;

    const term = search.toLowerCase();
    return displayData.filter((tutor) =>
      tutor.tutorName.toLowerCase().includes(term)
    );
  }, [displayData, search]);

  const handleGeneratePayroll = async () => {
    setGenerating(true);
    try {
      const generateFn = httpsCallable(functions, "generateWeeklyPayroll");
      await generateFn({
        weekStart: week.start.format("YYYY-MM-DD"),
        weekEnd: week.end.format("YYYY-MM-DD"),
      });

      const [meta, items, requests] = await Promise.all([
        fetchPayrollMeta(week.start),
        fetchPayrollItems(week.start),
        fetchPendingRequests(week.start),
      ]);
      setPayrollMeta(meta);
      setPayrollItems(items);
      setPendingRequests(requests);

      toast.success("Payroll generated successfully");
    } catch (error) {
      toast.error("Failed to generate payroll: " + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleExportToXero = async (tutorIds = null) => {
    if (pendingRequests.length > 0 && !tutorIds) {
      toast.error(
        "Cannot export payroll while there are pending additional hours requests"
      );
      return;
    }

    setExporting(true);
    try {
      const exportFn = httpsCallable(functions, "exportPayrollToXero");
      const result = await exportFn({
        weekStart: week.start.format("YYYY-MM-DD"),
        tutorIds: tutorIds,
      });

      setExportResults(result.data);
      setShowExportResults(true);

      const [meta, items] = await Promise.all([
        fetchPayrollMeta(week.start),
        fetchPayrollItems(week.start),
      ]);
      setPayrollMeta(meta);
      setPayrollItems(items);

      if (result.data.allExported) {
        toast.success(
          `Successfully exported ${result.data.exported} timesheets to XERO`
        );
      } else {
        toast.warning(
          `Exported ${result.data.exported} timesheets, ${result.data.errors} failed`
        );
      }
    } catch (error) {
      toast.error("Failed to export payroll: " + error.message);
    } finally {
      setExporting(false);
    }
  };

  const handleRetryAllFailed = async () => {
    const failedIds = failedPayrollItems.map((item) => item.id);
    await handleExportToXero(failedIds);
  };

  const handleRetryItem = async (item) => {
    await handleExportToXero([item.tutorId]);
  };

  const handleApproveRequest = async (requestId, approved) => {
    setProcessingRequest(requestId);
    try {
      const approveFn = httpsCallable(functions, "approveAdditionalHours");
      await approveFn({
        requestId,
        approved,
        reviewedBy: currentUser?.uid,
      });

      const [items, requests] = await Promise.all([
        fetchPayrollItems(week.start),
        fetchPendingRequests(week.start),
      ]);
      setPayrollItems(items);
      setPendingRequests(requests);

      toast.success(`Request ${approved ? "approved" : "declined"}`);
    } catch (error) {
      toast.error("Failed to process request: " + error.message);
    } finally {
      setProcessingRequest(null);
    }
  };

  const toggleExpand = (tutorId) => {
    setExpandedTutor(expandedTutor === tutorId ? null : tutorId);
  };

  const formatHours = (hours) => {
    if (!hours || hours === 0) return "0h";
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    if (minutes === 0) return `${wholeHours}h`;
    return `${wholeHours}h ${minutes}m`;
  };

  const getGenerateDisabledReason = () => {
    if (isLocked) {
      return "Payroll has been exported to XERO and cannot be regenerated";
    }
    if (isGenerated) {
      return "Payroll has already been generated for this week";
    }
    if (isFutureWeek) {
      return `Payroll can be generated from ${weekEndFriday.format(
        "dddd, MMM D, YYYY"
      )}`;
    }
    if (lessons.length === 0) {
      return "No lessons found for this week";
    }
    return "";
  };

  return (
    <Box p={4}>
      <Header title="Payroll" subtitle="Generate and manage tutor payroll" />

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

      {isGenerated && (
        <Alert
          severity={isLocked ? "info" : "success"}
          icon={isLocked ? <LockIcon /> : undefined}
          sx={{ mb: 3 }}
        >
          {isLocked
            ? "Payroll has been locked and exported to XERO"
            : `Payroll generated on ${dayjs(
                payrollMeta?.lastGenerated?.toDate()
              ).format("MMM D, YYYY h:mm A")}`}
        </Alert>
      )}

      {hasExportErrors && !isLocked && (
        <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3 }}>
          {failedPayrollItems.length} timesheet
          {failedPayrollItems.length > 1 ? "s" : ""} failed to export to XERO.
          Fix the issues and retry.
        </Alert>
      )}

      {isFutureWeek && !isGenerated && !isLocked && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Payroll can be generated from{" "}
          {weekEndFriday.format("dddd, MMM D, YYYY")}
        </Alert>
      )}

      <Box
        display="grid"
        gridTemplateColumns="repeat(auto-fit, minmax(180px, 1fr))"
        gap={2}
        mb={3}
      >
        <Paper sx={{ p: 2, textAlign: "center" }}>
          <Typography variant="h4" color={colors.orangeAccent[400]}>
            {formatHours(totals.lessonHours)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Lesson Hours
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, textAlign: "center" }}>
          <Typography variant="h4" color={colors.orangeAccent[400]}>
            {formatHours(totals.additionalHours)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Additional Hours
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, textAlign: "center" }}>
          <Typography variant="h4" color={colors.orangeAccent[400]}>
            {formatHours(totals.totalHours)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total Hours
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, textAlign: "center" }}>
          <Typography variant="h4" color={colors.orangeAccent[400]}>
            {totals.lessonCount}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total Lessons
          </Typography>
        </Paper>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            {!isGenerated && !isFutureWeek ? (
              <Tooltip title={canGenerate ? "" : getGenerateDisabledReason()}>
                <span>
                  <Button
                    variant="contained"
                    onClick={handleGeneratePayroll}
                    disabled={!canGenerate || generating}
                  >
                    {generating ? (
                      <CircularProgress size={24} sx={{ mr: 1 }} />
                    ) : null}
                    Generate Weekly Payroll
                  </Button>
                </span>
              </Tooltip>
            ) : isGenerated && !isLocked ? (
              <Box display="flex" gap={1}>
                {!allExported && (
                  <Button
                    variant="outlined"
                    onClick={() => handleExportToXero()}
                    disabled={exporting || pendingRequests.length > 0}
                    startIcon={
                      exporting ? <CircularProgress size={20} /> : <LockIcon />
                    }
                  >
                    {exporting ? "Exporting..." : "Export to XERO"}
                  </Button>
                )}

                {canRetryExport && (
                  <Button
                    variant="outlined"
                    color="warning"
                    onClick={handleRetryAllFailed}
                    disabled={exporting}
                    startIcon={
                      exporting ? (
                        <CircularProgress size={20} />
                      ) : (
                        <RefreshIcon />
                      )
                    }
                  >
                    Retry Failed ({failedPayrollItems.length})
                  </Button>
                )}
              </Box>
            ) : null}

            {!isGenerated && !isFutureWeek && !canGenerate && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {getGenerateDisabledReason()}
              </Typography>
            )}
          </Box>

          {pendingRequests.length > 0 && (
            <Chip
              icon={<PendingIcon />}
              label={`${pendingRequests.length} pending request${
                pendingRequests.length > 1 ? "s" : ""
              }`}
              color="warning"
            />
          )}
        </Box>
      </Paper>

      {!isLocked && pendingRequests.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography
            variant="h6"
            color={colors.orangeAccent[400]}
            gutterBottom
          >
            Pending Additional Hours Requests
          </Typography>

          {!isGenerated && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Generate the weekly payroll to approve or decline these requests.
            </Alert>
          )}

          <Stack spacing={1}>
            {pendingRequests.map((request) => (
              <Paper
                key={request.id}
                sx={{
                  p: 2,
                  bgcolor: "background.default",
                }}
              >
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {request.tutorName} - {request.hours}h
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {request.description}
                    </Typography>
                    {request.notes && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontStyle: "italic" }}
                      >
                        {request.notes}
                      </Typography>
                    )}
                  </Box>
                  <Box display="flex" gap={1}>
                    {isGenerated && (
                      <>
                        <Tooltip title="Approve">
                          <IconButton
                            color="success"
                            onClick={() =>
                              handleApproveRequest(request.id, true)
                            }
                            disabled={processingRequest === request.id}
                          >
                            {processingRequest === request.id ? (
                              <CircularProgress size={24} />
                            ) : (
                              <CheckIcon />
                            )}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Decline">
                          <IconButton
                            color="error"
                            onClick={() =>
                              handleApproveRequest(request.id, false)
                            }
                            disabled={processingRequest === request.id}
                          >
                            <CloseIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </Box>
                </Box>
              </Paper>
            ))}
          </Stack>
        </Paper>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : displayData.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" color="text.secondary">
            {isGenerated
              ? "No payroll data for this week"
              : "No lessons scheduled for this week"}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            {isGenerated
              ? "Generate payroll to see tutor hours"
              : "Tutor hours will appear here when lessons are scheduled"}
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            px={4}
            pt={2}
          >
            <Typography variant="h6">Tutors ({displayData.length})</Typography>
            <TextField
              size="small"
              label="Search tutors"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ width: 250 }}
            />
          </Box>
          {filteredDisplayData.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="h6" color="text.secondary">
                No tutors match your search
              </Typography>
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width={50} />
                  <TableCell>Tutor</TableCell>
                  <TableCell align="center">Lessons</TableCell>
                  <TableCell align="center">Lesson Hours</TableCell>
                  {isGenerated && (
                    <TableCell align="center">Additional Hours</TableCell>
                  )}
                  <TableCell align="center">
                    {isGenerated ? "Total Hours" : "Hours"}
                  </TableCell>
                  {isGenerated && (
                    <TableCell align="center">XERO Status</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDisplayData.map((tutor) => (
                  <>
                    <TableRow
                      key={tutor.tutorId || tutor.id}
                      hover
                      sx={{
                        cursor: "pointer",
                        borderLeft: tutor.xeroExportError
                          ? `4px solid ${theme.palette.warning.main}`
                          : tutor.exportedToXero
                          ? `4px solid ${theme.palette.success.main}`
                          : "4px solid transparent",
                      }}
                      onClick={() => toggleExpand(tutor.tutorId || tutor.id)}
                    >
                      <TableCell>
                        <IconButton size="small">
                          {expandedTutor === (tutor.tutorId || tutor.id) ? (
                            <ExpandLessIcon />
                          ) : (
                            <ExpandMoreIcon />
                          )}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar
                            src={tutor.avatar}
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor:
                                tutor.tutorColor || colors.orangeAccent[400],
                            }}
                          >
                            {tutor.tutorName?.charAt(0)}
                          </Avatar>
                          <Typography>{tutor.tutorName}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">{tutor.lessonCount}</TableCell>
                      <TableCell align="center">
                        {formatHours(tutor.lessonHours)}
                      </TableCell>
                      {isGenerated && (
                        <TableCell align="center">
                          {formatHours(tutor.additionalHours || 0)}
                        </TableCell>
                      )}
                      <TableCell align="center">
                        <Typography fontWeight="bold">
                          {formatHours(tutor.totalHours || tutor.lessonHours)}
                        </Typography>
                      </TableCell>
                      {isGenerated && (
                        <TableCell align="center">
                          {tutor.exportedToXero ? (
                            <Tooltip title="Exported to XERO">
                              <CheckCircleIcon color="success" />
                            </Tooltip>
                          ) : tutor.xeroExportError ? (
                            <Tooltip title={tutor.xeroExportError}>
                              <Chip
                                size="small"
                                icon={<ErrorIcon />}
                                label="Failed"
                                color="warning"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleExportToXero([tutor.id]);
                                }}
                                sx={{ cursor: "pointer" }}
                              />
                            </Tooltip>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Pending
                            </Typography>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                    <TableRow>
                      <TableCell
                        colSpan={isGenerated ? 7 : 5}
                        sx={{ p: 0, border: 0 }}
                      >
                        <Collapse
                          in={expandedTutor === (tutor.tutorId || tutor.id)}
                          timeout="auto"
                          unmountOnExit
                        >
                          <Box sx={{ p: 2, bgcolor: "background.default" }}>
                            <Typography
                              variant="subtitle2"
                              color={colors.orangeAccent[400]}
                              gutterBottom
                            >
                              Lessons
                            </Typography>
                            {tutor.lessons?.length > 0 ? (
                              <Stack spacing={1}>
                                {tutor.lessons.map((lesson, idx) => (
                                  <Box
                                    key={idx}
                                    display="flex"
                                    justifyContent="space-between"
                                    alignItems="center"
                                  >
                                    <Typography variant="body2">
                                      {lesson.subjectGroupName ||
                                        lesson.subject}{" "}
                                      -{" "}
                                      {lesson.studentNames?.join(", ") ||
                                        lesson.studentName}
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      {dayjs(
                                        lesson.startDateTime || lesson.date
                                      ).format("ddd DD/MM")}{" "}
                                      • {formatHours(lesson.duration)}
                                    </Typography>
                                  </Box>
                                ))}
                              </Stack>
                            ) : (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                No lesson details available
                              </Typography>
                            )}

                            {isGenerated &&
                              tutor.additionalHoursDetails?.length > 0 && (
                                <>
                                  <Typography
                                    variant="subtitle2"
                                    color={colors.orangeAccent[400]}
                                    gutterBottom
                                    sx={{ mt: 2 }}
                                  >
                                    Additional Hours
                                  </Typography>
                                  <Stack spacing={1}>
                                    {tutor.additionalHoursDetails.map(
                                      (detail, idx) => (
                                        <Box
                                          key={idx}
                                          display="flex"
                                          justifyContent="space-between"
                                          alignItems="center"
                                        >
                                          <Typography variant="body2">
                                            {detail.description}
                                          </Typography>
                                          <Typography
                                            variant="body2"
                                            color="text.secondary"
                                          >
                                            {formatHours(detail.hours)}
                                          </Typography>
                                        </Box>
                                      )
                                    )}
                                  </Stack>
                                </>
                              )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </>
                ))}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      )}

      <XeroExportResultsDialog
        open={showExportResults}
        onClose={() => setShowExportResults(false)}
        results={exportResults}
        type="payroll"
        onRetryAll={handleRetryAllFailed}
        onRetryItem={handleRetryItem}
        retrying={exporting}
      />
    </Box>
  );
};

export default PayrollPage;
