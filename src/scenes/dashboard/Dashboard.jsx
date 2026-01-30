import { Box, useTheme, useMediaQuery } from "@mui/material";
import { tokens } from "../../theme";
import usePermissions from "../../hooks/usePermissions";
import UpcomingLessons from "../../components/Dashboard/UpcomingLessons";
import Notifications from "../../components/Dashboard/Notifications";
import Summaryboard from "../../components/Dashboard/Summaryboard";
import Noticeboard from "../../components/Dashboard/Noticeboard";
import StatsCard from "../../components/Dashboard/StatsCard";
import Header from "../../components/Global/Header";

const Dashboard = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { canViewStatsCards } = usePermissions();

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="DASHBOARD" subtitle="Welcome to Wise Minds Admin" />
      </Box>

      <Box
        display="grid"
        gridTemplateColumns={isMobile ? "1fr" : "repeat(12, 1fr)"}
        gridTemplateRows={
          isMobile
            ? canViewStatsCards
              ? "repeat(5, 300px) 600px repeat(3, 300px)"
              : "repeat(5, 300px) 600px"
            : canViewStatsCards
            ? "200px 90vh 200px"
            : "200px 90vh"
        }
        gap="20px"
      >
        <Box
          gridColumn={isMobile ? "span 1" : "span 4"}
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          overflow="hidden"
        >
          <Notifications />
        </Box>

        <Box
          gridColumn={isMobile ? "span 1" : "span 4"}
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          overflow="hidden"
        >
          <Summaryboard />
        </Box>

        <Box
          gridColumn={isMobile ? "span 1" : "span 4"}
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          overflow="hidden"
        >
          <Summaryboard />
        </Box>

        <Box
          gridColumn={isMobile ? "span 1" : "span 6"}
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          overflow="hidden"
        >
          <UpcomingLessons />
        </Box>

        <Box
          gridColumn={isMobile ? "span 1" : "span 6"}
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          overflow="hidden"
        >
          <Noticeboard />
        </Box>

        {canViewStatsCards && (
          <>
            <Box
              gridColumn={isMobile ? "span 1" : "span 4"}
              bgcolor={colors.primary[400]}
              overflow="hidden"
              height="100%"
            >
              <StatsCard field="lessons" color={colors.orangeAccent[700]} />
            </Box>

            <Box
              gridColumn={isMobile ? "span 1" : "span 4"}
              bgcolor={colors.primary[400]}
              overflow="hidden"
              height="100%"
            >
              <StatsCard field="students" color={colors.orangeAccent[700]} />
            </Box>

            <Box
              gridColumn={isMobile ? "span 1" : "span 4"}
              bgcolor={colors.primary[400]}
              overflow="hidden"
              height="100%"
            >
              <StatsCard field="tutors" color={colors.orangeAccent[700]} />
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default Dashboard;
