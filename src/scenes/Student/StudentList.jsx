import { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import {
  Box,
  IconButton,
  useTheme,
  Typography,
  Stack,
  Button,
  Paper,
  Menu,
  MenuItem,
  ListItemText,
  ToggleButtonGroup,
  ToggleButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
  TextField,
  InputAdornment,
} from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import { tokens } from "../../theme";
import { useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../data/firebase";
import { ToastContainer, toast } from "react-toastify";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Header from "../../components/Global/Header";
import ArrowCircleRightIcon from "@mui/icons-material/ArrowCircleRight";
import "react-toastify/dist/ReactToastify.css";

const fetchLocations = async () => {
  const snapshot = await getDocs(collection(db, "locations"));
  const locations = {};
  snapshot.forEach((doc) => {
    locations[doc.id] = doc.data().name;
  });
  return locations;
};

const fetchStudents = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "students"));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      firstName: doc.data().firstName,
      lastName: doc.data().lastName,
      homeLocation: doc.data().homeLocation,
    }));
  } catch (error) {
    toast.error("Failed to fetch students: " + error.message);
    return [];
  }
};

const fetchArchivedStudents = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "archivedStudents"));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      firstName: doc.data().firstName,
      lastName: doc.data().lastName,
      homeLocation: doc.data().homeLocation,
      archivedAt: doc.data().archivedAt,
    }));
  } catch (error) {
    toast.error("Failed to fetch archived students: " + error.message);
    return [];
  }
};

