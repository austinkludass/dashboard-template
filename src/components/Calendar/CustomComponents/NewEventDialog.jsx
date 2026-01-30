import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
} from "@mui/material";
import dayjs from "dayjs";
import LessonForm from "../../Lesson/LessonForm";

const NewEventDialog = ({ slot, onClose }) => {
  if (!slot) return null;

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ backgroundColor: "primary.main" }}>
        <Typography variant="h4" component="span" color="white">
          New Lesson
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <LessonForm
            initialValues={{
              date: dayjs(slot.start),
              tutor: null,
              selectedStudents: [],
              subjectGroup: null,
              location: null,
              type: "Normal",
              repeat: false,
              frequency: "weekly",
              notes: "",
              startTime: dayjs(slot.start),
              endTime: dayjs(slot.end),
            }}
            onCreated={() => {
              onClose();
            }}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default NewEventDialog;
