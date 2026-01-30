import { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import {
  Avatar,
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
import usePermissions from "../../hooks/usePermissions";
import "react-toastify/dist/ReactToastify.css";

const fetchTutors = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "tutors"));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      avatar: doc.data().avatar,
      tutorColor: doc.data().tutorColor,
      firstName: doc.data().firstName,
      lastName: doc.data().lastName,
      wiseMindsEmail: doc.data().wiseMindsEmail,
      role: doc.data().role,
    }));
  } catch (error) {
    toast.error("Failed to fetch tutors: " + error.message);
    return [];
  }
};

const fetchArchivedTutors = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "archivedTutors"));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      avatar: doc.data().avatar,
      tutorColor: doc.data().tutorColor,
      firstName: doc.data().firstName,
      lastName: doc.data().lastName,
      wiseMindsEmail: doc.data().wiseMindsEmail,
      role: doc.data().role,
      archivedAt: doc.data().archivedAt,
    }));
  } catch (error) {
    toast.error("Failed to fetch archived tutors: " + error.message);
    return [];
  }
};

const TutorList = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isHeadTutorOrAbove } = usePermissions();

  const [viewMode, setViewMode] = useState("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    action: null,
    tutor: null,
  });

  const {
    data: activeTutors = [],
    error: activeError,
    isLoading: loadingActive,
  } = useQuery({
    queryKey: ["tutors"],
    queryFn: fetchTutors,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: archivedTutors = [],
    error: archivedError,
    isLoading: loadingArchived,
  } = useQuery({
    queryKey: ["archivedTutors"],
    queryFn: fetchArchivedTutors,
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

  const handleContextMenu = (event, tutor) => {
    event.preventDefault();
    setSelectedTutor(tutor);
    setContextMenu(
      contextMenu === null
        ? { mouseX: event.clientX + 2, mouseY: event.clientY - 6 }
        : null
    );
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
    setSelectedTutor(null);
  };

  const handleArchiveClick = () => {
    setConfirmDialog({
      open: true,
      action: "archive",
      tutor: selectedTutor,
    });
    handleCloseContextMenu();
  };

  const handleUnarchiveClick = () => {
    setConfirmDialog({
      open: true,
      action: "unarchive",
      tutor: selectedTutor,
    });
    handleCloseContextMenu();
  };

  const handleConfirmAction = async () => {
    const { action, tutor } = confirmDialog;

    try {
      if (action === "archive") {
        const tutorRef = doc(db, "tutors", tutor.id);
        const tutorSnap = await getDoc(tutorRef);

        if (!tutorSnap.exists()) {
          toast.error("Tutor not found");
          return;
        }

        const tutorData = tutorSnap.data();

        const archivedRef = doc(db, "archivedTutors", tutor.id);
        await setDoc(archivedRef, {
          ...tutorData,
          archivedAt: new Date().toISOString(),
        });

        await deleteDoc(tutorRef);

        toast.success(`${tutor.firstName} ${tutor.lastName} has been archived`);

        queryClient.invalidateQueries({ queryKey: ["tutors"] });
        queryClient.invalidateQueries({ queryKey: ["archivedTutors"] });
      } else if (action === "unarchive") {
        const archivedRef = doc(db, "archivedTutors", tutor.id);
        const archivedSnap = await getDoc(archivedRef);

        if (!archivedSnap.exists()) {
          toast.error("Archived tutor not found");
          return;
        }

        const tutorData = archivedSnap.data();

        const { archivedAt, ...activeTutorData } = tutorData;
        const tutorRef = doc(db, "tutors", tutor.id);
        await setDoc(tutorRef, activeTutorData);

        await deleteDoc(archivedRef);

        toast.success(
          `${tutor.firstName} ${tutor.lastName} has been unarchived`
        );

        queryClient.invalidateQueries({ queryKey: ["tutors"] });
        queryClient.invalidateQueries({ queryKey: ["archivedTutors"] });
      }
    } catch (error) {
      toast.error(`Failed to ${action} tutor: ${error.message}`);
    }

    setConfirmDialog({ open: false, action: null, tutor: null });
  };

  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
      setSearchQuery("");
    }
  };

  const baseRows = viewMode === "active" ? activeTutors : archivedTutors;
  const isLoading = viewMode === "active" ? loadingActive : loadingArchived;

  const rows = baseRows
    .filter((tutor) => {
      if (!searchQuery.trim()) return true;
      const fullName = `${tutor.firstName || ""} ${
        tutor.lastName || ""
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
      field: "avatar",
      headerName: "",
      width: 80,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Avatar
            src={params.value}
            sx={{ width: 40, height: 40, bgcolor: params.row.tutorColor }}
          />
        </Box>
      ),
    },
    {
      field: "fullName",
      headerName: "Name",
      width: 200,
      valueGetter: (value, row) =>
        `${row.firstName || ""} ${row.lastName || ""}`,
    },
    { field: "wiseMindsEmail", headerName: "Email", width: 200 },
    { field: "role", headerName: "Role", width: 100 },
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
          onClick={() => navigate(`/tutor/${params.row.id}`)}
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
        <Header title="TUTORS" subtitle="View all tutors" />

        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          {isHeadTutorOrAbove ? (
            <Button
              onClick={() => navigate("/newtutor")}
              variant="contained"
              sx={{
                backgroundColor: `${colors.orangeAccent[700]}`,
                fontSize: "1.3em",
              }}
            >
              <Typography variant="h6">NEW</Typography>
            </Button>
          ) : (
            <Box />
          )}

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size="small"
          >
            <ToggleButton value="active">
              Active
              <Chip label={activeTutors.length} size="small" sx={{ ml: 1 }} />
            </ToggleButton>
            <ToggleButton value="archived">
              Archived
              {archivedTutors.length > 0 && (
                <Chip
                  label={archivedTutors.length}
                  size="small"
                  sx={{ ml: 1 }}
                />
              )}
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "flex-end"}}>
        <TextField
          placeholder="Search tutors"
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
                  const tutor = rows.find((r) => r.id === rowId);
                  if (tutor) {
                    handleContextMenu(event, tutor);
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
            <ListItemText>Archive Tutor</ListItemText>
          </MenuItem>
        ) : (
          <MenuItem onClick={handleUnarchiveClick}>
            <ListItemText>Unarchive Tutor</ListItemText>
          </MenuItem>
        )}
      </Menu>

      <Dialog
        open={confirmDialog.open}
        onClose={() =>
          setConfirmDialog({ open: false, action: null, tutor: null })
        }
      >
        <DialogTitle>
          {confirmDialog.action === "archive"
            ? "Archive Tutor?"
            : "Unarchive Tutor?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialog.action === "archive" ? (
              <>
                Are you sure you want to archive{" "}
                <strong>
                  {confirmDialog.tutor?.firstName}{" "}
                  {confirmDialog.tutor?.lastName}
                </strong>
                ? They will be moved to the archived list and won't appear in
                lesson forms or other active lists.
              </>
            ) : (
              <>
                Are you sure you want to unarchive{" "}
                <strong>
                  {confirmDialog.tutor?.firstName}{" "}
                  {confirmDialog.tutor?.lastName}
                </strong>
                ? They will be restored to the active tutors list.
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setConfirmDialog({ open: false, action: null, tutor: null })
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

export default TutorList;
