import {
  Paper,
  Stack,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";

const FamilySchedulingPreference = ({ formData, setFormData }) => {
  const handleChange = (event) => {
    setFormData({ ...formData, schedulePreference: event.target.value });
  };

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={1}>
        <Typography variant="h5" fontWeight="bold">
          Family Scheduling Preference
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ fontSize: "0.97rem" }}
        >
          At Wise Minds, we can do our best to schedule multiple students in the
          one time slot. This means you only need to make the one trip in. Note:
          This is quite a logistical challenge and we do our absolute best, but
          we cannot guarentee this will be possible.
        </Typography>
        <RadioGroup
          name="schedulePreference"
          value={formData.schedulePreference || ""}
          onChange={handleChange}
        >
          <Stack spacing={0.5}>
            <FormControlLabel
              value="same_time_within_hour"
              control={<Radio />}
              label="Prefer same-time scheduling"
            />
            <Typography variant="body1" color="text.secondary">
              Schedule siblings as close together as possible (overlapping so siblings aren't waiting) when possible (difficult for us to achieve)
            </Typography>
          </Stack>
          <Stack spacing={0.5}>
            <FormControlLabel
              value="same_day"
              control={<Radio />}
              label="Prefer same day scheduling"
            />
            <Typography variant="body1" color="text.secondary">
              Schedule all siblings on the same day when possible
            </Typography>
          </Stack>
          <Stack spacing={0.5}>
            <FormControlLabel
              value="back_to_back"
              control={<Radio />}
              label="Prefer back-to-back scheduling"
            />
            <Typography variant="body1" color="text.secondary">
              Schedule siblings in consecutive lessons (to make pickup/dropoff easier) when possible
            </Typography>
          </Stack>
          <Stack spacing={0.5}>
            <FormControlLabel
              value="no_preference"
              control={<Radio />}
              label="No preference"
            />
            <Typography variant="body1" color="text.secondary">
              We will schedule your students based on the best student-tutor
              match available within the time you provided.
            </Typography>
          </Stack>
        </RadioGroup>
      </Stack>
    </Paper>
  );
};

export default FamilySchedulingPreference;