const StudentList = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    action: null,
    student: null,
  });

  const { data: locationMap = {}, isLoading: loadingLocations } = useQuery({
    queryKey: ["locations"],
    queryFn: fetchLocations,
    staleTime: 60 * 60 * 1000,
  });

  const {
    data: activeStudents = [],
    error: activeError,
    isLoading: loadingActive,
  } = useQuery({
    queryKey: ["students"],
    queryFn: fetchStudents,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: archivedStudents = [],
    error: archivedError,
    isLoading: loadingArchived,
  } = useQuery({
    queryKey: ["archivedStudents"],
    queryFn: fetchArchivedStudents,
    staleTime: 5 * 60 * 1000,
    enabled: viewMode === "archived",
  });

  useEffect(() => {
    if (activeError) {
      toast.error(activeError.message);
    }
    if (archivedError) {
      toast.error(archivedError.message);
    }
  }, [activeError, archivedError]);

  const handleContextMenu = (event, student) => {
    event.preventDefault();
    setSelectedStudent(student);
    setContextMenu(
      contextMenu === null
        ? { mouseX: event.clientX + 2, mouseY: event.clientY - 6 }
        : null
    );
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
    setSelectedStudent(null);
  };

  const handleArchiveClick = () => {
    setConfirmDialog({
      open: true,
      action: "archive",
      student: selectedStudent,
    });
    handleCloseContextMenu();
  };

  const handleUnarchiveClick = () => {
    setConfirmDialog({
      open: true,
      action: "unarchive",
      student: selectedStudent,
    });
    handleCloseContextMenu();
  };

  const handleConfirmAction = async () => {
    const { action, student } = confirmDialog;

    try {
      if (action === "archive") {
        const studentRef = doc(db, "students", student.id);
        const studentSnap = await getDoc(studentRef);

        if (!studentSnap.exists()) {
          toast.error("Student not found");
          return;
        }

        const studentData = studentSnap.data();

        const archivedRef = doc(db, "archivedStudents", student.id);
        await setDoc(archivedRef, {
          ...studentData,
          archivedAt: new Date().toISOString(),
        });

        await deleteDoc(studentRef);

        toast.success(
          `${student.firstName} ${student.lastName} has been archived`
        );

        queryClient.invalidateQueries({ queryKey: ["students"] });
        queryClient.invalidateQueries({ queryKey: ["archivedStudents"] });
      } else if (action === "unarchive") {
        const archivedRef = doc(db, "archivedStudents", student.id);
        const archivedSnap = await getDoc(archivedRef);

        if (!archivedSnap.exists()) {
          toast.error("Archived student not found");
          return;
        }

        const studentData = archivedSnap.data();

        const { archivedAt, ...activeStudentData } = studentData;
        const studentRef = doc(db, "students", student.id);
        await setDoc(studentRef, activeStudentData);

        await deleteDoc(archivedRef);

        toast.success(
          `${student.firstName} ${student.lastName} has been unarchived`
        );

        queryClient.invalidateQueries({ queryKey: ["students"] });
        queryClient.invalidateQueries({ queryKey: ["archivedStudents"] });
      }
    } catch (error) {
      toast.error(`Failed to ${action} student: ${error.message}`);
    }

    setConfirmDialog({ open: false, action: null, student: null });
  };

  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
      setSearchQuery("");
    }
  };

  const baseRows = viewMode === "active" ? activeStudents : archivedStudents;
  const isLoading =
    loadingLocations ||
    (viewMode === "active" ? loadingActive : loadingArchived);

  const rows = baseRows
    .filter((student) => {
      if (!searchQuery.trim()) return true;
      const fullName = `${student.firstName || ""} ${
        student.lastName || ""
      }`.toLowerCase();
      return fullName.includes(searchQuery.toLowerCase().trim());
    })
    .sort((a, b) => {
      const nameA = `${a.firstName || ""} ${a.lastName || ""}`.toLowerCase();
      const nameB = `${b.firstName || ""} ${b.lastName || ""}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });

  const columns = [
    {
      field: "fullName",
      headerName: "Name",
      width: 200,
      valueGetter: (value, row) =>
        `${row.firstName || ""} ${row.lastName || ""}`,
    },
    {
      field: "homeLocation",
      headerName: "Location",
      width: 200,
      valueGetter: (_, row) => locationMap[row.homeLocation] || "Unknown",
    },
    ...(viewMode === "archived"
      ? [
          {
            field: "archivedAt",
            headerName: "Archived",
            width: 150,
            valueGetter: (value) => {
              if (!value) return "";
              return new Date(value).toLocaleDateString("en-AU");
            },
          },
        ]
      : []),
    {
      field: "edit",
      headerName: "",
      width: 150,
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <IconButton
          color="secondary"
          onClick={() => navigate(`/student/${params.row.id}`)}
          disabled={viewMode === "archived"}
          sx={{ visibility: viewMode === "archived" ? "collapse" : "visible" }}
        >
          <ArrowCircleRightIcon sx={{ width: 25, height: 25 }} />
        </IconButton>
      ),
    },
  ];

  return (
    <Box display="flex" m="20px">
      <Stack sx={{ width: "100%" }}>
        <Header title="STUDENTS" subtitle="View all students" />

        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Button
            onClick={() => navigate("/newstudent")}
            variant="contained"
            sx={{
              backgroundColor: `${colors.orangeAccent[700]}`,
              fontSize: "1.3em",
            }}
          >
            <Typography variant="h6">NEW</Typography>
          </Button>

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size="small"
          >
            <ToggleButton value="active">
              Active
              <Chip label={activeStudents.length} size="small" sx={{ ml: 1 }} />
            </ToggleButton>
            <ToggleButton value="archived">
              Archived
              {archivedStudents.length > 0 && (
                <Chip
                  label={archivedStudents.length}
                  size="small"
                  sx={{ ml: 1 }}
                />
              )}
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <TextField
            placeholder="Search students"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{ mb: 2, maxWidth: 200 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>

        <Paper
          sx={{
            backgroundColor: "transparent",
            marginTop: "4px",
          }}
        >
          <DataGrid
            checkboxSelection={false}
            rows={rows}
            columns={columns}
            loading={isLoading}
            initialState={{
              pagination: { paginationModel: { page: 0, pageSize: 50 } },
            }}
            pageSizeOptions={[50]}
            sx={{ border: 0 }}
            slotProps={{
              row: {
                onContextMenu: (event) => {
                  const rowId = event.currentTarget.getAttribute("data-id");
                  const student = rows.find((r) => r.id === rowId);
                  if (student) {
                    handleContextMenu(event, student);
                  }
                },
                style: { cursor: "context-menu" },
              },
            }}
          />
        </Paper>
      </Stack>

      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        {viewMode === "active" ? (
          <MenuItem onClick={handleArchiveClick}>
            <ListItemText>Archive Student</ListItemText>
          </MenuItem>
        ) : (
          <MenuItem onClick={handleUnarchiveClick}>
            <ListItemText>Unarchive Student</ListItemText>
          </MenuItem>
        )}
      </Menu>

      <Dialog
        open={confirmDialog.open}
        onClose={() =>
          setConfirmDialog({ open: false, action: null, student: null })
        }
      >
        <DialogTitle>
          {confirmDialog.action === "archive"
            ? "Archive Student?"
            : "Unarchive Student?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialog.action === "archive" ? (
              <>
                Are you sure you want to archive{" "}
                <strong>
                  {confirmDialog.student?.firstName}{" "}
                  {confirmDialog.student?.lastName}
                </strong>
                ? They will be moved to the archived list and won't appear in
                lesson forms or other active lists.
              </>
            ) : (
              <>
                Are you sure you want to unarchive{" "}
                <strong>
                  {confirmDialog.student?.firstName}{" "}
                  {confirmDialog.student?.lastName}
                </strong>
                ? They will be restored to the active students list.
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setConfirmDialog({ open: false, action: null, student: null })
            }
          >
            Cancel
          </Button>
          <Button onClick={handleConfirmAction} variant="contained">
            {confirmDialog.action === "archive" ? "Archive" : "Unarchive"}
          </Button>
        </DialogActions>
      </Dialog>

      <ToastContainer position="top-right" autoClose={3000} />
    </Box>
  );
};

export default StudentList;
