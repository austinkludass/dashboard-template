import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  IconButton,
  Badge,
  Collapse,
  ButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  useMediaQuery,
  useTheme,
  Menu,
  MenuItem,
} from "@mui/material";
import { collection, where, query, getDocs } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { ToastContainer } from "react-toastify";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import {
  FilterList,
  Add,
  ChevronLeft,
  ChevronRight,
  MoreVert,
} from "@mui/icons-material";
import { TypeColors } from "../../utils/lessonTypeColors";
import { DataGrid } from "@mui/x-data-grid";
import { db } from "../../data/firebase";
import FilterPanel from "../../components/Calendar/CustomComponents/FilterPanel";
import EventDialog from "../../components/Calendar/CustomComponents/EventDialog";
import LessonForm from "../../components/Lesson/LessonForm";
import Header from "../../components/Global/Header";
import dayjs from "dayjs";

// Dummy Data
import { lessons as dummyLessons } from "../../data/dummyData";

const toCalendarEvent = (lesson) => ({
  ...lesson,
  start: new Date(lesson.startDateTime),
  end: new Date(lesson.endDateTime),
  title: lesson.subjectGroupName,
});

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [lessons, setLessons] = useState([]);
  const [weekStart, setWeekStart] = useState(dayjs().startOf("week"));
  const [showFilters, setShowFilters] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuRow, setMenuRow] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [dialogMode, setDialogMode] = useState("view");
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
      0,
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

    // const q = query(
    //   collection(db, "lessons"),
    //   where("startDateTime", ">=", startISO),
    //   where("startDateTime", "<=", endISO),
    // );
    //
    // const snapshot = await getDocs(q);
    // const data = snapshot.docs.map((doc) => {
    //   const lesson = { id: doc.id, ...doc.data() };
    //   return {
    //     ...lesson,
    //     date: dayjs(lesson.startDateTime).format("YYYY-MM-DD"),
    //   };
    // });

    // Dummy Data
    const data = dummyLessons.filter(
      (l) => l.startDateTime >= startISO && l.startDateTime <= endISO,
    );

    setLessons(data);
  };

  useEffect(() => {
    fetchLessons();
  }, [weekStart]);

  const handlePrevWeek = () => setWeekStart((prev) => prev.subtract(1, "week"));
  const handleNextWeek = () => setWeekStart((prev) => prev.add(1, "week"));
  const handleToday = () => setWeekStart(dayjs().startOf("week"));

  const handleOpenMenu = (e, row) => {
    e.stopPropagation();
    setMenuAnchorEl(e.currentTarget);
    setMenuRow(row);
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
    setMenuRow(null);
  };

  const handleMenuView = () => {
    setDialogMode("view");
    setSelectedLesson(toCalendarEvent(menuRow));
    handleCloseMenu();
  };

  const handleMenuDelete = () => {
    handleDeleteLesson(menuRow);
    handleCloseMenu();
  };

  const handleDeleteLesson = async (event, applyToFuture = false) => {
    setLessons((prev) => prev.filter((l) => l.id !== event.id));
    setSelectedLesson(null);
  };

  const filteredLessons = useMemo(() => {
    return lessons.filter((event) => {
      if (
        filters.tutors.length > 0 &&
        !filters.tutors.includes(event.tutorName)
      )
        return false;

      if (
        filters.students.length > 0 &&
        !event.studentNames.some((s) => filters.students.includes(s))
      )
        return false;

      if (
        filters.subjectGroups.length > 0 &&
        !filters.subjectGroups.includes(event.subjectGroupName)
      )
        return false;

      if (
        filters.locations.length > 0 &&
        !filters.locations.includes(event.locationName)
      )
        return false;

      if (filters.frequencies.length > 0) {
        const eventFrequency = event.frequency
          ? event.frequency.toLowerCase()
          : "single";

        if (
          !filters.frequencies
            .map((f) => f.toLowerCase())
            .includes(eventFrequency)
        )
          return false;
      }

      if (filters.types.length > 0 && !filters.types.includes(event.type))
        return false;

      return true;
    });
  }, [lessons, filters]);

  const columns = [
    {
      field: "date",
      headerName: "Date",
      minWidth: 90,
      renderCell: (params) =>
        params.value ? dayjs(params.value).format("DD/MM/YY") : "",
    },
    {
      field: "startDateTime",
      headerName: "Start",
      minWidth: 90,
      renderCell: (params) =>
        params.value ? dayjs(params.value).format("h:mm A") : "",
    },
    {
      field: "endDateTime",
      headerName: "End",
      minWidth: 90,
      renderCell: (params) =>
        params.value ? dayjs(params.value).format("h:mm A") : "",
    },
    { field: "tutorName", headerName: "Tutor", minWidth: 140 },
    { field: "subjectGroupName", headerName: "Subject", minWidth: 160 },
    {
      field: "studentNames",
      headerName: "Students",
      minWidth: 220,
      renderCell: (params) => (params.value || []).join(", "),
    },
    { field: "locationName", headerName: "Location", minWidth: 110 },
    {
      field: "type",
      headerName: "Type",
      minWidth: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={TypeColors[params.value] || "success"}
          size="small"
        />
      ),
    },
    {
      field: "actions",
      headerName: "",
      width: 50,
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <IconButton size="small" onClick={(e) => handleOpenMenu(e, params.row)}>
          <MoreVert fontSize="small" />
        </IconButton>
      ),
    },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        m="20px"
      >
        <Header title="LESSONS" subtitle="Manage all lessons" />
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateOpen(true)}
          sx={{ height: 40, whiteSpace: "nowrap" }}
        >
          Add Lesson
        </Button>
      </Box>

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: "primary.main" }}>
          <Typography variant="h4" component="span" color="white">
            New Lesson
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box pt={2}>
            <LessonForm
              initialValues={initialState}
              onCreated={() => setCreateOpen(false)}
            />
          </Box>
        </DialogContent>
      </Dialog>

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={handleMenuView}>Details</MenuItem>
        <MenuItem onClick={handleMenuDelete} sx={{ color: "error.main" }}>
          Delete
        </MenuItem>
      </Menu>

      {selectedLesson && (
        <EventDialog
          event={selectedLesson}
          mode={dialogMode}
          onClose={() => setSelectedLesson(null)}
          onDelete={handleDeleteLesson}
        />
      )}

      <Paper sx={{ p: 3, m: 2 }}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={1}
          gap={1}
        >
          {isMobile ? (
            <Box display="flex" alignItems="center" gap={0.5}>
              <IconButton size="small" onClick={handlePrevWeek}>
                <ChevronLeft />
              </IconButton>
              <Button size="small" variant="outlined" onClick={handleToday}>
                Today
              </Button>
              <IconButton size="small" onClick={handleNextWeek}>
                <ChevronRight />
              </IconButton>
            </Box>
          ) : (
            <ButtonGroup size="small" variant="outlined">
              <Button onClick={handlePrevWeek}>Prev</Button>
              <Button onClick={handleToday}>Today</Button>
              <Button onClick={handleNextWeek}>Next</Button>
            </ButtonGroup>
          )}

          <Typography variant="h6">
            {`${weekStart.format("MMMM DD")} - ${
              weekStart.month() === weekStart.endOf("week").month()
                ? weekStart.endOf("week").format("DD")
                : weekStart.endOf("week").format("MMMM DD")
            }`}
          </Typography>

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

        <DataGrid
          rows={filteredLessons}
          columns={columns}
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          sx={{ "& .MuiDataGrid-virtualScroller": { overflowX: "auto" } }}
        />
      </Paper>

      <ToastContainer position="top-right" autoClose={3000} />
    </LocalizationProvider>
  );
};

export default LessonList;
