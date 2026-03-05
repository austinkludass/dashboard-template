import {
  Box,
  IconButton,
  useTheme,
  Menu,
  MenuItem,
  Autocomplete,
  TextField,
  Typography,
  Drawer,
  useMediaQuery,
  Tooltip,
  Divider,
  Collapse,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import React, { useContext, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { ColorModeContext, tokens } from "../../theme";
import { AuthContext } from "../../context/AuthContext";

// Icons
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import SearchIcon from "@mui/icons-material/Search";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import CorporateFareOutlinedIcon from "@mui/icons-material/CorporateFareOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CloseIcon from "@mui/icons-material/Close";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const SIDEBAR_WIDTH = 260;
const SIDEBAR_COLLAPSED_WIDTH = 72;

const searchOptions = [
  { label: "Additional Hours", task: "", path: "/additionalhours" },
  { label: "Calendar", task: "", path: "/calendar" },
  { label: "Dashboard", task: "", path: "/home" },
  { label: "Families", task: "", path: "/families" },
  { label: "Home", task: "", path: "/home" },
  { label: "Invoices", task: "", path: "/invoices" },
  { label: "Lessons", task: "", path: "/lessons" },
  { label: "Locations", task: "", path: "/tutoringbays" },
  { label: "Payroll", task: "", path: "/payroll" },
  { label: "Report Bug", task: "", path: "/reportbug" },
  { label: "Settings", task: "", path: "/settings" },
  { label: "Students", task: "", path: "/students" },
  { label: "Students", task: "Add New", path: "/newstudent" },
  { label: "Subjects", task: "Curriculums", path: "/subjects?tab=curriculums" },
  { label: "Subjects", task: "Subject Groups", path: "/subjects?tab=groups" },
  {
    label: "Subjects",
    task: "Ungrouped Subjects",
    path: "/subjects?tab=ungrouped",
  },
  { label: "Tutoring Bays", task: "", path: "/tutoringbays" },
  { label: "Tutors", task: "", path: "/tutors" },
  { label: "Tutors", task: "Add New", path: "/newtutor" },
];

const NavItem = ({ title, to, icon, selected, onSelect, isCollapsed }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isActive = selected === title;

  return (
    <Tooltip title={isCollapsed ? title : ""} placement="right">
      <ListItemButton
        component={Link}
        to={to}
        onClick={() => onSelect(title)}
        selected={isActive}
        sx={{
          borderRadius: "6px",
          mx: 1,
          mb: 0.25,
          minHeight: 44,
          justifyContent: isCollapsed ? "center" : "flex-start",
          px: isCollapsed ? 1 : 2,
          "&.Mui-selected": {
            backgroundColor: `${colors.orangeAccent[400]}22`,
            color: colors.orangeAccent[400],
            "& .MuiListItemIcon-root": { color: colors.orangeAccent[400] },
          },
          "&.Mui-selected:hover": {
            backgroundColor: `${colors.orangeAccent[400]}33`,
          },
          "&:hover": {
            backgroundColor: `${colors.orangeAccent[400]}18`,
            color: colors.orangeAccent[400],
            "& .MuiListItemIcon-root": { color: colors.orangeAccent[400] },
          },
          color: colors.grey[100],
          transition: "all 0.15s ease",
        }}
      >
        {icon && (
          <ListItemIcon
            sx={{
              minWidth: 0,
              mr: isCollapsed ? 0 : 1.5,
              color: isActive ? colors.orangeAccent[400] : colors.grey[100],
              justifyContent: "center",
            }}
          >
            {icon}
          </ListItemIcon>
        )}
        {!isCollapsed && (
          <ListItemText
            primary={title}
            slotProps={{
              primary: {
                fontSize: 14,
              },
            }}
          />
        )}
      </ListItemButton>
    </Tooltip>
  );
};

const NavGroup = ({ title, icon, children, isCollapsed }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  if (isCollapsed) {
    return (
      <>
        <Tooltip title={title} placement="right">
          <ListItemButton
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{
              borderRadius: "6px",
              mx: 1,
              mb: 0.25,
              minHeight: 44,
              justifyContent: "center",
              px: 1,
              color: Boolean(anchorEl)
                ? colors.orangeAccent[400]
                : colors.grey[100],
              backgroundColor: Boolean(anchorEl)
                ? `${colors.orangeAccent[400]}18`
                : "transparent",
              "& .MuiListItemIcon-root": {
                color: Boolean(anchorEl) ? colors.orangeAccent[400] : "inherit",
              },
              "&:hover": {
                backgroundColor: `${colors.orangeAccent[400]}18`,
                color: colors.orangeAccent[400],
                "& .MuiListItemIcon-root": { color: colors.orangeAccent[400] },
              },
            }}
          >
            <ListItemIcon
              sx={{ minWidth: 0, color: "inherit", justifyContent: "center" }}
            >
              {icon}
            </ListItemIcon>
          </ListItemButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
          slotProps={{
            paper: {
              sx: {
                ml: 0.5,
                backgroundColor: colors.primary[400],
                boxShadow: "4px 4px 16px rgba(0,0,0,0.25)",
                borderRadius: "8px",
                minWidth: 180,
              },
            },
          }}
        >
          <Typography
            variant="caption"
            sx={{
              px: 2,
              py: 0.75,
              display: "block",
              color: colors.orangeAccent[400],
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontSize: "0.7rem",
            }}
          >
            {title}
          </Typography>
          <Divider sx={{ mb: 0.5 }} />
          {React.Children.map(children, (child) =>
            React.cloneElement(child, {
              isCollapsed: false,
              onSelect: (...args) => {
                setAnchorEl(null);
                child.props.onSelect?.(...args);
              },
            }),
          )}
        </Menu>
      </>
    );
  }

  return (
    <>
      <ListItemButton
        onClick={() => setOpen(!open)}
        sx={{
          borderRadius: "6px",
          mx: 1,
          mb: 0.25,
          minHeight: 44,
          px: 2,
          color: colors.grey[100],
          "&:hover": {
            backgroundColor: `${colors.orangeAccent[400]}18`,
            color: colors.orangeAccent[400],
            "& .MuiListItemIcon-root": { color: colors.orangeAccent[400] },
          },
          transition: "all 0.15s ease",
        }}
      >
        <ListItemIcon sx={{ minWidth: 0, mr: 1.5, color: "inherit" }}>
          {icon}
        </ListItemIcon>
        <ListItemText
          primary={title}
          slotProps={{
            primary: {
              fontSize: 14,
            },
          }}
        />
        {open ? (
          <ExpandLessIcon fontSize="small" />
        ) : (
          <ExpandMoreIcon fontSize="small" />
        )}
      </ListItemButton>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List disablePadding sx={{ pl: 1 }}>
          {children}
        </List>
      </Collapse>
    </>
  );
};

const SidebarContent = ({ isCollapsed, setIsCollapsed, onClose }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const location = useLocation();

  const getSelectedFromPath = (path) => {
    if (path === "/") return "Dashboard";
    if (path === "/settings") return "Settings";
    if (path === "/calendar") return "Calendar";
    if (path === "/lessons") return "Lessons";
    return "Dashboard";
  };

  const [selected, setSelected] = useState(
    getSelectedFromPath(location.pathname),
  );

  const handleSelect = (title) => {
    setSelected(title);
    if (onClose) onClose();
  };

  return (
    <Box
      sx={{
        width: isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: colors.primary[400],
        transition: "width 0.2s ease",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <Box
        display="flex"
        alignItems="center"
        justifyContent={isCollapsed ? "center" : "flex-end"}
        px={isCollapsed ? 0 : 1}
        py={1}
        sx={{ flexShrink: 0 }}
      >
        {onClose ? (
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        ) : (
          <IconButton onClick={() => setIsCollapsed(!isCollapsed)}>
            <MenuOutlinedIcon />
          </IconButton>
        )}
      </Box>

      {!isCollapsed && (
        <>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            mt={1}
            sx={{ flexShrink: 0 }}
          >
            <img
              alt="Wise Minds Logo"
              width={100}
              height={100}
              src={"../../assets/dashboardlogo_small.png"}
              loading="lazy"
            />
          </Box>
          <Box textAlign="center" mt={1} mb={1} sx={{ flexShrink: 0 }}>
            <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">
              Dashplately
            </Typography>
            <Typography variant="h5" color={colors.orangeAccent[400]} pb={2}>
              Admin
            </Typography>
          </Box>
        </>
      )}

      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          "&::-webkit-scrollbar": { width: "4px" },
          "&::-webkit-scrollbar-thumb": {
            background: colors.grey[700],
            borderRadius: "4px",
          },
        }}
      >
        <List disablePadding>
          <NavItem
            title="Dashboard"
            to="/"
            icon={<HomeOutlinedIcon fontSize="small" />}
            selected={selected}
            onSelect={handleSelect}
            isCollapsed={isCollapsed}
          />
          <NavGroup
            title="Tutoring"
            icon={<CalendarMonthOutlinedIcon fontSize="small" />}
            isCollapsed={isCollapsed}
          >
            <NavItem
              title="Calendar"
              to="/calendar"
              selected={selected}
              onSelect={handleSelect}
              isCollapsed={false}
            />
            <NavItem
              title="Lessons"
              to="/lessons"
              selected={selected}
              onSelect={handleSelect}
              isCollapsed={false}
            />
          </NavGroup>
          <NavGroup
            title="Administration"
            icon={<PeopleAltOutlinedIcon fontSize="small" />}
            isCollapsed={isCollapsed}
          >
            <NavItem
              title="Tutors"
              to="/tutors"
              selected={selected}
              onSelect={handleSelect}
              isCollapsed={false}
            />
            <NavItem
              title="Students"
              to="/students"
              selected={selected}
              onSelect={handleSelect}
              isCollapsed={false}
            />
            <NavItem
              title="Families"
              to="/families"
              selected={selected}
              onSelect={handleSelect}
              isCollapsed={false}
            />
            <NavItem
              title="Invoices"
              to="/invoices"
              selected={selected}
              onSelect={handleSelect}
              isCollapsed={false}
            />
            <NavItem
              title="Payroll"
              to="/payroll"
              selected={selected}
              onSelect={handleSelect}
              isCollapsed={false}
            />
          </NavGroup>
          <NavGroup
            title="Curriculum"
            icon={<MenuBookOutlinedIcon fontSize="small" />}
            isCollapsed={isCollapsed}
          >
            <NavItem
              title="Subjects"
              to="/subjects"
              selected={selected}
              onSelect={handleSelect}
              isCollapsed={false}
            />
            <NavItem
              title="Feedback"
              to="/feedback"
              selected={selected}
              onSelect={handleSelect}
              isCollapsed={false}
            />
            <NavItem
              title="Wise Courses"
              to="/wisecourses"
              selected={selected}
              onSelect={handleSelect}
              isCollapsed={false}
            />
          </NavGroup>
          <NavGroup
            title="New forms 2026"
            icon={<DescriptionOutlinedIcon fontSize="small" />}
            isCollapsed={isCollapsed}
          >
            <NavItem
              title="New Family"
              to="/new-family"
              selected={selected}
              onSelect={handleSelect}
              isCollapsed={false}
            />
            <NavItem
              title="Existing Family"
              to="/existing-family"
              selected={selected}
              onSelect={handleSelect}
              isCollapsed={false}
            />
          </NavGroup>
          <NavGroup
            title="Belconnen"
            icon={<CorporateFareOutlinedIcon fontSize="small" />}
            isCollapsed={isCollapsed}
          >
            <NavItem
              title="Tutoring Bays"
              to="/tutoringbays"
              selected={selected}
              onSelect={handleSelect}
              isCollapsed={false}
            />
          </NavGroup>
          <NavItem
            title="Settings"
            to="/settings"
            icon={<SettingsOutlinedIcon fontSize="small" />}
            selected={selected}
            onSelect={handleSelect}
            isCollapsed={isCollapsed}
          />
        </List>
      </Box>
    </Box>
  );
};

const Navigation = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);
  const { dispatch, currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState(null);
  const mobileMenuOpen = Boolean(mobileMenuAnchorEl);

  const handleProfile = () => {
    if (currentUser?.uid) navigate(`/tutor/${currentUser.uid}`);
    setMobileMenuAnchorEl(null);
  };

  const handleSettings = () => {
    navigate("/settings");
    setMobileMenuAnchorEl(null);
  };

  const handleHome = () => {
    navigate("/");
    setMobileMenuAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch({ type: "LOGOUT" });
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (isMobile) {
    return (
      <>
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          zIndex={1200}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          px={1}
          py={0.5}
          sx={{ backgroundColor: colors.primary[400], boxShadow: 2 }}
        >
          <IconButton onClick={() => setDrawerOpen(true)}>
            <MenuOutlinedIcon />
          </IconButton>
          <Typography
            variant="h6"
            color={colors.grey[100]}
            fontWeight="bold"
            noWrap
          >
            Dashplately
          </Typography>
          <IconButton onClick={(e) => setMobileMenuAnchorEl(e.currentTarget)}>
            <MoreVertIcon />
          </IconButton>
          <Menu
            anchorEl={mobileMenuAnchorEl}
            open={mobileMenuOpen}
            onClose={() => setMobileMenuAnchorEl(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <MenuItem onClick={handleHome}>
              <HomeOutlinedIcon fontSize="small" sx={{ mr: 1 }} /> Home
            </MenuItem>
            <MenuItem onClick={handleProfile}>
              <PersonOutlinedIcon fontSize="small" sx={{ mr: 1 }} /> Profile
            </MenuItem>
            <MenuItem onClick={colorMode.toggleColorMode}>
              {theme.palette.mode === "dark" ? (
                <>
                  <LightModeOutlinedIcon fontSize="small" sx={{ mr: 1 }} />{" "}
                  Light Mode
                </>
              ) : (
                <>
                  <DarkModeOutlinedIcon fontSize="small" sx={{ mr: 1 }} /> Dark
                  Mode
                </>
              )}
            </MenuItem>
            <MenuItem onClick={handleSettings}>
              <SettingsOutlinedIcon fontSize="small" sx={{ mr: 1 }} /> Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <Typography color="error">Logout</Typography>
            </MenuItem>
          </Menu>
        </Box>

        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          PaperProps={{
            sx: { background: colors.primary[400], border: "none" },
          }}
        >
          <SidebarContent
            isCollapsed={false}
            setIsCollapsed={() => {}}
            onClose={() => setDrawerOpen(false)}
          />
        </Drawer>
      </>
    );
  }

  return (
    <Box sx={{ position: "sticky", top: 0, height: "100vh", flexShrink: 0 }}>
      <SidebarContent
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />
    </Box>
  );
};

export const TopbarDesktop = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);
  const { dispatch, currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [settingsAnchorEl, setSettingsAnchorEl] = useState(null);
  const settingsOpen = Boolean(settingsAnchorEl);

  const handleLogout = () => {
    dispatch({ type: "LOGOUT" });
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleProfile = () => {
    if (currentUser?.uid) navigate(`/tutor/${currentUser.uid}`);
  };

  if (isMobile) return null;

  return (
    <Box
      position="sticky"
      top={0}
      zIndex={1000}
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      p={2}
      sx={{ backgroundColor: colors.primary[500] }}
    >
      <Box
        display="flex"
        alignItems="center"
        sx={{
          width: "300px",
          backgroundColor: colors.primary[400],
          borderRadius: "3px",
          padding: "6px",
        }}
      >
        <Autocomplete
          freeSolo
          openOnFocus={false}
          sx={{ flex: 1 }}
          options={searchOptions}
          getOptionLabel={(option) =>
            option.task && option.task.trim() !== ""
              ? `${option.label}: ${option.task}`
              : option.label
          }
          filterOptions={(options, state) =>
            state.inputValue.length === 0
              ? []
              : options.filter((o) =>
                  `${o.label} ${o.task}`
                    .toLowerCase()
                    .includes(state.inputValue.toLowerCase()),
                )
          }
          onChange={(_, value) => {
            if (value?.path) navigate(value.path);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="standard"
              placeholder="Search…"
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

      <Box display="flex" alignItems="center" gap={0.5}>
        <Tooltip title="Home">
          <IconButton onClick={() => navigate("/")}>
            <HomeOutlinedIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Profile">
          <IconButton onClick={() => handleProfile}>
            <PersonOutlinedIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Toggle theme">
          <IconButton onClick={colorMode.toggleColorMode}>
            {theme.palette.mode === "dark" ? (
              <LightModeOutlinedIcon />
            ) : (
              <DarkModeOutlinedIcon />
            )}
          </IconButton>
        </Tooltip>

        <Tooltip title="Settings">
          <IconButton onClick={(e) => setSettingsAnchorEl(e.currentTarget)}>
            <SettingsOutlinedIcon />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={settingsAnchorEl}
          open={settingsOpen}
          onClose={() => setSettingsAnchorEl(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <MenuItem
            onClick={() => {
              navigate("/reportbug");
              setSettingsAnchorEl(null);
            }}
          >
            Report Bug
          </MenuItem>
          <MenuItem
            onClick={() => {
              navigate("/settings");
              setSettingsAnchorEl(null);
            }}
          >
            Settings
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <Typography color="error">Logout</Typography>
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};

export default Navigation;
