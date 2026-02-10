import { useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { ColorModeContext, useMode } from "./theme";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { AuthContext } from "./context/AuthContext";
import { ROLES } from "./utils/permissions";
import ProtectedRoute from "./components/Global/ProtectedRoute";
import Dashboard from "./scenes/dashboard/Dashboard";
import Settings from "./scenes/Settings/Settings";
import Sidebar from "./scenes/global/Sidebar";
import Topbar from "./scenes/global/Topbar";
import Login from "./scenes/login/Login";

// Global app configuration
const config = {
  appName: "Dashboard Template Web App",
  canSignup: true,
  pages: [
    { name: "Dashboard", path: "/", page: <Dashboard /> },
    { name: "Settings", path: "/settings", page: <Settings /> },
  ],
};

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
              <div className="app">
                <Sidebar />
                <main className="content">
                  <Topbar />
                  <Routes>
                    {config.pages.map((page) => (
                      <Route
                        key={page.path}
                        path={page.path}
                        element={page.page}
                      />
                    ))}
                    <Route path="*" element={<Navigate to="/" />} />
                    {/* Protected route */}
                    {/* <Route
                      path="/protectedpage"
                      element={
                        <ProtectedRoute
                          minimumRole={ROLES.HEAD_TUTOR}
                          fallbackMessage="You need to have this roll to access this page."
                        >
                          <SomePage />
                        </ProtectedRoute>
                      }
                    /> */}
                  </Routes>
                </main>
              </div>
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
