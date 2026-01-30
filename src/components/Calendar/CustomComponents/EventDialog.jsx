import { useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import {
  Delete,
  Edit,
  CalendarMonthOutlined,
  SchoolOutlined,
  GroupsOutlined,
  LocationOnOutlined,
  SpeakerNotesOutlined,
  RepeatOutlined,
  ArrowBack,
} from "@mui/icons-material";
import { TypeColors } from "../../../utils/lessonTypeColors";
import { toast } from "react-toastify";
import ConfirmEventDialog from "./ConfirmEventDialog";
import LessonForm from "../../Lesson/LessonForm";
import CustomRating from "../../Global/Rating";

const StyledIconBox = ({ children }) => (
  <Box
    sx={{
      padding: "4px",
      backgroundColor: "primary.highlight",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "primary.main",
    }}
  >
    {children}
  </Box>
);

const EventDialog = ({
  event,
  onClose,
  onDelete,
  mode: initialMode = "view",
  reportStudent: initialReportStudent = null,
  onReportEdit,
}) => {
  const [mode, setMode] = useState(initialMode);
  const [reportStudent, setReportStudent] = useState(initialReportStudent);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [reports, setReports] = useState(event?.reports || []);

  if (!event) return null;

  const handleBack = () => {
    setReportStudent(null);
    setMode("view");
  };

  const handleEdit = () => setMode("edit");

  const handleSubmit = () => {
    if (event.frequency) {
      setDeleteConfirmOpen(true);
    } else {
      handleDelete(false);
    }
  };

  const handleDelete = async (applyToFuture = false) => {
    onDelete?.(event, applyToFuture);
  };

  const handleSaveReport = (studentId) => {
    try {
      const updatedReports = reports.map((r) =>
        r.studentId === studentId ? reportStudent : r
      );
      setReports(updatedReports);
      onReportEdit?.(event.id, updatedReports, event);

      setMode("view");
      setReportStudent(null);
    } catch (error) {
      toast.error("Error saving report: " + error.message);
    }
  };

  return (
    <>
      <Dialog open={!!event} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: event.tutorColor || "primary.main",
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            {(mode === "edit" || mode === "report") && (
              <IconButton sx={{ color: "white" }} onClick={handleBack}>
                <ArrowBack />
              </IconButton>
            )}
            <Typography variant="h4" color="white">
              {mode === "edit"
                ? "Edit Lesson"
                : mode === "report"
                ? `Report ${reportStudent?.studentName}`
                : event.subjectGroupName || "Lesson Details"}
            </Typography>
          </Box>

          {mode === "view" && (
            <Box>
              <IconButton sx={{ color: "white" }} onClick={handleEdit}>
                <Edit />
              </IconButton>
              <IconButton sx={{ color: "white" }} onClick={handleSubmit}>
                <Delete />
              </IconButton>
            </Box>
          )}
        </DialogTitle>

        <DialogContent dividers>
          {mode === "view" && (
            <Stack spacing={2}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <StyledIconBox>
                    <CalendarMonthOutlined fontSize="large" />
                  </StyledIconBox>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      {dayjs(event.start).format("dddd, MMMM D, YYYY")}
                    </Typography>
                    <Typography variant="body2">
                      {dayjs(event.start).format("h:mm A")} -{" "}
                      {dayjs(event.end).format("h:mm A")}
                    </Typography>
                  </Box>
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                  <Chip
                    label={event.type}
                    color={TypeColors[event.type] || "success"}
                  />
                  {event.frequency && (
                    <Tooltip title={`Repeats ${event.frequency ?? ""}`}>
                      <RepeatOutlined />
                    </Tooltip>
                  )}
                </Box>
              </Box>

              <Divider />

              <Box display="flex" alignItems="center" gap={1}>
                <StyledIconBox>
                  <SchoolOutlined fontSize="large" />
                </StyledIconBox>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Tutor
                  </Typography>
                  <Chip
                    label={event.tutorName}
                    sx={{
                      backgroundColor: event.tutorColor,
                      color: "white",
                    }}
                  />
                </Box>
              </Box>

              <Box display="flex" alignItems="center" gap={1}>
                <StyledIconBox>
                  <GroupsOutlined fontSize="large" />
                </StyledIconBox>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Students
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {reports?.map((report) => (
                      <Chip
                        key={report.studentId}
                        label={report.studentName}
                        sx={{ cursor: "pointer" }}
                        onClick={() => {
                          setReportStudent(report);
                          setMode("report");
                        }}
                        color={
                          report.status
                            ? report.status === "cancelled"
                              ? "error"
                              : "success"
                            : "default"
                        }
                      />
                    ))}
                  </Stack>
                </Box>
              </Box>

              <Box display="flex" alignItems="center" gap={1}>
                <StyledIconBox>
                  <LocationOnOutlined fontSize="large" />
                </StyledIconBox>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Location
                  </Typography>
                  <Typography>{event.locationName}</Typography>
                </Box>
              </Box>

              <Box display="flex" alignItems="flex-start" gap={1} pt={1}>
                <StyledIconBox>
                  <SpeakerNotesOutlined fontSize="large" />
                </StyledIconBox>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Notes
                  </Typography>
                  <TextField
                    multiline
                    rows={4}
                    value={event.notes}
                    slotProps={{
                      input: {
                        readOnly: true,
                        sx: {
                          borderRadius: "8px",
                          padding: "10px",
                          overflowY: "auto",
                        },
                      },
                    }}
                    variant="outlined"
                    sx={{
                      width: "100%",
                    }}
                  />
                </Box>
              </Box>
            </Stack>
          )}

          {mode === "edit" && (
            <LessonForm
              initialValues={{
                date: dayjs(event.start),
                tutor: event.tutorId,
                selectedStudents: event.studentIds ?? [],
                subjectGroup: event.subjectGroupId,
                location: event.locationId,
                type: event.type ?? "Normal",
                frequency: event.frequency,
                notes: event.notes ?? "",
                startTime: dayjs(event.start),
                endTime: dayjs(event.end),
                repeatingId: event.repeatingId,
                startDateTime: event.startDateTime,
                endDateTime: event.endDateTime,
                id: event.id,
              }}
              edit
              onUpdated={() => {
                onClose();
              }}
            />
          )}

          {mode === "report" && reportStudent && (
            <Box>
              <TextField
                fullWidth
                select
                label="Status"
                value={reportStudent.status || ""}
                onChange={(e) =>
                  setReportStudent({
                    ...reportStudent,
                    status: e.target.value,
                  })
                }
                sx={{ mt: 2 }}
              >
                <MenuItem value="present">Present</MenuItem>
                <MenuItem value="partial">Partial</MenuItem>
                <MenuItem value="noShow">No Show</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </TextField>

              <TextField
                fullWidth
                label="Topic"
                value={reportStudent.topic || ""}
                onChange={(e) =>
                  setReportStudent({
                    ...reportStudent,
                    topic: e.target.value,
                  })
                }
                sx={{ mt: 2 }}
              />

              <Typography variant="h6" sx={{ mt: 2 }}>
                Effort
              </Typography>
              <CustomRating
                name="effort-er"
                value={reportStudent.effort}
                onChange={(value) =>
                  setReportStudent({ ...reportStudent, effort: value })
                }
              />

              <Typography variant="h6" sx={{ mt: 2 }}>
                Quality
              </Typography>
              <CustomRating
                name="quality-rating"
                value={reportStudent.quality}
                onChange={(value) =>
                  setReportStudent({ ...reportStudent, quality: value })
                }
              />

              <Typography variant="h6" sx={{ mt: 2 }}>
                Satisfaction
              </Typography>
              <CustomRating
                name="satisfaction-rating"
                value={reportStudent.satisfaction}
                onChange={(value) =>
                  setReportStudent({ ...reportStudent, satisfaction: value })
                }
              />

              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Notes"
                value={reportStudent.notes || ""}
                onChange={(e) =>
                  setReportStudent({ ...reportStudent, notes: e.target.value })
                }
                sx={{ mt: 2 }}
              />

              <Box display="flex" justifyContent="flex-start" gap={2} mt={2}>
                <Button
                  variant="contained"
                  onClick={() => handleSaveReport(reportStudent.studentId)}
                >
                  Save
                </Button>
                <Button variant="outlined" onClick={handleBack}>
                  Cancel
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>

        <Box display="flex" justifyContent="flex-end" p={2}>
          <Button variant="outlined" onClick={onClose}>
            Close
          </Button>
        </Box>
      </Dialog>

      <ConfirmEventDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirmOnly={() => handleDelete(false)}
        onConfirmFuture={() => handleDelete(true)}
        title="Delete lesson(s)..."
        onlyLabel="Only this lesson"
        futureLabel="This and future lessons"
      />
    </>
  );
};

export default EventDialog;
