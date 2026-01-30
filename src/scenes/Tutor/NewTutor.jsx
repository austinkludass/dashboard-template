import { useState, useCallback } from "react";
import {
  Paper,
  Typography,
  Stack,
  Button,
  Box,
  LinearProgress,
} from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { useColor } from "react-color-palette";
import { app, sb } from "../../data/firebase";
import { useNavigate } from "react-router-dom";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFunctions, httpsCallable } from "firebase/functions";
import Grid from "@mui/material/Grid2";
import Header from "../../components/Global/Header";
import AvailabilitySelector from "../../components/Tutor/AvailabilitySelector";
import UnavailabilitySelector from "../../components/Tutor/UnavailabilitySelector";
import TutorProfileInfo from "../../components/Tutor/TutorProfileInfo";
import TutorLoginInfo from "../../components/Tutor/TutorLoginInfo";
import TutorContactInfo from "../../components/Tutor/TutorContactInfo";
import TutorPersonalInfo from "../../components/Tutor/TutorPersonalInfo";
import TutorEmergencyInfo from "../../components/Tutor/TutorEmergencyInfo";
import TutorBankInfo from "../../components/Tutor/TutorBankInfo";
import TutorWWVPInfo from "../../components/Tutor/TutorWWVPInfo";
import TutorFirstAidInfo from "../../components/Tutor/TutorFirstAidInfo";
import TutorPoliceCheckInfo from "../../components/Tutor/TutorPoliceCheckInfo";
import TutorBlockedStudents from "../../components/Tutor/TutorBlockedStudents";
import TutorCapabilities from "../../components/Tutor/TutorCapabilities";
import AvailabilityFormatter from "../../utils/AvailabilityFormatter";
import "react-toastify/dist/ReactToastify.css";
import "dayjs/locale/en-gb";

const functions = getFunctions(app, "australia-southeast1");

