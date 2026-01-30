import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Button,
  Typography,
  useTheme,
  CircularProgress,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { db } from "../../data/firebase";
import { tokens } from "../../theme";
import { ToastContainer, toast } from "react-toastify";
import dayjs from "dayjs";
import Header from "../../components/Global/Header";
import Section from "../../components/Global/Section";
import StudentGeneralInfo from "../../components/student/StudentGeneralInfo";
import StudentFamilyInfo from "../../components/student/StudentFamilyInfo";
import StudentEmergencyInfo from "../../components/student/StudentEmergencyInfo";
import StudentAcademicInfo from "../../components/student/StudentAcademicInfo";
import StudentTrialInfo from "../../components/student/StudentTrialInfo";
import StudentAvailabilityInfo from "../../components/student/StudentAvailabilityInfo";
import StudentAdditionalInfo from "../../components/student/StudentAdditionalInfo";
import StudentAdminInfo from "../../components/student/StudentAdminInfo";
import AvailabilityFormatter from "../../utils/AvailabilityFormatter";

const StudentProfile = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [availability, setAvailability] = useState({});
  const [trialAvailability, setTrialAvailability] = useState({});
  const [forms, setForms] = useState({});
  const [editState, setEditState] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const dateFields = ["dateOfBirth", "preferredStart"];

  const setForm = (key, value) =>
    setForms((prev) => ({ ...prev, [key]: value }));
  const toggleEdit = (key, state) =>
    setEditState((prev) => ({ ...prev, [key]: state }));

  const formConfigs = {
    general: {
      title: "General Student Information",
      component: StudentGeneralInfo,
      fields: [
        "firstName",
        "middleName",
        "lastName",
        "dateOfBirth",
        "allergiesAna",
        "doesCarryEpi",
        "doesAdminEpi",
        "allergiesNonAna",
      ],
    },
    family: {
      title: "Family Information",
      component: StudentFamilyInfo,
      fields: ["familyPhone", "familyEmail", "familyAddress"],
    },
    emergency: {
      title: "Emergency Contact",
      component: StudentEmergencyInfo,
      fields: [
        "emergencyFirst",
        "emergencyLast",
        "emergencyRelationship",
        "emergencyPhone",
      ],
    },
    academic: {
      title: "Academic Information",
      component: StudentAcademicInfo,
      fields: ["school", "yearLevel", "notes"],
      extraProps: { subjects, setSubjects },
    },
    trial: {
      title: "Trial Session",
      component: StudentTrialInfo,
      fields: ["preferredStart"],
      extraProps: { trialAvailability, setTrialAvailability },
    },
    availability: {
      title: "Regular Availability",
      component: StudentAvailabilityInfo,
      fields: [],
      extraProps: { availability, setAvailability },
    },
    additional: {
      title: "Additional Information",
      component: StudentAdditionalInfo,
      fields: [
        "canOfferFood",
        "avoidFoods",
        "questions",
        "maxHoursPerDay",
        "howUserHeard",
      ],
    },
    admin: {
      title: "Admin Information",
      component: StudentAdminInfo,
      fields: ["homeLocation", "baseRate", "discount", "credit"],
    },
  };

  useEffect(() => {
    const fetchStudent = async () => {
      if (!studentId) return;
      const studentRef = doc(db, "students", studentId);
      const studentSnap = await getDoc(studentRef);
      if (!studentSnap.exists()) return;

      const data = studentSnap.data();
      setStudent(data);
      setSubjects(data.subjects || []);
      setAvailability(data.availability || {});
      setTrialAvailability(data.trialAvailability || {});

      const initialForms = {};
      for (const key in formConfigs) {
        initialForms[key] = {};
        formConfigs[key].fields.forEach((f) => {
          const value = data[f];
          if (f === "discount" || f === "credit") {
            initialForms[key][f] = value || null;
          } else if (f.toLowerCase().includes("date") && value) {
            initialForms[key][f] = dayjs(value);
          } else {
            initialForms[key][f] = value ?? "";
          }
        });
      }
      setForms(initialForms);
    };

    fetchStudent();
  }, [studentId]);

  const handleSave = async (key) => {
    const studentRef = doc(db, "students", studentId);
    const payload = { ...forms[key] };

    if (payload.dateOfBirth)
      payload.dateOfBirth = payload.dateOfBirth.toISOString();
    if (payload.preferredStart)
      payload.preferredStart = payload.preferredStart.toISOString();

    if (key === "academic") {
      payload.subjects = subjects;
    } else if (key === "trial") {
      payload.trialAvailability = AvailabilityFormatter(trialAvailability);
    } else if (key === "availability") {
      payload.availability = AvailabilityFormatter(availability);
    }

    if (key === "admin") {
      if (!payload.discount || !payload.discount.type) {
        payload.discount = null;
      }
      if (!payload.credit || !payload.credit.type) {
        payload.credit = null;
      }
    }

    try {
      await updateDoc(studentRef, payload);
      toast.success("Successfully updated student");
    } catch (error) {
      toast.error("Error updating student: " + error.message);
    }
    setStudent((prev) => ({ ...prev, ...payload }));
    toggleEdit(key, false);
  };

  const handleCancel = (key) => {
    const resetData = {};
    formConfigs[key].fields.forEach((f) => {
      const value = student[f];
      if (f === "discount" || f === "credit") {
        resetData[f] = value || null;
      } else if (dateFields.includes(f) && value) {
        resetData[f] = dayjs(value);
      } else {
        resetData[f] = value ?? "";
      }
    });
    setForm(key, resetData);
    toggleEdit(key, false);

    if (key === "academic") {
      setSubjects(student.subjects);
    }
    if (key === "availability") {
      setAvailability(student.availability);
    }
    if (key === "trial") {
      setTrialAvailability(student.trialAvailability);
    }
  };

  if (!student) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        <CircularProgress size={60} thickness={2} />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
      <Box display="flex" m="20px">
        <Header
          title={`${student.firstName} ${student.lastName}`}
          subtitle={`Year ${student.yearLevel}`}
        />
      </Box>

      {Object.entries(formConfigs).map(([key, config]) => {
        const Component = config.component;
        const isEdit = editState[key];
        return (
          <Section
            key={key}
            title={config.title}
            actions={
              isEdit ? (
                <Box display="flex" gap={1}>
                  <Button variant="contained" onClick={() => handleSave(key)}>
                    Save
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleCancel(key)}
                  >
                    Cancel
                  </Button>
                </Box>
              ) : (
                <Button
                  variant="outlined"
                  onClick={() => toggleEdit(key, true)}
                >
                  Edit
                </Button>
              )
            }
          >
            {key === "trial" && (
              <Typography variant="h6" color={colors.orangeAccent[400]}>
                Available times for trial session
              </Typography>
            )}
            <Component
              formData={forms[key]}
              setFormData={(v) => setForm(key, v)}
              isEdit={!!isEdit}
              touched={touchedFields}
              setTouched={setTouchedFields}
              {...(config.extraProps || {})}
            />
          </Section>
        );
      })}
      <ToastContainer position="top-right" autoClose={3000} />
    </LocalizationProvider>
  );
};

export default StudentProfile;
