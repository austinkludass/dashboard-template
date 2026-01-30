import {
  Box,
  IconButton,
  useTheme,
  Menu,
  MenuItem,
  Autocomplete,
  TextField,
  Typography,
} from "@mui/material";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ColorModeContext, tokens } from "../../theme";
import { AuthContext } from "../../context/AuthContext";
import { HomeOutlined } from "@mui/icons-material";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import ArrowForwardIosOutlinedIcon from "@mui/icons-material/ArrowForwardIosOutlined";
import SearchIcon from "@mui/icons-material/Search";

const searchOptions = [
  { label: "Additional Hours", task: "", path: "/additionalhours" },
  { label: "Calendar", task: "", path: "/calendar" },
  { label: "Dashboard", task: "", path: "/home" },
  { label: "Families", task: "", path: "/families"},
  { label: "Home", task: "", path: "/home" },
  { label: "Invoices", task: "", path: "/invoices"},
  { label: "Lessons", task: "", path: "/lessons" },
  { label: "Locations", task: "", path: "/tutoringbays" },
  { label: "Payroll", task: "", path: "/payroll" },
  { label: "Report Bug", task: "", path: "/reportbug" },
  { label: "Settings", task: "", path: "/settings" },
  { label: "Students", task: "", path: "/students" },
  { label: "Students", task: "Add New", path: "/newstudent" },
  { label: "Subjects", task: "Curriculums", path: "/subjects?tab=curriculums" },
  { label: "Subjects", task: "Subject Groups", path: "/subjects?tab=groups" },
  { label: "Subjects", task: "Ungrouped Subjects", path: "/subjects?tab=ungrouped" },
  { label: "Tutoring Bays", task: "", path: "/tutoringbays"},
  { label: "Tutors", task: "", path: "/tutors" },
  { label: "Tutors", task: "Add New", path: "/newtutor" },
];

const Topbar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);
  const { dispatch } = useContext(AuthContext);
  const navigate = useNavigate();

  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState(null);
  const profileOpen = Boolean(profileAnchorEl);
  const settingsOpen = Boolean(settingsAnchorEl);

  const handleProfileClick = (event) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleSettingsClick = (event) => {
    setSettingsAnchorEl(event.currentTarget);
  };

  const handleProfileClose = () => {
    setProfileAnchorEl(null);
  };

  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch({ type: "LOGOUT" });
    localStorage.removeItem("user");
    navigate("/login");
    handleProfileClose();
  };

  const { currentUser } = useContext(AuthContext);

  const handleProfile = () => {
    if (currentUser?.uid) {
      navigate(`/tutor/${currentUser.uid}`);
    }
    handleProfileClose();
  };

  const handleReport = () => {
    navigate("/reportbug");
    handleSettingsClose();
  };

  const handleSettings = () => {
    navigate("/settings");
    handleSettingsClose();
  };

  return (
    <Box
      position="sticky"
      backgroundColor={colors.primary[500]}
      top={0}
      zIndex={1000}
      display="flex"
      justifyContent="space-between"
      p={2}
    >
      <Box
        display="flex"
        alignItems="center"
        flexGrow="0"
        width="300px"
        backgroundColor={colors.primary[400]}
        borderRadius="3px"
        padding="6px"
      >
        <Autocomplete
          freeSolo
          openOnFocus={false}
          sx={{ flex: "1" }}
          options={searchOptions}
          getOptionLabel={(option) =>
            option.task && option.task.trim() !== ""
              ? `${option.label}: ${option.task}`
              : option.label
          }
          filterOptions={(options, state) =>
            state.inputValue.length === 0
              ? []
              : options.filter(
                  (o) =>
                    o.label
                      .toLowerCase()
                      .includes(state.inputValue.toLowerCase()) ||
                    (o.task &&
                      o.task
                        .toLowerCase()
                        .includes(state.inputValue.toLowerCase()))
                )
          }
          onChange={(event, newValue) => {
            if (newValue?.path) {
              navigate(newValue.path);
            }
          }}
          renderOption={(props, option) => (
            <li {...props} key={`${option.label}-${option.task || "none"}`}>
              <Box display="flex" alignItems="center">
                <Typography component="span" fontWeight="bold">
                  {option.label}
                </Typography>

                {option.task && option.task.trim() !== "" && (
                  <Box
                    display="flex"
                    alignItems="center"
                    ml={0.5}
                    color="text.secondary"
                  >
                    <ArrowForwardIosOutlinedIcon
                      sx={{ fontSize: 12, mr: 0.3 }}
                    />
                    <Typography component="span">{option.task}</Typography>
                  </Box>
                )}
              </Box>
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="standard"
              placeholder="Search..."
              slotProps={{
                input: {
                  ...params.InputProps,
                  disableUnderline: true,
                  startAdornment: <SearchIcon sx={{ mr: 1 }} />,
                },
              }}
            />
          )}
        />
      </Box>

      <Box display="flex">
        <IconButton onClick={() => navigate("/")}>
          <HomeOutlined />
        </IconButton>
        <IconButton onClick={handleProfileClick}>
          <PersonOutlinedIcon />
        </IconButton>
        <Menu
          anchorEl={profileAnchorEl}
          open={profileOpen}
          onClose={handleProfileClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
        >
          <MenuItem onClick={handleProfile}>Profile</MenuItem>
          <MenuItem onClick={handleLogout}>
            <Typography color={colors.redAccent[400]}>Logout</Typography>
          </MenuItem>
        </Menu>
        <IconButton onClick={colorMode.toggleColorMode}>
          {theme.palette.mode === "dark" ? (
            <DarkModeOutlinedIcon />
          ) : (
            <LightModeOutlinedIcon />
          )}
        </IconButton>
        <IconButton onClick={handleSettingsClick}>
          <SettingsOutlinedIcon />
        </IconButton>
        <Menu
          anchorEl={settingsAnchorEl}
          open={settingsOpen}
          onClose={handleSettingsClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
        >
          <MenuItem onClick={handleReport}>Report Bug</MenuItem>
          <MenuItem onClick={handleSettings}>Settings</MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};

export default Topbar;
