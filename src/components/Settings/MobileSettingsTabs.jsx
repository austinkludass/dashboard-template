import { Box, Tabs, Tab } from "@mui/material";

const tabLabels = {
  profile: "Profile",
  permissions: "Permissions",
  integrations: "Integrations",
  general: "General",
  notifications: "Notifications",
  data: "Data",
};

const MobileSettingsTabs = ({ selected, onSelect, availableTabs = [] }) => {
  const tabIndex = availableTabs.indexOf(selected);

  const handleChange = (e, newIndex) => {
    onSelect(availableTabs[newIndex]);
  };

  return (
    <Box
      sx={{
        display: { xs: "block", md: "none" },
        mb: 2,
      }}
    >
      <Tabs
        value={tabIndex >= 0 ? tabIndex : 0}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons
        allowScrollButtonsMobile
      >
        {availableTabs.map((tabKey) => (
          <Tab key={tabKey} label={tabLabels[tabKey] || tabKey} />
        ))}
      </Tabs>
    </Box>
  );
};

export default MobileSettingsTabs;
