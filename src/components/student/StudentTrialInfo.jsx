import { useState } from "react";
import AvailabilitySelector from "../Tutor/AvailabilitySelector";
import studentAvailabilityBounds from "./studentAvailabilityBounds";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { Typography, useTheme, Stack } from "@mui/material";
import { tokens } from "../../theme";

const StudentTrialInfo = ({
  formData,
  setFormData,
  isEdit,
  trialAvailability,
  setTrialAvailability,
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const handleTrialAvailabilityChange = (updatedAvailability) => {
    setTrialAvailability(updatedAvailability);
  };

  const handleDateChange = (name) => (date) => {
    setFormData({ ...formData, [name]: date });
  };

  return (
    <Stack spacing={2}>
      {isEdit ? (
        <>
          <AvailabilitySelector
            onAvailabilityChange={handleTrialAvailabilityChange}
            initialAvailability={trialAvailability}
            isEdit={true}
            dayTimeBounds={studentAvailabilityBounds}
          />
          <DatePicker
            value={formData.preferredStart ? dayjs(formData.preferredStart) : null}
            onChange={handleDateChange("preferredStart")}
            label="Preferred Start Date"
          />
        </>
      ) : (
        <>
          <div style={{ display: "flex", gap: "10px" }}>
            <AvailabilitySelector
              onAvailabilityChange={() => {}}
              initialAvailability={trialAvailability}
              isEdit={false}
              dayTimeBounds={studentAvailabilityBounds}
            />
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <Typography
              variant="h5"
              color={colors.orangeAccent[400]}
              fontWeight="bold"
              sx={{ mb: "5px" }}
            >
              Preferred Start
            </Typography>
            <Typography variant="h6" color={colors.grey[100]}>
              {formData.preferredStart
                ? dayjs(formData.preferredStart).format("MMMM D, YYYY")
                : "N/A"}
            </Typography>
          </div>
        </>
      )}
    </Stack>
  );
};

export default StudentTrialInfo;
