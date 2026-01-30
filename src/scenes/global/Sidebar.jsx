import { Box, IconButton, Typography, useTheme } from "@mui/material";
import { ProSidebar, Menu, MenuItem, SubMenu } from "react-pro-sidebar";
import { SettingsOutlined } from "@mui/icons-material";
import { useState } from "react";
import { tokens } from "../../theme";
import { Link } from "react-router-dom";
import CorporateFareOutlinedIcon from "@mui/icons-material/CorporateFareOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import OwlFacts from "../../components/Global/OwlFacts";
import "react-pro-sidebar/dist/css/styles.css";

const Item = ({ title, to, icon, selected, setSelected }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  return (
    <MenuItem
      active={selected === title}
      style={{ color: colors.grey[100] }}
      onClick={() => setSelected(title)}
      icon={icon}
    >
      <Typography>{title}</Typography>
      <Link to={to} />
    </MenuItem>
  );
};

const Sidebar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selected, setSelected] = useState("Dashboard");

  return (
    <Box
      sx={{
        height: "100vh",
        "& .pro-sidebar-inner": {
          background: `${colors.primary[400]} !important`,
        },
        "& .pro-icon-wrapper": {
          backgroundColor: "transparent !important",
        },
        "& .pro-inner-item": {
          padding: "5px 35px 5px 20px !important",
        },
        "& .pro-inner-item:hover": {
          color: `${colors.orangeAccent[400]} !important`,
        },
        "& .pro-menu-item.active": {
          color: `${colors.orangeAccent[400]} !important`,
        },
        "& .pro-inner-item:focus": {
          color: `${colors.textColor[400]} !important`,
        },
        "& .pro-arrow": {
          display: "none !important",
        },
        "& .pro-sidebar .pro-menu > ul > .pro-sub-menu > .pro-inner-list-item":
          {
            backgroundColor: "transparent !important",
          },
        "& .pro-sidebar .pro-menu > ul > .pro-sub-menu > .pro-inner-list-item > div > ul":
          {
            paddingY: "4px !important",
          },
        "& .pro-sidebar.collapsed .pro-menu > ul > .pro-menu-item.pro-sub-menu > .pro-inner-list-item > .popper-inner":
          {
            backgroundColor: `${colors.primary[500]} !important`,
            borderRadius: "0px 8px 8px 0px",
            border: `4px solid ${colors.primary[400]}`,
          },
      }}
    >
      <ProSidebar collapsed={isCollapsed} style={{ height: "100%" }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          <Box
            sx={{
              flexShrink: 0,
              px: 2,
              py: 2,
            }}
          >
            <Box
              display="flex"
              justifyContent={isCollapsed ? "center" : "flex-end"}
              alignItems="center"
              mb={isCollapsed ? 0 : 2}
            >
              <IconButton onClick={() => setIsCollapsed(!isCollapsed)}>
                <MenuOutlinedIcon />
              </IconButton>
            </Box>

            {!isCollapsed && (
              <>
                <Box display="flex" justifyContent="center" alignItems="center">
                  <OwlFacts />
                </Box>
                <Box textAlign="center" mt={1}>
                  <Typography
                    variant="h2"
                    color={colors.grey[100]}
                    fontWeight="bold"
                  >
                    Wise Minds
                  </Typography>
                  <Typography variant="h5" color={colors.orangeAccent[400]}>
                    Admin
                  </Typography>
                </Box>
              </>
            )}
          </Box>

          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              pr: 1,
              "&::-webkit-scrollbar": { width: "6px" },
            }}
          >
            <Menu iconShape="square">
              <Item
                title="Dashboard"
                to="/"
                icon={<HomeOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <SubMenu
                title="Tutoring"
                icon={<CalendarMonthOutlinedIcon />}
                style={{ color: colors.grey[100] }}
              >
                <Item
                  title="Calendar"
                  to="/calendar"
                  selected={selected}
                  setSelected={setSelected}
                />
                <Item
                  title="Lessons"
                  to="/lessons"
                  selected={selected}
                  setSelected={setSelected}
                />
              </SubMenu>
              <SubMenu
                title="Administration"
                icon={<PeopleAltOutlinedIcon />}
                style={{ color: colors.grey[100] }}
              >
                <Item
                  title="Tutors"
                  to="/tutors"
                  selected={selected}
                  setSelected={setSelected}
                />
                <Item
                  title="Tutor Absences"
                  to="/tutorabsences"
                  selected={selected}
                  setSelected={setSelected}
                />
                <Item
                  title="Students"
                  to="/students"
                  selected={selected}
                  setSelected={setSelected}
                />
                <Item
                  title="Student Absences"
                  to="/studentabsences"
                  selected={selected}
                  setSelected={setSelected}
                />
                <Item
                  title="Families"
                  to="/families"
                  selected={selected}
                  setSelected={setSelected}
                />
                <Item
                  title="Invoices"
                  to="/invoices"
                  selected={selected}
                  setSelected={setSelected}
                />
                <Item
                  title="Payroll"
                  to="/payroll"
                  selected={selected}
                  setSelected={setSelected}
                />
                <Item
                  title="Additional Hours"
                  to="/additionalhours"
                  selected={selected}
                  setSelected={setSelected}
                />
              </SubMenu>
              <SubMenu
                title="Teaching"
                icon={<MenuBookOutlinedIcon />}
                style={{ color: colors.grey[100] }}
              >
                <Item
                  title="Subjects"
                  to="/subjects"
                  selected={selected}
                  setSelected={setSelected}
                />
                <Item
                  title="Feedback"
                  to="/feedback"
                  selected={selected}
                  setSelected={setSelected}
                />
                <Item
                  title="Wise Courses"
                  to="/wisecourses"
                  selected={selected}
                  setSelected={setSelected}
                />
              </SubMenu>
              <SubMenu
                title="New forms 2026"
                icon={<DescriptionOutlinedIcon />}
                style={{ color: colors.grey[100] }}
              >
                <Item
                  title="New Family"
                  to="/new-family"
                  selected={selected}
                  setSelected={setSelected}
                />
                <Item
                  title="Existing Family"
                  to="/existing-family"
                  selected={selected}
                  setSelected={setSelected}
                />
              </SubMenu>
              <SubMenu
                title="Belconnen"
                icon={<CorporateFareOutlinedIcon />}
                style={{ color: colors.grey[100] }}
              >
                <Item
                  title="Tutoring Bays"
                  to="/tutoringbays"
                  selected={selected}
                  setSelected={setSelected}
                />
              </SubMenu>
              <Item
                title="Settings"
                to="/settings"
                icon={<SettingsOutlined />}
                selected={selected}
                setSelected={setSelected}
              />
            </Menu>
          </Box>
        </Box>
      </ProSidebar>
    </Box>
  );
};

export default Sidebar;