const NewTutor = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [specificUnavailability, setSpecificUnavailability] = useState([]);
  const [availability, setAvailability] = useState({});
  const [profilePic, setProfilePic] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [tutorColor, setTutorColor] = useColor("#6E6E6E");
  const [wwvpFile, setWwvpFile] = useState(null);
  const [firstAidFile, setFirstAidFile] = useState(null);
  const [policeCheckFile, setPoliceCheckFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [capabilityIds, setCapabilityIds] = useState([]);
  const [blockedStudentIds, setBlockedStudentIds] = useState([]);

  const [touched, setTouched] = useState({
    firstName: false,
    wiseMindsEmail: false,
    password: false,
    secondPassword: false,
  });

  const [profileInfo, setProfileInfo] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirth: null,
  });

  const [loginInfo, setLoginInfo] = useState({
    wiseMindsEmail: "",
    password: "",
    secondPassword: "",
  });

  const [contactInfo, setContactInfo] = useState({
    personalEmail: "",
    phone: "",
    address: "",
  });

  const [personalInfo, setPersonalInfo] = useState({
    career: "",
    degree: "",
    position: "",
    homeLocation: "",
    role: "Tutor",
    hours: [0, 20],
    rate: "",
  });

  const [emergencyInfo, setEmergencyInfo] = useState({
    emergencyName: "",
    emergencyRelationship: "",
    emergencyPhone: "",
    emergencyEmail: "",
  });

  const [bankInfo, setBankInfo] = useState({
    bankName: "",
    accountName: "",
    bsb: "",
    accountNumber: "",
    tfn: "",
    superCompany: "",
  });

  const [wwvpInfo, setWwvpInfo] = useState({
    wwvpName: "",
    wwvpRegNumber: "",
    wwvpCardNumber: "",
    wwvpExpiry: null,
  });

  const [firstAidInfo, setFirstAidInfo] = useState({
    faCourseDate: null,
    faProvider: "",
    faNumber: "",
    faCourseType: "",
    faCourseCode: "",
    faExpiry: null,
  });

  const [policeCheckInfo, setPoliceCheckInfo] = useState({
    pcName: "",
    pcIsNational: false,
    pcAddress: "",
    pcResult: "",
    pcAPPRef: "",
  });

  const isFormValid = () => {
    return (
      profileInfo.firstName &&
      loginInfo.wiseMindsEmail &&
      loginInfo.password &&
      loginInfo.secondPassword
    );
  };

  const setProfileInfoCallback = useCallback(
    (info) => setProfileInfo(info),
    []
  );
  const setLoginInfoCallback = useCallback((info) => setLoginInfo(info), []);
  const setContactInfoCallback = useCallback(
    (info) => setContactInfo(info),
    []
  );
  const setPersonalInfoCallback = useCallback(
    (info) => setPersonalInfo(info),
    []
  );
  const setEmergencyInfoCallback = useCallback(
    (info) => setEmergencyInfo(info),
    []
  );
  const setBankInfoCallback = useCallback((info) => setBankInfo(info), []);
  const setWWVPInfoCallback = useCallback((info) => setWwvpInfo(info), []);
  const setFirstAidInfoCallback = useCallback(
    (info) => setFirstAidInfo(info),
    []
  );
  const setPoliceCheckInfoCallback = useCallback(
    (info) => setPoliceCheckInfo(info),
    []
  );

  const uploadFileToFirebase = async (file, path) => {
    if (!file) return null;
    const storageRef = ref(sb, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  const uploadProfileImage = (userId) =>
    uploadFileToFirebase(profilePic, `profilePictures/${userId}`);
  const uploadWwvpFile = (userId) =>
    uploadFileToFirebase(wwvpFile, `wwvpFiles/${userId}`);
  const uploadFirstAidFile = (userId) =>
    uploadFileToFirebase(firstAidFile, `firstAidFiles/${userId}`);
  const uploadPoliceCheckFile = (userId) =>
    uploadFileToFirebase(policeCheckFile, `policeCheckFiles/${userId}`);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid()) {
      setTouched({
        firstName: true,
        wiseMindsEmail: true,
        password: true,
        secondPassword: true,
      });
      toast.error("Complete all required fields");
      return;
    }

    if (loginInfo.password !== loginInfo.secondPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    setUploadProgress(10);

    try {
      const reserveTutor = httpsCallable(functions, "reserveTutor");
      const finalizeTutor = httpsCallable(functions, "finalizeTutor");
      const { data } = await reserveTutor({
        email: loginInfo.wiseMindsEmail,
        password: loginInfo.password,
      });

      const tutorId = data.uid;
      setUploadProgress(30);

      const [avatarUrl, wwvpFileUrl, firstAidFileUrl, policeCheckFileUrl] =
        await Promise.all([
          uploadProfileImage(tutorId),
          uploadWwvpFile(tutorId),
          uploadFirstAidFile(tutorId),
          uploadPoliceCheckFile(tutorId),
        ]);

      setUploadProgress(60);

      await finalizeTutor({
        uid: tutorId,
        tutorData: {
          avatar: avatarUrl,
          wwvpFilePath: wwvpFileUrl,
          firstAidFilePath: firstAidFileUrl,
          policeCheckFilePath: policeCheckFileUrl,
          tutorColor: tutorColor.hex,
          availability: AvailabilityFormatter(availability),
          unavailability: specificUnavailability,
          capabilities: capabilityIds,
          blockedStudents: blockedStudentIds,
          firstName: profileInfo.firstName,
          middleName: profileInfo.middleName,
          lastName: profileInfo.lastName,
          dateOfBirth: profileInfo.dateOfBirth?.toISOString() || null,
          wiseMindsEmail: loginInfo.wiseMindsEmail,
          personalEmail: contactInfo.personalEmail,
          phone: contactInfo.phone,
          address: contactInfo.address,
          career: personalInfo.career,
          degree: personalInfo.degree,
          position: personalInfo.position,
          homeLocation: personalInfo.homeLocation,
          role: personalInfo.role,
          hours: personalInfo.hours,
          rate: personalInfo.rate,
          emergencyName: emergencyInfo.emergencyName,
          emergencyRelationship: emergencyInfo.emergencyRelationship,
          emergencyPhone: emergencyInfo.emergencyPhone,
          emergencyEmail: emergencyInfo.emergencyEmail,
          bankName: bankInfo.bankName,
          accountName: bankInfo.accountName,
          bsb: bankInfo.bsb,
          accountNumber: bankInfo.accountNumber,
          tfn: bankInfo.tfn,
          superCompany: bankInfo.superCompany,
          wwvpName: wwvpInfo.wwvpName,
          wwvpRegNumber: wwvpInfo.wwvpRegNumber,
          wwvpCardNumber: wwvpInfo.wwvpCardNumber,
          wwvpExpiry: wwvpInfo.wwvpExpiry?.toISOString() || null,
          faCourseDate: firstAidInfo.faCourseDate?.toISOString() || null,
          faProvider: firstAidInfo.faProvider,
          faNumber: firstAidInfo.faNumber,
          faCourseType: firstAidInfo.faCourseType,
          faCourseCode: firstAidInfo.faCourseCode,
          faExpiry: firstAidInfo.faExpiry?.toISOString() || null,
          pcName: policeCheckInfo.pcName,
          pcIsNational: policeCheckInfo.pcIsNational,
          pcAddress: policeCheckInfo.pcAddress,
          pcResult: policeCheckInfo.pcResult,
          pcAPPRef: policeCheckInfo.pcAPPRef,
        },
      });
      setUploadProgress(100);

      toast.success("Successfully added tutor!");
      navigate("/tutors");
    } catch (error) {
      toast.error("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
      <Box display="flex" m="20px">
        <Header title="NEW TUTOR" subtitle="Enter details for a new tutor" />
      </Box>

      <Paper sx={{ p: 3, maxWidth: 1000, minWidth: 600, m: 4 }}>
        <TutorProfileInfo
          formData={profileInfo}
          setFormData={setProfileInfoCallback}
          tutorColor={tutorColor}
          setTutorColor={setTutorColor}
          profilePic={profilePic}
          setProfilePic={setProfilePic}
          profilePicPreview={profilePicPreview}
          setProfilePicPreview={setProfilePicPreview}
          touched={touched}
          setTouched={setTouched}
          isEdit={true}
        />
      </Paper>

      <Paper sx={{ p: 3, maxWidth: 1000, minWidth: 600, m: 4 }}>
        <TutorLoginInfo
          formData={loginInfo}
          setFormData={setLoginInfoCallback}
          touched={touched}
          setTouched={setTouched}
        />
      </Paper>

      <Paper sx={{ p: 3, maxWidth: 1000, minWidth: 600, m: 4 }}>
        <Stack spacing={4}>
          <TutorContactInfo
            formData={contactInfo}
            setFormData={setContactInfoCallback}
            isEdit={true}
          />
          <TutorPersonalInfo
            formData={personalInfo}
            setFormData={setPersonalInfoCallback}
            isEdit={true}
          />
          <TutorEmergencyInfo
            formData={emergencyInfo}
            setFormData={setEmergencyInfoCallback}
            isEdit={true}
          />
          <TutorBankInfo
            formData={bankInfo}
            setFormData={setBankInfoCallback}
            isEdit={true}
          />
          <TutorWWVPInfo
            formData={wwvpInfo}
            setFormData={setWWVPInfoCallback}
            wwvpFile={wwvpFile}
            setWwvpFile={setWwvpFile}
            isEdit={true}
          />
          <TutorFirstAidInfo
            formData={firstAidInfo}
            setFormData={setFirstAidInfoCallback}
            firstAidFile={firstAidFile}
            setFirstAidFile={setFirstAidFile}
            isEdit={true}
          />
          <TutorPoliceCheckInfo
            formData={policeCheckInfo}
            setFormData={setPoliceCheckInfoCallback}
            policeCheckFile={policeCheckFile}
            setPoliceCheckFile={setPoliceCheckFile}
            isEdit={true}
          />
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, maxWidth: 1000, minWidth: 600, m: 4 }}>
        <Stack spacing={2}>
          <Typography variant="h4">Availability</Typography>
          <AvailabilitySelector
            onAvailabilityChange={setAvailability}
            isEdit={true}
          />
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, maxWidth: 1000, minWidth: 600, m: 4 }}>
        <Stack spacing={2}>
          <Typography variant="h4">Unavailability</Typography>
          <UnavailabilitySelector
            unavailability={specificUnavailability}
            onChange={setSpecificUnavailability}
            isEdit={true}
          />
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, maxWidth: 1000, minWidth: 600, m: 4 }}>
        <Stack spacing={2}>
          <Typography variant="h4">Capabilities</Typography>
          <TutorCapabilities
            capabilityIds={capabilityIds}
            setCapabilityIds={setCapabilityIds}
            isEdit={true}
          />
        </Stack>
      </Paper>

      <Paper
        sx={{
          p: 3,
          maxWidth: 1000,
          minWidth: 600,
          mb: 12,
          mt: 4,
          ml: 4,
          mr: 4,
        }}
      >
        <Stack spacing={2}>
          <Typography variant="h4">Blocked Students</Typography>
          <TutorBlockedStudents
            blockedStudentIds={blockedStudentIds}
            setBlockedStudentIds={setBlockedStudentIds}
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

export default NewTutor;
