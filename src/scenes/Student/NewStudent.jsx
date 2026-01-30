import { useCallback, useState } from "react";
import {
  Paper,
  Typography,
  Stack,
  Button,
  Box,
  useTheme,
  LinearProgress,
  Grid2 as Grid,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { tokens } from "../../theme";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { toast, ToastContainer } from "react-toastify";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../../data/firebase";
import { useNavigate } from "react-router-dom";
import AvailabilityFormatter from "../../utils/AvailabilityFormatter";
import Header from "../../components/Global/Header";
import StudentGeneralInfo from "../../components/student/StudentGeneralInfo";
import StudentFamilyInfo from "../../components/student/StudentFamilyInfo";
import StudentEmergencyInfo from "../../components/student/StudentEmergencyInfo";
import StudentAcademicInfo from "../../components/student/StudentAcademicInfo";
import StudentAdditionalInfo from "../../components/student/StudentAdditionalInfo";
import StudentTrialInfo from "../../components/student/StudentTrialInfo";
import StudentAvailabilityInfo from "../../components/student/StudentAvailabilityInfo";
import StudentAdminInfo from "../../components/student/StudentAdminInfo";
import "dayjs/locale/en-gb";

const NewStudent = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [trialAvailability, setTrialAvailability] = useState({});
  const [availability, setAvailability] = useState({});
  const [subjects, setSubjects] = useState([]);

  const isFormValid = () => {
    return (
      generalInfo.firstName && familyInfo.familyPhone && familyInfo.familyEmail
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // firebase api send to DB
    if (!isFormValid()) {
      setTouched({
        firstName: true,
        familyPhone: true,
        familyEmail: true,
      });
      toast.error("Complete all required fields");
      return;
    }

    setLoading(true);
    setUploadProgress(30);

    try {
      await addDoc(collection(db, "students"), {
        firstName: generalInfo.firstName,
        middleName: generalInfo.middleName,
        lastName: generalInfo.lastName,
        dateOfBirth: generalInfo.dateOfBirth?.toISOString() || null,
        allergiesAna: generalInfo.allergiesAna,
        allergiesNonAna: generalInfo.allergiesNonAna,
        doesCarryEpi: generalInfo.doesCarryEpi,
        doesAdminEpi: generalInfo.doesAdminEpi,
        familyPhone: familyInfo.familyPhone,
        familyEmail: familyInfo.familyEmail,
        familyAddress: familyInfo.familyAddress,
        emergencyFirst: emergencyInfo.emergencyFirst,
        emergencyLast: emergencyInfo.emergencyLast,
        emergencyRelationship: emergencyInfo.emergencyRelationship,
        emergencyPhone: emergencyInfo.emergencyPhone,
        school: academicInfo.school,
        yearLevel: academicInfo.yearLevel,
        notes: academicInfo.notes,
        canOfferFood: additionalInfo.canOfferFood,
        avoidFoods: additionalInfo.avoidFoods,
        questions: additionalInfo.questions,
        maxHoursPerDay: additionalInfo.maxHoursPerDay,
        howUserHeard: additionalInfo.howUserHeard,
        preferredStart: trialInfo.preferredStart?.toISOString() || null,
        trialAvailability: AvailabilityFormatter(trialAvailability),
        availability: AvailabilityFormatter(availability),
        subjects: subjects,
        homeLocation: adminInfo.homeLocation,
        baseRate: adminInfo.baseRate,
      });
      setUploadProgress(100);

      toast.success("Successfully added student!");
      navigate("/students");
    } catch (error) {
      toast.error("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const [touched, setTouched] = useState({
    firstName: false,
    familyPhone: false,
    familyEmail: false,
  });

  const [generalInfo, setGeneralInfo] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirth: null,
    allergiesAna: "",
    allergiesNonAna: "",
    doesCarryEpi: false,
    doesAdminEpi: false,
  });

  const [familyInfo, setFamilyInfo] = useState({
    familyPhone: "",
    familyEmail: "",
    familyAddress: "",
  });

  const [emergencyInfo, setEmergencyInfo] = useState({
    emergencyFirst: "",
    emergencyLast: "",
    emergencyRelationship: "",
    emergencyPhone: "",
  });

  const [academicInfo, setAcademicInfo] = useState({
    school: "",
    yearLevel: "",
    notes: "",
  });

  const [additionalInfo, setAdditionalInfo] = useState({
    canOfferFood: true,
    avoidFoods: "",
    questions: "",
    maxHoursPerDay: "",
    howUserHeard: "",
  });

  const [trialInfo, setTrialInfo] = useState({
    preferredStart: null,
  });

  const [adminInfo, setAdminInfo] = useState({
    homeLocation: null,
    baseRate: null,
  });

  const setGeneralInfoCallback = useCallback(
    (info) => setGeneralInfo(info),
    []
  );

  const setFamilyInfoCallback = useCallback((info) => setFamilyInfo(info), []);
  const setEmergencyInfoCallback = useCallback(
    (info) => setEmergencyInfo(info),
    []
  );

  const setAcademicInfoCallback = useCallback(
    (info) => setAcademicInfo(info),
    []
  );

  const setAdditionalInfoCallback = useCallback(
    (info) => setAdditionalInfo(info),
    []
  );

  const setTrialInfoCallback = useCallback((info) => setTrialInfo(info), []);

  const setAdminInfoCallback = useCallback((info) => setAdminInfo(info), []);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
      <Box display="flex" m="20px">
        <Header title="NEW STUDENT" subtitle="Enter details for new student" />
      </Box>

      <Paper
        variant="outlined"
        sx={{ p: 3, maxWidth: 1000, minWidth: 600, m: 4 }}
      >
        <Typography variant="body1">
          Welcome to the new student form. This form covers a variety of core
          information required for the student to get started at Wise Minds!
          Please fill out this form to the best of your knowledge and do not
          hesitate to reach out if you have any questions.
        </Typography>
      </Paper>

      {/* General Info */}
      <Paper sx={{ p: 3, maxWidth: 1000, minWidth: 600, m: 4 }}>
        <Stack spacing={2}>
          <Typography variant="h4">General Student Information</Typography>
          <StudentGeneralInfo
            formData={generalInfo}
            setFormData={setGeneralInfoCallback}
            touched={touched}
            setTouched={setTouched}
            isEdit={true}
          />
        </Stack>
      </Paper>

      {/* Family Info */}
      <Paper sx={{ p: 3, maxWidth: 1000, minWidth: 600, m: 4 }}>
        <Stack spacing={2}>
          <Typography variant="h4">Family Information</Typography>
          <StudentFamilyInfo
            formData={familyInfo}
            setFormData={setFamilyInfoCallback}
            touched={touched}
            setTouched={setTouched}
            isEdit={true}
          />
        </Stack>
      </Paper>

      {/* Emergency Info */}
      <Paper sx={{ p: 3, maxWidth: 1000, minWidth: 600, m: 4 }}>
        <Stack spacing={2}>
          <Typography variant="h4">Emergency Contact</Typography>
          <StudentEmergencyInfo
            formData={emergencyInfo}
            setFormData={setEmergencyInfoCallback}
            touched={touched}
            setTouched={setTouched}
            isEdit={true}
          />
        </Stack>
      </Paper>

      {/* Academic Info */}
      <Paper sx={{ p: 3, maxWidth: 1000, minWidth: 600, m: 4 }}>
        <Stack spacing={2}>
          <Typography variant="h4">Academic Information</Typography>
          <StudentAcademicInfo
            formData={academicInfo}
            setFormData={setAcademicInfoCallback}
            isEdit={true}
            subjects={subjects}
            setSubjects={setSubjects}
          />
        </Stack>
      </Paper>

      {/* Trial Info */}
      <Paper sx={{ p: 3, maxWidth: 1000, minWidth: 600, m: 4 }}>
        <Stack spacing={2}>
          <Typography variant="h4">Trial Session</Typography>
          <Typography variant="body2" color="text.secondary">
            The trial session at Wise Minds runs for 45 minutes followed by 10
            minutes of direct conversation with you regarding how the session
            went. This session gives your child one-on-one time with the tutor
            we think would be best. This session is usually completed as a{" "}
            <strong>one-off session</strong> before organising regular, weekly
            sessions (as such, availability may be different).
          </Typography>
          <Typography variant="h6" color={colors.orangeAccent[400]}>
            Available times for trial session
          </Typography>
          <StudentTrialInfo
            formData={trialInfo}
            setFormData={setTrialInfoCallback}
            isEdit={true}
            trialAvailability={trialAvailability}
            setTrialAvailability={setTrialAvailability}
          />
        </Stack>
      </Paper>

      {/* Availability Info */}
      <Paper sx={{ p: 3, maxWidth: 1000, minWidth: 600, m: 4 }}>
        <Stack spacing={2}>
          <Typography variant="h4">Regular Availability</Typography>
          <Typography variant="body2" color="text.secondary">
            The regular availability is the times that your child is available
            on a weekly basis for tutoring. This will influence our tutor
            selection. The more availability you have, the better chance we
            find the best possible tutor!
          </Typography>
          <StudentAvailabilityInfo
            isEdit={true}
            availability={availability}
            setAvailability={setAvailability}
          />
        </Stack>
      </Paper>

      {/* Additional Info */}
      <Paper sx={{ p: 3, maxWidth: 1000, minWidth: 600, m: 4 }}>
        <Stack spacing={2}>
          <Typography variant="h4">Additional Information</Typography>
          <StudentAdditionalInfo
            formData={additionalInfo}
            setFormData={setAdditionalInfoCallback}
            isEdit={true}
          />
        </Stack>
      </Paper>

      {/* Admin Info */}
      <Paper sx={{ p: 3, maxWidth: 1000, minWidth: 600, m: 4 }}>
        <Stack spacing={2}>
          <Typography variant="h4">Admin Information</Typography>
          <StudentAdminInfo
            formData={adminInfo}
            setFormData={setAdminInfoCallback}
            isEdit={true}
          />
        </Stack>
      </Paper>

      <Grid
        container
        justifyContent="flex-end"
        sx={{ alignItems: "center", m: 5 }}
      >
        {loading && (
          <LinearProgress
            variant="determinate"
            value={uploadProgress}
            sx={{ width: "50%", marginRight: 4 }}
          />
        )}
        <Button
          loading={loading}
          onClick={handleSubmit}
          variant="contained"
          color="primary"
        >
          <Typography variant="h4">Submit</Typography>
        </Button>
      </Grid>

      <ToastContainer position="top-right" autoClose={3000} />
    </LocalizationProvider>
  );
};

export default NewStudent;
