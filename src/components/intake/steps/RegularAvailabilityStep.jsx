import { Stack, Typography } from "@mui/material";
import StudentAvailabilityInfo from "../../student/StudentAvailabilityInfo";
import {
  DEFAULT_AVAILABILITY_THRESHOLD,
  getAvailabilityHours,
} from "../../../scenes/Intake/intakeUtils";

const formatHoursLabel = (hours) => {
  if (!Number.isFinite(hours)) return "0";
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
};

const RegularAvailabilityStep = ({
  availability,
  setAvailability,
  requestedTutoringHours = 0,
  availabilityThreshold = DEFAULT_AVAILABILITY_THRESHOLD,
}) => {
  const availabilityHours = getAvailabilityHours(availability);
  const totalLabel = `${formatHoursLabel(availabilityHours)} hours/week`;
  const showLowAvailabilityWarning =
    requestedTutoringHours > 0 &&
    availabilityHours < availabilityThreshold &&
    availabilityHours < requestedTutoringHours;

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight="bold">
        Regular Availability
      </Typography>
      <Typography variant="body2" color="text.secondary">
        The regular availability is the times that your child is available on a
        weekly basis for tutoring. This will influence our tutor selection. The
        more availability you have, the better chance we find the best possible
        tutor!
      </Typography>
      <StudentAvailabilityInfo
        isEdit={true}
        availability={availability}
        setAvailability={setAvailability}
        showHalfHourWarning={true}
      />
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        alignItems={{ xs: "flex-start", sm: "center" }}
      >
        <Typography variant="subtitle1" fontWeight="bold">
          Total availability: {totalLabel}
        </Typography>
        {showLowAvailabilityWarning && (
          <Typography variant="body2" color="warning.main">
            You've only stated {totalLabel} of availability. This may make it
            tricky for us to allocate your child. Please consider adding more
            availability if you have capacity to do so.
          </Typography>
        )}
      </Stack>
    </Stack>
  );
};

export default RegularAvailabilityStep;
