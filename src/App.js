import Login from "./scenes/login/Login";
import Topbar from "./scenes/global/Topbar";
import Sidebar from "./scenes/global/Sidebar";
import Dashboard from "./scenes/dashboard/Dashboard";
import TutorList from "./scenes/Tutor/TutorList";
import NewTutor from "./scenes/Tutor/NewTutor";
import TutorProfile from "./scenes/Tutor/TutorProfile";
import StudentList from "./scenes/Student/StudentList";
import NewStudent from "./scenes/Student/NewStudent";
import StudentProfile from "./scenes/Student/StudentProfile";
import SubjectList from "./scenes/Subject/SubjectList";
import TutoringBayList from "./scenes/Location/TutoringBayList";
import LessonList from "./scenes/Lesson/LessonList";
import Settings from "./scenes/Settings/Settings";
import ReportBug from "./scenes/Other/ReportBug";
import CalendarPage from "./scenes/Lesson/CalendarPage";
import FamilyPage from "./scenes/Student/FamilyPage";
import InvoicesPage from "./scenes/Invoicing/InvoicesPage";
import PayrollPage from "./scenes/Payroll/PayrollPage";
import AdditionalHoursPage from "./scenes/Payroll/AdditionalHoursPage";
import ParentIntake from "./scenes/Intake/ParentIntake";
import ExistingFamilyIntake from "./scenes/Intake/ExistingFamilyIntake";
import ProtectedRoute from "./components/Global/ProtectedRoute";
import { ROLES } from "./utils/permissions";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { ColorModeContext, useMode } from "./theme";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { AuthContext } from "./context/AuthContext";
import { useContext } from "react";

function App() {
  const [theme, colorMode] = useMode();
  const { currentUser } = useContext(AuthContext);

  const AppShell = ({ children }) => {
    const location = useLocation();
    const hideSidebar =
      location.pathname.startsWith("/new-family") ||
      location.pathname.startsWith("/existing-family");

    return (
      <div className="app">
        {!hideSidebar && <Sidebar />}
        <main className="content">
          {!hideSidebar && <Topbar />}
          {children}
        </main>
      </div>
    );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <BrowserRouter>
            {currentUser ? (
              <AppShell>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/tutors" element={<TutorList />} />
                  <Route
                    path="/newtutor"
                    element={
                      <ProtectedRoute
                        minimumRole={ROLES.HEAD_TUTOR}
                        fallbackMessage="You need to be a Head Tutor or above to create new tutors."
                      >
                        <NewTutor />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/tutor/:tutorId" element={<TutorProfile />} />
                  <Route path="/students" element={<StudentList />} />
                  <Route path="/student/:studentId" element={<StudentProfile />} />
                  <Route path="/newstudent" element={<NewStudent />} />
                  <Route path="/families" element={<FamilyPage />} />
                  <Route path="/subjects" element={<SubjectList />} />
                  <Route path="/tutoringbays" element={<TutoringBayList />} />
                  <Route path="/lessons" element={<LessonList />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/reportbug" element={<ReportBug />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route
                    path="/invoices"
                    element={
                      <ProtectedRoute
                        minimumRole={ROLES.HEAD_TUTOR}
                        fallbackMessage="You need to be a Head Tutor or above to access invoices."
                      >
                        <InvoicesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/payroll"
                    element={
                      <ProtectedRoute
                        minimumRole={ROLES.HEAD_TUTOR}
                        fallbackMessage="You need to be a Head Tutor or above to access payroll."
                      >
                        <PayrollPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/new-family" element={<ParentIntake />} />
                  <Route
                    path="/existing-family/:familyId"
                    element={<ExistingFamilyIntake />}
                  />
                  <Route path="/existing-family" element={<ExistingFamilyIntake />} />
                  <Route path="/additionalhours" element={<AdditionalHoursPage />} />
                  {/* <Route path="/intake" element={<ParentIntake />} /> */}
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </AppShell>
            ) : (
              <Routes>
                <Route path="/" element={<Login appName="Dashboard" allowSignup />} />
                <Route path="/new-family" element={<ParentIntake />} />
                <Route
                  path="/existing-family/:familyId"
                  element={<ExistingFamilyIntake />}
                />
                <Route path="/existing-family" element={<ExistingFamilyIntake />} />
                <Route path="*" element={<Login appName="Dashboard" allowSignup />} />
              </Routes>
            )}
          </BrowserRouter>
        </ThemeProvider>
      </ColorModeContext.Provider>
    </LocalizationProvider>
  );
}

export default App;
