import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import {
  Box,
  Chip,
  Stack,
  Typography,
  useTheme,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { ViewList, CalendarMonth } from "@mui/icons-material";
import { useContext, useEffect, useState, useMemo, useCallback } from "react";
import { Calendar, dayjsLocalizer } from "react-big-calendar";
import { AuthContext } from "../../context/AuthContext";
import { tokens } from "../../theme";
import { db } from "../../data/firebase";
import updateLocale from "dayjs/plugin/updateLocale";
import relativeTime from "dayjs/plugin/relativeTime";
import dayjs from "dayjs";
import "react-big-calendar/lib/css/react-big-calendar.css";

dayjs.extend(relativeTime);
dayjs.extend(updateLocale);
dayjs.updateLocale("en", {
  weekStart: 6,
});

const localizer = dayjsLocalizer(dayjs);

const MiniToolbar = ({ label, onNavigate }) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        my: 1,
        px: 1,
      }}
    >
      <Typography
        variant="caption"
        sx={{ cursor: "pointer", "&:hover": { opacity: 0.7 } }}
        onClick={() => onNavigate("PREV")}
      >
        Prev
      </Typography>
      <Typography variant="subtitle2" fontWeight="bold">
        {label}
      </Typography>
      <Typography
        variant="caption"
        sx={{ cursor: "pointer", "&:hover": { opacity: 0.7 } }}
        onClick={() => onNavigate("NEXT")}
      >
        Next
      </Typography>
    </Box>
  );
};

const MiniWeekHeader = ({ date }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isToday = dayjs(date).isSame(dayjs(), "day");

  return (
    <Box textAlign="center" py={0.5}>
      <Box
        sx={{
          width: 32,
          height: 32,
          bgcolor: isToday ? colors.orangeAccent[700] : "transparent",
          color: isToday ? colors.primary[900] : colors.primary[100],
          borderRadius: "50%",
          padding: 2.5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          mx: "auto",
        }}
      >
        <Typography
          variant="caption"
          sx={{ textTransform: "uppercase", fontSize: "0.65rem" }}
        >
          {dayjs(date).format("ddd")}
        </Typography>
        <Typography
          variant="body2"
          fontWeight="bold"
          sx={{ fontSize: "0.75rem" }}
        >
          {dayjs(date).format("D")}
        </Typography>
      </Box>
    </Box>
  );
};

const MiniEventCard = ({ event }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <Box
      sx={{
        height: "100%",
        background: event.tutorColor ?? colors.orangeAccent[500],
        borderRadius: "2px",
        px: 0.5,
        overflow: "hidden",
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontSize: "0.65rem",
          fontWeight: "bold",
          color: "white",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          display: "block",
        }}
      >
        {event.subjectGroupName}
      </Typography>
      {event.studentNames?.map((student, idx) => (
        <Typography
          key={idx}
          variant="caption"
          sx={{
            fontSize: "0.6rem",
            color: "rgba(255,255,255,0.9)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "block",
          }}
        >
          {student}
        </Typography>
      ))}
    </Box>
  );
};

