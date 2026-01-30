import { useState, useEffect } from "react";
import { Box, useTheme } from "@mui/material";
import usePermissions from "../../hooks/usePermissions";
import Header from "../../components/Global/Header";
import PermissionsTab from "../../components/Settings/PermissionsTab";
import IntegrationsTab from "../../components/Settings/IntegrationsTab";
import ProfileTab from "../../components/Settings/ProfileTab";
import SettingsSidebar from "../../components/Settings/SettingsSidebar";
import MobileSettingsTabs from "../../components/Settings/MobileSettingsTabs";
import DataTab from "../../components/Settings/DataTab";

const Settings = () => {
  const theme = useTheme();
  const { isAdmin, canAccessIntegrations, canEditPermissions, loading } =
    usePermissions();

  const getAvailableTabs = () => {
    const tabs = [];

    tabs.push("profile");

    tabs.push("permissions");

    if (canAccessIntegrations) {
      tabs.push("integrations");
    }

    tabs.push("general");
    tabs.push("notifications");

    if (isAdmin) {
      tabs.push("data");
    }

    return tabs;
  };

  const availableTabs = getAvailableTabs();
  const [selectedTab, setSelectedTab] = useState("profile");

  useEffect(() => {
    if (!loading && !availableTabs.includes(selectedTab)) {
      setSelectedTab(availableTabs[0] || "profile");
    }
  }, [availableTabs, selectedTab, loading]);

  const renderTab = () => {
    switch (selectedTab) {
      case "profile":
        return <ProfileTab />;
      case "permissions":
        return <PermissionsTab canEdit={canEditPermissions} />;
      case "integrations":
        return canAccessIntegrations ? <IntegrationsTab /> : null;
      case "general":
        return <Box></Box>;
      case "notifications":
        return <Box></Box>;
      case "data":
        return isAdmin ? <DataTab /> : null;
      default:
        return null;
    }
  };

  return (
    <Box display="flex" m="20px" flexDirection="column">
      <Header title="SETTINGS" subtitle="Wise Minds Admin Settings" />

      <Box display="flex" mt={3} gap={2}>
        <SettingsSidebar
          selected={selectedTab}
          onSelect={setSelectedTab}
          availableTabs={availableTabs}
        />

        <Box flex={1}>
          <MobileSettingsTabs
            selected={selectedTab}
            onSelect={setSelectedTab}
            availableTabs={availableTabs}
          />

          {renderTab()}
        </Box>
      </Box>
    </Box>
  );
};

export default Settings;
