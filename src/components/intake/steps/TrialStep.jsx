import { Stack, Typography, TextField } from "@mui/material";
import StudentTrialInfo from "../../student/StudentTrialInfo";

const TrialStep = ({
  formData,
  setFormData,
  trialAvailability,
  setTrialAvailability,
}) => {
  const handleNotesChange = (event) => {
    setFormData({ ...formData, trialNotes: event.target.value });
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h5" fontWeight="bold">
        Trial Session
      </Typography>
      <Typography variant="body2" color="text.secondary">
        The trial session at Wise Minds runs for 45 minutes followed by 10
        minutes of direct conversation with you regarding how the session went.
        This session gives your child one-on-one time with the tutor we think
        would be best. This session is usually completed as a{" "}
        <strong>one-off session</strong> before organising regular, weekly
        sessions (as such, availability may be different).
      </Typography>
      <StudentTrialInfo
        formData={formData}
        setFormData={setFormData}
        isEdit={true}
        trialAvailability={trialAvailability}
        setTrialAvailability={setTrialAvailability}
      />
      <TextField
        label="Trial session notes (optional)"
        multiline
        minRows={3}
        value={formData.trialNotes}
        onChange={handleNotesChange}
      />
    </Stack>
  );
};

export default TrialStep;
