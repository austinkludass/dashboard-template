const WEEKDAY_BOUNDS = { start: "15:30", end: "21:30" };
const WEEKEND_BOUNDS = { start: "10:00", end: "18:00" };

const STUDENT_AVAILABILITY_BOUNDS = {
  Monday: WEEKDAY_BOUNDS,
  Tuesday: WEEKDAY_BOUNDS,
  Wednesday: WEEKDAY_BOUNDS,
  Thursday: WEEKDAY_BOUNDS,
  Friday: WEEKDAY_BOUNDS,
  Saturday: WEEKEND_BOUNDS,
  Sunday: WEEKEND_BOUNDS,
};

export default STUDENT_AVAILABILITY_BOUNDS;