const UpcomingLessons = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [lessons, setLessons] = useState([]);
  const [calendarLessons, setCalendarLessons] = useState([]);
  const [now, setNow] = useState(new Date());
  const [viewMode, setViewMode] = useState("list");
  const [unsubscribe, setUnsubscribe] = useState(null);
  const { currentUser } = useContext(AuthContext);

  useEffect(() => {
    if (!currentUser) return;

    const fetchLessons = async () => {
      try {
        const nowDate = new Date();
        const sevenDaysLater = dayjs().add(7, "day").toDate();
        const lessonRef = collection(db, "lessons");
        const q = query(
          lessonRef,
          where("tutorId", "==", currentUser.uid),
          where("startDateTime", ">=", nowDate.toISOString()),
          where("startDateTime", "<=", sevenDaysLater.toISOString()),
          orderBy("startDateTime", "asc")
        );

        const querySnap = await getDocs(q);
        const fetched = querySnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setLessons(fetched);
      } catch (error) {
        console.error("Error fetching lessons: ", error);
      }
    };

    fetchLessons();
  }, [currentUser]);

  const subscribeWeek = useCallback(
    (startDate, endDate) => {
      if (!currentUser) return;
      if (unsubscribe) unsubscribe();

      const lessonRef = collection(db, "lessons");
      const q = query(
        lessonRef,
        where("tutorId", "==", currentUser.uid),
        where("startDateTime", ">=", startDate.toISOString()),
        where("startDateTime", "<=", endDate.toISOString())
      );

      const newUnsubscribe = onSnapshot(q, (snap) => {
        const fetchedLessons = snap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            start: data.startDateTime?.toDate
              ? data.startDateTime.toDate()
              : new Date(data.startDateTime),
            end: data.endDateTime?.toDate
              ? data.endDateTime.toDate()
              : new Date(data.endDateTime),
          };
        });

        setCalendarLessons(fetchedLessons);
      });

      setUnsubscribe(() => newUnsubscribe);
    },
    [currentUser, unsubscribe]
  );

  const handleRangeChange = useCallback(
    (range) => {
      const startDate = dayjs(range[0]).startOf("week");
      const endDate = dayjs(range[range.length - 1]).endOf("week");
      subscribeWeek(startDate, endDate);
    },
    [subscribeWeek]
  );

  useEffect(() => {
    if (viewMode === "calendar" && currentUser) {
      const startOfWeek = dayjs().startOf("week").toDate();
      const endOfWeek = dayjs().endOf("week").toDate();
      handleRangeChange([startOfWeek, endOfWeek]);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [viewMode, currentUser]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimeUntil = (lessonDate) => {
    const diffMs = new Date(lessonDate) - now;
    if (diffMs <= 0) return "started";

    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHrs = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffMins < 60) {
      return `${diffMins}m`;
    } else if (diffHrs < 24) {
      const hours = diffHrs;
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    } else {
      const days = diffDays;
      const hours = diffHrs % 24;
      return `${days}d ${hours}h`;
    }
  };

  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  const calendarComponents = useMemo(
    () => ({
      toolbar: MiniToolbar,
      event: MiniEventCard,
      week: {
        header: MiniWeekHeader,
      },
    }),
    []
  );

  return (
    <Box
      width="100%"
      height="100%"
      p="20px"
      bgcolor={colors.primary[400]}
      borderRadius="8px"
      display="flex"
      flexDirection="column"
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb="16px"
        sx={{ flexShrink: 0 }}
      >
        <Typography variant="h3" color={colors.orangeAccent[400]}>
          Upcoming Lessons
        </Typography>

        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={handleViewModeChange}
          size="small"
        >
          <ToggleButton value="list" aria-label="list view">
            <ViewList fontSize="small" />
          </ToggleButton>
          <ToggleButton value="calendar" aria-label="calendar view">
            <CalendarMonth fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box flex={1} overflow="auto" pr={1}>
        {viewMode === "list" ? (
          lessons.length === 0 ? (
            <Typography variant="body1" color={colors.grey[200]}>
              No lessons in the next 3 days.
            </Typography>
          ) : (
            <Stack spacing={2}>
              {lessons.map((lesson) => (
                <Box
                  key={lesson.id}
                  p={2}
                  borderRadius="8px"
                  bgcolor={colors.primary[500]}
                  position="relative"
                >
                  <Typography
                    variant="body2"
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 12,
                      color: colors.orangeAccent[400],
                    }}
                  >
                    {formatTimeUntil(lesson.startDateTime)}
                  </Typography>
                  <Typography variant="h5" color={colors.orangeAccent[400]}>
                    {lesson.subjectGroupName}
                  </Typography>

                  <Typography variant="body2" color={colors.grey[100]}>
                    {lesson.locationName}
                  </Typography>

                  <Typography variant="body2" color={colors.grey[100]}>
                    {dayjs(lesson.startDateTime).format("ddd, MMM D • h:mm A")}
                  </Typography>

                  <Box
                    display="grid"
                    gridTemplateColumns="repeat(auto-fit, 120px)"
                    gap={1}
                    mt={1}
                  >
                    {lesson.studentNames?.slice(0, 3).map((name, idx) => (
                      <Chip key={idx} label={name} size="small" />
                    ))}
                  </Box>
                </Box>
              ))}
            </Stack>
          )
        ) : (
          <Box
            sx={{
              height: "100%",
              minHeight: 1200,
              "& .rbc-calendar": {
                bgcolor: colors.primary[500],
                borderRadius: "8px",
              },
              "& .rbc-header": {
                borderBottom: "none !important",
                padding: "4px 0",
              },
              "& .rbc-time-slot": {
                borderTop: "none !important",
              },
              "& .rbc-allday-cell": {
                display: "none",
              },
              "& .rbc-time-gutter .rbc-label": {
                fontSize: "0.65rem",
              },
            }}
          >
            <Calendar
              localizer={localizer}
              events={calendarLessons}
              defaultDate={new Date()}
              views={["week"]}
              defaultView="week"
              drilldownView={null}
              startAccessor="start"
              endAccessor="end"
              style={{ height: "100%" }}
              min={new Date(2025, 0, 1, 6, 0)}
              max={new Date(2025, 0, 1, 22, 0)}
              onRangeChange={handleRangeChange}
              components={calendarComponents}
              toolbar={true}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default UpcomingLessons;
