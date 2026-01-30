import { useState, useEffect, useContext } from "react";
import {
  Box,
  Paper,
  Button,
  Typography,
  TextField,
  CircularProgress,
  Stack,
  Chip,
  Alert,
  useTheme,
} from "@mui/material";
import {
  getWeekRange,
  getCurrentWeekStart,
  getWeekKey,
  submitAdditionalHoursRequest,
  fetchTutorRequests,
} from "../../utils/PayrollUtils";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../data/firebase";
import { AuthContext } from "../../context/AuthContext";
import { tokens } from "../../theme";
import { toast, ToastContainer } from "react-toastify";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import PendingIcon from "@mui/icons-material/Pending";
import Header from "../../components/Global/Header";
import dayjs from "dayjs";
import "react-toastify/dist/ReactToastify.css";

const AdditionalHoursPage = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { currentUser } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState([]);
  const [tutorData, setTutorData] = useState(null);
  const [payrollMeta, setPayrollMeta] = useState(null);
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState({});

  const currentWeekStart = getCurrentWeekStart();
  const week = getWeekRange(currentWeekStart);

  const isPayrollLocked = payrollMeta?.locked === true;

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser?.uid) return;

      setLoading(true);
      try {
        const tutorDoc = await getDoc(doc(db, "tutors", currentUser.uid));
        if (tutorDoc.exists()) {
          const data = tutorDoc.data();
          setTutorData({
            id: tutorDoc.id,
            firstName: data.firstName,
            lastName: data.lastName,
            fullName: `${data.firstName} ${data.lastName}`,
          });
        }

        const payrollDoc = await getDoc(
          doc(db, "payroll", getWeekKey(currentWeekStart))
        );
        if (payrollDoc.exists()) {
          setPayrollMeta(payrollDoc.data());
        }

        const tutorRequests = await fetchTutorRequests(currentUser.uid);
        setRequests(tutorRequests);
      } catch (error) {
        toast.error("Failed to load data: " + error.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [currentUser]);

  const validate = () => {
    const newErrors = {};
    if (!hours || isNaN(parseFloat(hours)) || parseFloat(hours) <= 0) {
      newErrors.hours = "Please enter valid hours (greater than 0)";
    }
    if (!description.trim()) {
      newErrors.description = "Please enter a description of the work done";
    }
    if (!notes.trim()) {
      newErrors.notes = "Please provide a reason for this request";
    }
    return newErrors;
  };

  const handleSubmit = async () => {
    const newErrors = validate();
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    if (!tutorData) {
      toast.error("Unable to find your tutor profile");
      return;
    }

    setSubmitting(true);
    try {
      await submitAdditionalHoursRequest({
        tutorId: currentUser.uid,
        tutorName: tutorData.fullName,
        weekStart: getWeekKey(currentWeekStart),
        hours: parseFloat(hours),
        description: description.trim(),
        notes: notes.trim(),
      });

      const tutorRequests = await fetchTutorRequests(currentUser.uid);
      setRequests(tutorRequests);

      setHours("");
      setDescription("");
      setNotes("");
      setErrors({});

      toast.success("Request submitted successfully");
    } catch (error) {
      toast.error("Failed to submit request: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case "approved":
        return (
          <Chip
            icon={<CheckCircleIcon />}
            label="Approved"
            color="success"
            size="small"
          />
        );
      case "declined":
        return (
          <Chip
            icon={<CancelIcon />}
            label="Declined"
            color="error"
            size="small"
          />
        );
      case "pending":
      default:
        return (
          <Chip
            icon={<PendingIcon />}
            label="Pending"
            color="warning"
            size="small"
          />
        );
    }
  };

  const formatHours = (hours) => {
    if (!hours || hours === 0) return "0h";
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    if (minutes === 0) return `${wholeHours}h`;
    return `${wholeHours}h ${minutes}m`;
  };

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

  return (
    <Box p={4}>
      <Header
        title="Additional Hours"
        subtitle="Request payment for work done outside of lessons"
      />

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Current Week
        </Typography>
        <Typography variant="body1">
          {week.start.format("MMM D, YYYY")} - {week.end.format("MMM D, YYYY")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Saturday - Friday
        </Typography>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" color={colors.orangeAccent[400]} gutterBottom>
          Submit Additional Hours Request
        </Typography>

        {isPayrollLocked ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Payroll for this week has already been locked and exported. You
            cannot submit additional hours requests for this week.
          </Alert>
        ) : (
          <Alert severity="info" sx={{ mb: 2 }}>
            Submit your additional hours request for this week. Your request
            will be reviewed by an administrator when payroll is processed.
          </Alert>
        )}

        <Stack spacing={3}>
          <TextField
            label="Hours Worked"
            type="number"
            value={hours}
            onChange={(e) => {
              setHours(e.target.value);
              if (errors.hours) {
                setErrors((prev) => ({ ...prev, hours: undefined }));
              }
            }}
            error={Boolean(errors.hours)}
            helperText={errors.hours}
            inputProps={{ min: 0, step: 0.5 }}
            fullWidth
            disabled={isPayrollLocked}
          />

          <TextField
            label="Description"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (errors.description) {
                setErrors((prev) => ({ ...prev, description: undefined }));
              }
            }}
            error={Boolean(errors.description)}
            helperText={
              errors.description ||
              "Describe the work you did (e.g., Staff meeting, Training session, Admin work)"
            }
            fullWidth
            disabled={isPayrollLocked}
          />

          <TextField
            label="Reason for Request"
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              if (errors.notes) {
                setErrors((prev) => ({ ...prev, notes: undefined }));
              }
            }}
            error={Boolean(errors.notes)}
            helperText={
              errors.notes ||
              "Explain why you are requesting these additional hours"
            }
            multiline
            rows={3}
            fullWidth
            disabled={isPayrollLocked}
          />

          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting || isPayrollLocked}
            sx={{ alignSelf: "flex-start" }}
          >
            {submitting ? <CircularProgress size={24} sx={{ mr: 1 }} /> : null}
            Submit Request
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" color={colors.orangeAccent[400]} gutterBottom>
          Your Request History
        </Typography>

        {requests.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            You haven't submitted any additional hours requests yet.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {requests.map((request) => (
              <Paper key={request.id} variant="outlined" sx={{ p: 2 }}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="flex-start"
                >
                  <Box flex={1}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Typography variant="subtitle2">
                        Week of {dayjs(request.weekStart).format("MMM D, YYYY")}
                      </Typography>
                      {getStatusChip(request.status)}
                    </Box>
                    <Typography variant="body2">
                      {request.description}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontStyle="italic"
                    >
                      Reason: {request.notes}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Submitted:{" "}
                      {dayjs(request.createdAt).format("MMM D, YYYY h:mm A")}
                    </Typography>
                    {request.reviewedAt && (
                      <Typography variant="body2" color="text.secondary">
                        Reviewed:{" "}
                        {dayjs(request.reviewedAt.toDate()).format(
                          "MMM D, YYYY h:mm A"
                        )}
                      </Typography>
                    )}
                  </Box>
                  <Chip
                    icon={<AccessTimeIcon />}
                    label={formatHours(request.hours)}
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>

      <ToastContainer position="top-right" autoClose={3000} />
    </Box>
  );
};

export default AdditionalHoursPage;
