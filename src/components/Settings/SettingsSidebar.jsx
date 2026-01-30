import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  useTheme,
} from "@mui/material";
import SecurityIcon from "@mui/icons-material/Security";
import SettingsIcon from "@mui/icons-material/Settings";
import NotificationsIcon from "@mui/icons-material/Notifications";
import PersonIcon from "@mui/icons-material/Person";
import IntegrationInstructionsIcon from "@mui/icons-material/IntegrationInstructions";
import StorageIcon from "@mui/icons-material/Storage";

const allTabs = [
  { key: "profile", label: "Profile", icon: <PersonIcon /> },
  { key: "permissions", label: "Permissions", icon: <SecurityIcon /> },
  {
    key: "integrations",
    label: "Integrations",
    icon: <IntegrationInstructionsIcon />,
  },
  { key: "general", label: "General", icon: <SettingsIcon /> },
  { key: "notifications", label: "Notifications", icon: <NotificationsIcon /> },
  { key: "data", label: "Data", icon: <StorageIcon /> },
];

const SettingsSidebar = ({ selected, onSelect, availableTabs = [] }) => {
  const theme = useTheme();
  const visibleTabs = allTabs.filter((tab) => availableTabs.includes(tab.key));

  return (
    <Box
      sx={{
        width: "220px",
        borderRight: `1px solid ${theme.palette.divider}`,
        flexShrink: 0,
        display: { xs: "none", md: "block" },
      }}
    >
      <List>
        {visibleTabs.map((tab) => (
          <ListItemButton
            key={tab.key}
            selected={selected === tab.key}
            onClick={() => onSelect(tab.key)}
            sx={{
              borderRadius: "8px",
              mx: 1,
              my: 0.5,
            }}
          >
            <ListItemIcon>{tab.icon}</ListItemIcon>
            <ListItemText primary={tab.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
};

export default SettingsSidebar;
