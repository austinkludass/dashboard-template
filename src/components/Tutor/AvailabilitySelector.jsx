import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import DeleteIcon from "@mui/icons-material/Delete";

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const weekendDays = ["Saturday", "Sunday"];

const DEFAULT_MIN_HOUR = 8;
const DEFAULT_MAX_HOUR = 21;

const timeForParts = (hour, minute = 0) => {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
};

const timeForHour = (hour) => timeForParts(hour, 0);

const isValidDate = (value) =>
  value instanceof Date && !Number.isNaN(value.getTime());

function timeStringToDate(timeStr) {
  if (typeof timeStr !== "string" || !timeStr.includes(":")) {
    console.warn("Invalid time string: ", timeStr);
    return new Date();
  }
  const [hours, minutes] = timeStr.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

const resolveBoundTime = (value, fallback) => {
  if (!value) return fallback;
  if (value instanceof Date && isValidDate(value)) return value;
  if (typeof value === "string") return timeStringToDate(value);
  if (typeof value === "number") return timeForHour(value);
  if (typeof value === "object") {
    const hour = Number(value.hour);
    const minute = Number(value.minute ?? value.minutes ?? 0);
    if (Number.isFinite(hour) && Number.isFinite(minute)) {
      return timeForParts(hour, minute);
    }
  }
  return fallback;
};

const isOutsideBounds = (value, minTime, maxTime) => {
  if (!isValidDate(value)) return false;
  return value < minTime || value > maxTime;
};

const formatTimeLabel = (value) =>
  value.toLocaleTimeString("en-AU", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

const formatOpenHoursLabel = (minTime, maxTime) => {
  const start = formatTimeLabel(minTime);
  const end = formatTimeLabel(maxTime);
  return `Open hours: ${start} to ${end}.`;
};

const resolveSlotDate = (value) => {
  if (value instanceof Date && isValidDate(value)) return value;
  if (typeof value === "string") return timeStringToDate(value);
  return null;
};

const isHalfHourAligned = (value, day) => {
  const date = resolveSlotDate(value);
  if (!date) return true;
  const minutes = date.getMinutes();
  if (weekendDays.includes(day)) {
    return minutes === 0 || minutes === 30;
  }
  return minutes === 30;
};

const getHalfHourWarningText = (day) =>
  weekendDays.includes(day)
    ? "Lessons start and end on the hour or half hour (e.g. 10:00-11:00)."
    : "Lessons start and end on the half hour (e.g. 3:30-4:30).";

const AvailabilitySelector = ({
  initialAvailability,
  onAvailabilityChange,
  isEdit,
  minHour = DEFAULT_MIN_HOUR,
  maxHour = DEFAULT_MAX_HOUR,
  dayTimeBounds,
  showHalfHourWarning = false,
}) => {
  const [availability, setAvailability] = useState({});
  const isSyncingRef = useRef(false);
  const didMountRef = useRef(false);
  const onChangeRef = useRef(onAvailabilityChange);
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down("sm"));
  const resolvedMinHour = Number.isFinite(minHour)
    ? minHour
    : DEFAULT_MIN_HOUR;
  const resolvedMaxHour = Number.isFinite(maxHour)
    ? maxHour
    : DEFAULT_MAX_HOUR;
  const minTime = timeForHour(Math.min(resolvedMinHour, resolvedMaxHour));
  const maxTime = timeForHour(Math.max(resolvedMinHour, resolvedMaxHour));

  const getDayBounds = (day) => {
    const bounds = dayTimeBounds?.[day];
    if (!bounds) return { minTime, maxTime };
    const dayMin = resolveBoundTime(bounds.start, minTime);
    const dayMax = resolveBoundTime(bounds.end, maxTime);
    return { minTime: dayMin, maxTime: dayMax };
  };

  useEffect(() => {
    if (!initialAvailability) return;

    const parsed = {};
    for (const day in initialAvailability) {
      parsed[day] = initialAvailability[day].map((slot) => ({
        start:
          typeof slot.start === "string"
            ? timeStringToDate(slot.start)
            : slot.start,
        end:
          typeof slot.end === "string" ? timeStringToDate(slot.end) : slot.end,
      }));
    }

    isSyncingRef.current = true;
    setAvailability(parsed);
  }, [initialAvailability]);

  useEffect(() => {
    onChangeRef.current = onAvailabilityChange;
  }, [onAvailabilityChange]);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      if (isSyncingRef.current) {
        isSyncingRef.current = false;
      }
      return;
    }
    if (isSyncingRef.current) {
      isSyncingRef.current = false;
      return;
    }
    if (onChangeRef.current) {
      onChangeRef.current(availability);
    }
  }, [availability]);

  const updateAvailability = (updater) => {
    setAvailability((prev) =>
      typeof updater === "function" ? updater(prev) : updater
    );
  };

  // Add a new time slot for a day
  const addTimeSlot = (day) => {
    const { minTime: dayMinTime, maxTime: dayMaxTime } = getDayBounds(day);
    const startTime = new Date(dayMinTime.getTime());
    const endCandidate = new Date(dayMinTime.getTime());
    endCandidate.setHours(endCandidate.getHours() + 1);
    const endTime =
      endCandidate > dayMaxTime
        ? new Date(dayMaxTime.getTime())
        : endCandidate;
    updateAvailability((prev) => ({
      ...prev,
      [day]: [
        ...(prev[day] || []),
        {
          start: startTime,
          end: endTime,
        },
      ],
    }));
  };

  // Remove a time slot
  const removeTimeSlot = (day, index) => {
    updateAvailability((prev) => {
      const updatedSlots = [...(prev[day] || [])];
      updatedSlots.splice(index, 1);
      return { ...prev, [day]: updatedSlots };
    });
  };

  // Update time values
  const handleTimeChange = (day, index, type, value) => {
    if (!isValidDate(value)) return;
    updateAvailability((prev) => {
      const updatedSlots = [...(prev[day] || [])];
      updatedSlots[index] = { ...updatedSlots[index], [type]: value };
      return { ...prev, [day]: updatedSlots };
    });
  };

  const renderAddButton = (day, compact) => {
    if (!isEdit) return null;
    if (compact) {
      return (
        <Button
          size="small"
          variant="outlined"
          startIcon={<AddCircleIcon />}
          onClick={() => addTimeSlot(day)}
        >
          Add slot
        </Button>
      );
    }
    return (
      <IconButton
        sx={{ width: 55, height: 55 }}
        color="secondary"
        onClick={() => addTimeSlot(day)}
      >
        <AddCircleIcon sx={{ width: 30, height: 30 }} />
      </IconButton>
    );
  };

  const renderDaySlots = (day, showEmptyState) => {
    const slots = availability[day] || [];
    const { minTime: dayMinTime, maxTime: dayMaxTime } = getDayBounds(day);
    const openHoursLabel = formatOpenHoursLabel(dayMinTime, dayMaxTime);
    if (slots.length === 0) {
      if (!showEmptyState) return null;
      return (
        <Typography variant="body2" color="text.secondary">
          No time slots added yet.
        </Typography>
      );
    }
    return slots.map((slot, index) => {
      const startOutside = isOutsideBounds(slot.start, dayMinTime, dayMaxTime);
      const endOutside = isOutsideBounds(slot.end, dayMinTime, dayMaxTime);
      const startMisaligned =
        showHalfHourWarning && !startOutside && !isHalfHourAligned(slot.start, day);
      const endMisaligned =
        showHalfHourWarning && !endOutside && !isHalfHourAligned(slot.end, day);
      const startHelperText = startOutside
        ? `Wise Minds is closed at the time you've entered. ${openHoursLabel}`
        : startMisaligned
          ? getHalfHourWarningText(day)
          : "";
      const endHelperText = endOutside
        ? `Wise Minds is closed at the time you've entered. ${openHoursLabel}`
        : endMisaligned
          ? getHalfHourWarningText(day)
          : "";
      const startHelperProps = startMisaligned
        ? { sx: { color: "warning.main" } }
        : undefined;
      const endHelperProps = endMisaligned
        ? { sx: { color: "warning.main" } }
        : undefined;
      return (
        <Stack
          key={`${day}-${index}`}
          direction={isCompact ? "column" : "row"}
          spacing={1.5}
          alignItems={isCompact ? "stretch" : "center"}
          sx={{ pt: index === 0 ? 0 : isCompact ? 1 : 1.5 }}
        >
          <TimePicker
            label="Start Time"
            readOnly={!isEdit}
            value={slot.start}
            minTime={dayMinTime}
            maxTime={dayMaxTime}
            onChange={(newValue) =>
              handleTimeChange(day, index, "start", newValue)
            }
            slotProps={{
              textField: {
                variant: "outlined",
                fullWidth: true,
                error: startOutside,
                helperText: startHelperText,
                FormHelperTextProps: startHelperProps,
              },
            }}
          />
          <TimePicker
            label="End Time"
            readOnly={!isEdit}
            value={slot.end}
            minTime={dayMinTime}
            maxTime={dayMaxTime}
            onChange={(newValue) =>
              handleTimeChange(day, index, "end", newValue)
            }
            slotProps={{
              textField: {
                variant: "outlined",
                fullWidth: true,
                error: endOutside,
                helperText: endHelperText,
                FormHelperTextProps: endHelperProps,
              },
            }}
          />
          {isEdit && (
            <Box
              display="flex"
              justifyContent={isCompact ? "flex-end" : "flex-start"}
            >
              <IconButton
                color="error"
                onClick={() => removeTimeSlot(day, index)}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          )}
        </Stack>
      );
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      {isCompact ? (
        <Stack spacing={2}>
          {daysOfWeek.map((day) => (
            <Paper key={day} variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={1.5}>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  gap={1}
                >
                  <Typography variant="subtitle1" fontWeight="bold">
                    {day}
                  </Typography>
                  {renderAddButton(day, true)}
                </Box>
                {renderDaySlots(day, true)}
              </Stack>
            </Paper>
          ))}
        </Stack>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Day</TableCell>
                <TableCell>Available Time Slots</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {daysOfWeek.map((day) => (
                <TableRow key={day}>
                  <TableCell sx={{ width: 120 }}>{day}</TableCell>
                  <TableCell sx={{ width: 600, verticalAlign: "top" }}>
                    {renderDaySlots(day, false)}
                  </TableCell>
                  <TableCell
                    sx={{ verticalAlign: "top", width: 80, height: 55 }}
                  >
                    {renderAddButton(day, false)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </LocalizationProvider>
  );
};

export default AvailabilitySelector;
