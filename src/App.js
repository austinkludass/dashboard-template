import { useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import {
  CssBaseline,
  ThemeProvider,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { ColorModeContext, useMode } from "./theme";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { AuthContext } from "./context/AuthContext";
import { ROLES } from "./utils/permissions";
import ProtectedRoute from "./components/Global/ProtectedRoute";
import Dashboard from "./scenes/dashboard/Dashboard";
import Settings from "./scenes/Settings/Settings";
import Navigation, { TopbarDesktop } from "./scenes/global/Navigation";
import Login from "./scenes/login/Login";
import LessonList from "./scenes/Lesson/LessonList";
import CalendarPage from "./scenes/Lesson/CalendarPage";

// Global app configuration
const config = {
  appName: "Dashboard Template Web App",
  canSignup: true,
  pages: [
    {
      name: "Dashboard",
      path: "/",
      page: <Dashboard />,
      protected: false,
    },
    {
      name: "Calendar",
      path: "/calendar",
      page: <CalendarPage />,
      protected: false,
    },
    {
      name: "Lessons",
      path: "/lessons",
      page: <LessonList />,
      protected: false,
    },
    {
      name: "Settings",
      path: "/settings",
      page: <Settings />,
      protected: false,
    },
  ],
};

function AppLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <div className="app">
      <Navigation />
      <main
        className="content"
        style={{
          paddingTop: isMobile ? "56px" : "0",
        }}
      >
        <TopbarDesktop />
        <Routes>
          {config.pages.map((page) =>
            page.protected ? (
              <Route
                key={page.path}
                path={page.path}
                element={
                  <ProtectedRoute
                    minimumRole={page.minimumRole}
                    fallbackMessage={`You need to have ${page.minimumRole} role to access this page.`}
                  >
                    {page.page}
                  </ProtectedRoute>
                }
              />
            ) : (
              <Route key={page.path} path={page.path} element={page.page} />
            ),
          )}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  const [theme, colorMode] = useMode();
  const { currentUser } = useContext(AuthContext);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <BrowserRouter>
            {currentUser ? (
              <AppLayout />
            ) : (
              <Routes>
                <Route
                  path="*"
                  element={
                    <Login
                      appName={config.appName}
                      allowSignup={config.canSignup}
                    />
                  }
                />
              </Routes>
            )}
          </BrowserRouter>
        </ThemeProvider>
      </ColorModeContext.Provider>
    </LocalizationProvider>
  );
}

export default App;
