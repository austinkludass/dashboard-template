import { Stack } from "@mui/material";
import AvailabilitySelector from "../Tutor/AvailabilitySelector";
import studentAvailabilityBounds from "./studentAvailabilityBounds";

const StudentAvailabilityInfo = ({
  isEdit,
  availability,
  setAvailability,
  showHalfHourWarning = false,
}) => {
  const handleAvailabilityChange = (updatedAvailability) => {
    setAvailability(updatedAvailability);
  };

  return (
    <Stack spacing={2}>
      {isEdit ? (
        <>
          <AvailabilitySelector
            onAvailabilityChange={handleAvailabilityChange}
            initialAvailability={availability}
            isEdit={true}
            dayTimeBounds={studentAvailabilityBounds}
            showHalfHourWarning={showHalfHourWarning}
          />
        </>
      ) : (
        <>
          <div style={{ display: "flex", gap: "10px" }}>
            <AvailabilitySelector
              onAvailabilityChange={() => {}}
              initialAvailability={availability}
              isEdit={false}
              dayTimeBounds={studentAvailabilityBounds}
              showHalfHourWarning={showHalfHourWarning}
            />
          </div>
        </>
      )}
    </Stack>
  );
};

export default StudentAvailabilityInfo;
