import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { Box, IconButton, Collapse, Badge } from "@mui/material";
import { getFunctions, httpsCallable } from "firebase/functions";
import { deriveLessonTypeFromReports } from "../../utils/checkLessonTypes";
import { Calendar, dayjsLocalizer } from "react-big-calendar";
import { ToastContainer, toast } from "react-toastify";
import { FilterList } from "@mui/icons-material";
import { app, db } from "../../data/firebase";
import NewEventDialog from "./CustomComponents/NewEventDialog";
import updateLocale from "dayjs/plugin/updateLocale";
import EventDialog from "./CustomComponents/EventDialog";
import FilterPanel from "./CustomComponents/FilterPanel";
import WeekHeader from "./CustomComponents/WeekHeader";
import EventCard from "./CustomComponents/Event";
import Toolbar from "./CustomComponents/Toolbar";
import dayjs from "dayjs";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-toastify/dist/ReactToastify.css";
import "./calendar.scss";

dayjs.extend(updateLocale);
dayjs.updateLocale("en", {
  weekStart: 6,
});

const localizer = dayjsLocalizer(dayjs);
const functions = getFunctions(app, "australia-southeast1");

const BigCalendar = () => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newLessonSlot, setNewLessonSlot] = useState(null);
  const [dialogMode, setDialogMode] = useState("view");
  const [reportStudent, setReportStudent] = useState(null);
  const [unsubscribe, setUnsubscribe] = useState(null);
  const [allEvents, setAllEvents] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    tutors: [],
    students: [],
    subjectGroups: [],
    locations: [],
    frequencies: [],
    types: [],
  });

  const calendarRef = useRef(null);
  const hasScrolledToTime = useRef(false);

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).reduce(
      (count, value) => count + (value.length > 0 ? 1 : 0),
      0
    );
  }, [filters]);

  const options = useMemo(() => {
    return {
      tutors: [...new Set(allEvents.map((e) => e.tutorName))],
      students: [...new Set(allEvents.flatMap((e) => e.studentNames || []))],
      subjectGroups: [...new Set(allEvents.map((e) => e.subjectGroupName))],
      locations: [...new Set(allEvents.map((e) => e.locationName))],
    };
  }, [allEvents]);

  const filteredEvents = useMemo(() => {
    return allEvents.filter((event) => {
      if (
        filters.tutors.length > 0 &&
        !filters.tutors.includes(event.tutorName)
      ) {
        return false;
      }

      if (
        filters.students.length > 0 &&
        !event.studentNames.some((s) => filters.students.includes(s))
      ) {
        return false;
      }

      if (
        filters.subjectGroups.length > 0 &&
        !filters.subjectGroups.includes(event.subjectGroupName)
      ) {
        return false;
      }

      if (
        filters.locations.length > 0 &&
        !filters.locations.includes(event.locationName)
      ) {
        return false;
      }

      if (filters.frequencies.length > 0) {
        const eventFrequency = event.frequency
          ? event.frequency.toLowerCase()
          : "single";

        if (
          !filters.frequencies
            .map((f) => f.toLowerCase())
            .includes(eventFrequency)
        ) {
          return false;
        }
      }

      if (filters.types.length > 0 && !filters.types.includes(event.type)) {
        return false;
      }

      return true;
    });
  }, [allEvents, filters]);

  const components = useMemo(
    () => ({
      toolbar: Toolbar,
      event: (props) => (
        <EventCard
          {...props}
          onView={handleViewEvent}
          onEdit={handleEditEvent}
          onReport={handleReportStudent}
          onDelete={handleDeleteEvent}
          onCancel={handleCancelEvent}
        />
      ),
      week: {
        header: WeekHeader,
      },
    }),
    []
  );

  const handleSelectEvent = useCallback((event) => {
    setDialogMode("view");
    setSelectedEvent(event);
  }, []);

  const subscribeWeek = useCallback(
    (startDate, endDate) => {
      if (unsubscribe) unsubscribe();

      const lessonRef = collection(db, "lessons");
      const q = query(
        lessonRef,
        where("startDateTime", ">=", startDate.toISOString()),
        where("startDateTime", "<=", endDate.toISOString())
      );

      const newUnsubscribe = onSnapshot(q, (snap) => {
        const lessons = snap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            start: data.startDateTime.toDate
              ? data.startDateTime.toDate()
              : new Date(data.startDateTime),
            end: data.endDateTime.toDate
              ? data.endDateTime.toDate()
              : new Date(data.endDateTime),
          };
        });

        setAllEvents(lessons);
      });

      setUnsubscribe(() => newUnsubscribe);
    },
    [unsubscribe]
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
    const startOfWeek = dayjs().startOf("week").toDate();
    const endOfWeek = dayjs().endOf("week").toDate();
    handleRangeChange([startOfWeek, endOfWeek]);

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (hasScrolledToTime.current) return;

    const scrollToCurrentTime = () => {
      const timeIndicator = calendarRef.current?.querySelector(
        ".rbc-current-time-indicator"
      );

      if (timeIndicator) {
        timeIndicator.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        hasScrolledToTime.current = true;
      }
    };
    
    scrollToCurrentTime();
  }, [allEvents]);

  const handleViewEvent = (event) => {
    setSelectedEvent(event);
    setDialogMode("view");
  };

  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setDialogMode("edit");
  };

  const handleReportStudent = (event, report) => {
    setSelectedEvent(event);
    setDialogMode("report");
    setReportStudent(report);
  };

  const handleDeleteEvent = async (event, applyToFuture = false) => {
    try {
      if (applyToFuture) {
        const deleteRepeatingLessons = httpsCallable(
          functions,
          "deleteRepeatingLessons"
        );
        await deleteRepeatingLessons({
          repeatingId: event.repeatingId,
          currentLessonStart: event.startDateTime,
        });
      } else {
        const lessonRef = doc(db, "lessons", event.id);
        await deleteDoc(lessonRef);
      }

      toast.success("Lesson(s) deleted");
    } catch (error) {
      toast.error("Error deleting lesson(s): " + error.message);
    }
  };

  const handleReportEditEvent = async (id, updatedReports, event) => {
    try {
      const lessonRef = doc(db, "lessons", id);

      const newType = deriveLessonTypeFromReports(event.type, updatedReports);

      await updateDoc(lessonRef, {
        reports: updatedReports,
        type: newType,
      });

      toast.success("Report saved");
    } catch (error) {
      toast.error("Error saving report: " + error.message);
    }
  };

  const handleCancelEvent = async (event, report) => {
    try {
      if (report.status === "cancelled") {
        toast.warning("Student already cancelled");
        return;
      }
      const lessonRef = doc(db, "lessons", event.id);
      const updatedReports = event.reports.map((r) =>
        r.studentId === report.studentId ? { ...r, status: "cancelled" } : r
      );

      const newType = deriveLessonTypeFromReports(event.type, updatedReports);

      await updateDoc(lessonRef, {
        reports: updatedReports,
        type: newType,
      });

      toast.success("Student status set to cancelled");
    } catch (error) {
      toast.error("Error cancelling student: " + error.message);
    }
  };

  return (
    <Box ref={calendarRef}>
      <Box display="flex" justifyContent="flex-end" mb={1}>
        <IconButton onClick={() => setShowFilters((prev) => !prev)}>
          <Badge
            badgeContent={activeFilterCount}
            color="primary"
            invisible={activeFilterCount === 0}
          >
            <FilterList />
          </Badge>
        </IconButton>
      </Box>

      <Collapse in={showFilters}>
        <FilterPanel
          filters={filters}
          setFilters={setFilters}
          options={options}
        />
      </Collapse>

      <Calendar
        localizer={localizer}
        events={filteredEvents}
        defaultDate={new Date()}
        views={["week", "day"]}
        startAccessor="start"
        endAccessor="end"
        defaultView="week"
        style={{ height: "200vh" }}
        min={new Date(2025, 0, 1, 6, 0)}
        max={new Date(2025, 0, 1, 22, 0)}
        selectable
        onSelectEvent={handleSelectEvent}
        onRangeChange={handleRangeChange}
        onSelectSlot={(slotInfo) => {
          setNewLessonSlot(slotInfo);
        }}
        components={components}
      />

      {selectedEvent && (
        <EventDialog
          event={selectedEvent}
          mode={dialogMode}
          reportStudent={reportStudent}
          onReportEdit={(id, reports, event) => {
            handleReportEditEvent(id, reports, event);
          }}
          onClose={() => {
            setSelectedEvent(null);
            setReportStudent(null);
          }}
          onDelete={(event, applyToFuture) => {
            handleDeleteEvent(event, applyToFuture);
            setSelectedEvent(null);
            setReportStudent(null);
          }}
        />
      )}

      {newLessonSlot && (
        <NewEventDialog
          slot={newLessonSlot}
          onClose={() => setNewLessonSlot(null)}
        />
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </Box>
  );
};

export default BigCalendar;
