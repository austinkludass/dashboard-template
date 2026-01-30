import {
  Box,
  Typography,
  Paper,
  AccordionSummary,
  AccordionDetails,
  Accordion,
  Button,
  Chip,
  IconButton,
  Badge,
  Collapse,
  ButtonGroup,
} from "@mui/material";
import { collection, where, query, getDocs } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { ToastContainer } from "react-toastify";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { FilterList } from "@mui/icons-material";
import { TypeColors } from "../../utils/lessonTypeColors";
import { DataGrid } from "@mui/x-data-grid";
import { db } from "../../data/firebase";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FilterPanel from "../../components/Calendar/CustomComponents/FilterPanel";
import LessonForm from "../../components/Lesson/LessonForm";
import Header from "../../components/Global/Header";
import dayjs from "dayjs";

const initialState = {
  date: dayjs(),
  tutor: null,
  selectedStudents: [],
  subjectGroup: null,
  location: null,
  type: "Normal",
  repeat: false,
  frequency: "weekly",
  notes: "",
  startTime: dayjs().hour(12).minute(0),
  endTime: dayjs().hour(13).minute(0),
};

const LessonList = () => {
  const [lessons, setLessons] = useState([]);
  const [weekStart, setWeekStart] = useState(dayjs().startOf("week"));
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    tutors: [],
    students: [],
    subjectGroups: [],
    locations: [],
    frequencies: [],
    types: [],
  });

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).reduce(
      (count, value) => count + (value.length > 0 ? 1 : 0),
      0
    );
  }, [filters]);

  const options = useMemo(() => {
    return {
      tutors: [...new Set(lessons.map((e) => e.tutorName))],
      students: [...new Set(lessons.flatMap((e) => e.studentNames || []))],
      subjectGroups: [...new Set(lessons.map((e) => e.subjectGroupName))],
      locations: [...new Set(lessons.map((e) => e.locationName))],
    };
  }, [lessons]);

  const fetchLessons = async () => {
    const startISO = weekStart.startOf("week").toISOString();
    const endISO = weekStart.endOf("week").toISOString();

    const q = query(
      collection(db, "lessons"),
      where("startDateTime", ">=", startISO),
      where("startDateTime", "<=", endISO)
    );

    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((doc) => {
      const lesson = { id: doc.id, ...doc.data() };
      return {
        ...lesson,
        date: dayjs(lesson.startDateTime).format("YYYY-MM-DD"),
      };
    });
    setLessons(data);
  };

  useEffect(() => {
    fetchLessons();
  }, [weekStart]);

  const handlePrevWeek = () => setWeekStart((prev) => prev.subtract(1, "week"));
  const handleNextWeek = () => setWeekStart((prev) => prev.add(1, "week"));
  const handleToday = () => setWeekStart(dayjs().startOf("week"));

  const filteredLessons = useMemo(() => {
    return lessons.filter((event) => {
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
  }, [lessons, filters]);

  const columns = [
    {
      field: "date",
      headerName: "Date",
      flex: 0.7,
      renderCell: (params) => {
        if (!params.value) return "";
        return dayjs(params.value).format("DD/MM/YY");
      },
    },
    {
      field: "startDateTime",
      headerName: "Start",
      flex: 0.7,
      renderCell: (params) => {
        if (!params.value) return "";
        return dayjs(params.value).format("HH:mm A");
      },
    },
    {
      field: "endDateTime",
      headerName: "End",
      flex: 0.7,
      renderCell: (params) => {
        if (!params.value) return "";
        return dayjs(params.value).format("HH:mm A");
      },
    },
    { field: "tutorName", headerName: "Tutor", flex: 1 },
    { field: "subjectGroupName", headerName: "Subject", flex: 1 },
    {
      field: "studentNames",
      headerName: "Students",
      flex: 2,
      renderCell: (params) => {
        const students = params.value || [];
        return students.join(", ");
      },
    },
    { field: "locationName", headerName: "Location", flex: 1 },
    {
      field: "type",
      headerName: "Type",
      flex: 1,
      renderCell: (params) => {
        const type = params.value;
        const color = TypeColors[type] || "success";
        return <Chip label={type} color={color} size="small" />;
      },
    },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
      <Box display="flex" m="20px">
        <Header title="LESSONS" subtitle="Manage all lessons" />
      </Box>

      <Paper sx={{ p: 3, maxWidth: 1000, minWidth: 600, m: 4 }}>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h4">Create Lesson</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <LessonForm initialValues={initialState} />
          </AccordionDetails>
        </Accordion>
      </Paper>

      <Paper sx={{ p: 3, minWidth: 600, m: 4 }}>
        <Typography variant="h5" gutterBottom>
          Lessons
        </Typography>

        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={1}
        >
          <ButtonGroup size="small" variant="outlined">
            <Button onClick={handlePrevWeek}>Prev</Button>
            <Button onClick={handleToday}>Today</Button>
            <Button onClick={handleNextWeek}>Next</Button>
          </ButtonGroup>

          <Typography variant="h4">
            {`${weekStart.format("MMMM DD")} - ${
              weekStart.month() === weekStart.endOf("week").month()
                ? weekStart.endOf("week").format("DD")
                : weekStart.endOf("week").format("MMMM DD")
            }`}
          </Typography>

          <IconButton
            sx={{ ml: 12 }}
            onClick={() => setShowFilters((prev) => !prev)}
          >
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

        <DataGrid rows={filteredLessons} columns={columns} />
      </Paper>
      <ToastContainer position="top-right" autoClose={3000} />
    </LocalizationProvider>
  );
};

export default LessonList;
