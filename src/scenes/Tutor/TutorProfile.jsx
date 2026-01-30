import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { db } from "../../data/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Box, Button, CircularProgress } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { ToastContainer, toast } from "react-toastify";
import { ColorService, useColor } from "react-color-palette";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import usePermissions from "../../hooks/usePermissions";
import dayjs from "dayjs";
import Header from "../../components/Global/Header";
import Section from "../../components/Global/Section";
import TutorProfileInfo from "../../components/Tutor/TutorProfileInfo";
import TutorContactInfo from "../../components/Tutor/TutorContactInfo";
import TutorPersonalInfo from "../../components/Tutor/TutorPersonalInfo";
import TutorEmergencyInfo from "../../components/Tutor/TutorEmergencyInfo";
import TutorBankInfo from "../../components/Tutor/TutorBankInfo";
import TutorWWVPInfo from "../../components/Tutor/TutorWWVPInfo";
import TutorFirstAidInfo from "../../components/Tutor/TutorFirstAidInfo";
import TutorPoliceCheckInfo from "../../components/Tutor/TutorPoliceCheckInfo";
import AvailabilitySelector from "../../components/Tutor/AvailabilitySelector";
import UnavailabilitySelector from "../../components/Tutor/UnavailabilitySelector";
import TutorCapabilities from "../../components/Tutor/TutorCapabilities";
import TutorBlockedStudents from "../../components/Tutor/TutorBlockedStudents";
import AvailabilityFormatter from "../../utils/AvailabilityFormatter";
import "dayjs/locale/en-gb";

const TutorProfile = () => {
  const { tutorId } = useParams();
  const [tutor, setTutor] = useState(null);
  const [forms, setForms] = useState({});
  const [editState, setEditState] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [tutorColor, setTutorColor] = useColor("hex", "#6E6E6E");
  const [profilePic, setProfilePic] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [wwvpFile, setWwvpFile] = useState(null);
  const [firstAidFile, setFirstAidFile] = useState(null);
  const [policeCheckFile, setPoliceCheckFile] = useState(null);
  const [availability, setAvailability] = useState({});
  const [unavailability, setUnavailability] = useState({});
  const [capabilityIds, setCapabilityIds] = useState([]);
  const [blockedStudentIds, setBlockedStudentIds] = useState([]);
  const dateFields = ["dateOfBirth", "wwvpExpiry", "faCourseDate", "faExpiry"];
  const [isSaving, setIsSaving] = useState(false);

  const { canViewBankingTax, canViewBlockedStudents, userId } =
    usePermissions();
  const canSeeBankingTax = canViewBankingTax(tutorId);
  const canSeeBlockedStudents = canViewBlockedStudents;

  const setForm = (key, value) =>
    setForms((prev) => ({ ...prev, [key]: value }));
  const toggleEdit = (key, state) =>
    setEditState((prev) => ({ ...prev, [key]: state }));

  const getFormConfigs = () => {
    const configs = {
      profile: {
        title: "",
        component: TutorProfileInfo,
        fields: [
          "firstName",
          "middleName",
          "lastName",
          "dateOfBirth",
          "wiseMindsEmail",
        ],
        extraProps: {
          tutorColor,
          setTutorColor,
          profilePic,
          setProfilePic,
          profilePicPreview,
          setProfilePicPreview,
        },
      },
      contact: {
        title: "",
        component: TutorContactInfo,
        fields: ["personalEmail", "phone", "address"],
      },
      personal: {
        title: "",
        component: TutorPersonalInfo,
        fields: [
          "career",
          "degree",
          "position",
          "homeLocation",
          "role",
          "hours",
          "rate",
        ],
      },
      emergency: {
        title: "",
        component: TutorEmergencyInfo,
        fields: [
          "emergencyName",
          "emergencyRelationship",
          "emergencyPhone",
          "emergencyEmail",
        ],
      },
    };

    if (canSeeBankingTax) {
      configs.bank = {
        title: "",
        component: TutorBankInfo,
        fields: [
          "bankName",
          "accountName",
          "bsb",
          "accountNumber",
          "tfn",
          "superCompany",
        ],
      };
    }

    configs.wwvp = {
      title: "",
      component: TutorWWVPInfo,
      fields: [
        "wwvpName",
        "wwvpRegNumber",
        "wwvpCardNumber",
        "wwvpExpiry",
        "wwvpFilePath",
      ],
      extraProps: { wwvpFile, setWwvpFile },
    };

    configs.firstaid = {
      title: "",
      component: TutorFirstAidInfo,
      fields: [
        "faCourseDate",
        "faProvider",
        "faNumber",
        "faCourseType",
        "faCourseCode",
        "faExpiry",
        "firstAidFilePath",
      ],
      extraProps: { firstAidFile, setFirstAidFile },
    };

    configs.policecheck = {
      title: "",
      component: TutorPoliceCheckInfo,
      fields: [
        "pcName",
        "pcIsNational",
        "pcAddress",
        "pcResult",
        "pcAPPRef",
        "policeCheckFilePath",
      ],
      extraProps: { policeCheckFile, setPoliceCheckFile },
    };

    configs.availability = {
      title: "Availability",
      component: AvailabilitySelector,
      fields: [],
      extraProps: {
        initialAvailability: availability,
        onAvailabilityChange: setAvailability,
      },
    };

    configs.unavailability = {
      title: "Unavailability",
      component: UnavailabilitySelector,
      fields: [],
      extraProps: {
        unavailability,
        onChange: setUnavailability,
      },
    };

    configs.capabilities = {
      title: "Capabilities",
      component: TutorCapabilities,
      fields: [],
      extraProps: { capabilityIds, setCapabilityIds },
    };

    if (canSeeBlockedStudents) {
      configs.blockedstudents = {
        title: "Blocked Students",
        component: TutorBlockedStudents,
        fields: [],
        extraProps: { blockedStudentIds, setBlockedStudentIds },
      };
    }

    return configs;
  };

  const formConfigs = getFormConfigs();

  useEffect(() => {
    const fetchTutor = async () => {
      if (!tutorId) return;
      const tutorRef = doc(db, "tutors", tutorId);
      const tutorSnap = await getDoc(tutorRef);
      if (!tutorSnap.exists()) return;

      const data = tutorSnap.data();
      setTutor(data);
      setTutorColor(ColorService.convert("hex", data.tutorColor));
      setProfilePic(data.avatar);
      setAvailability(data.availability || {});
      setUnavailability(data.unavailability);
      setCapabilityIds(data.capabilities);
      setBlockedStudentIds(data.blockedStudents);

      const initialForms = {};
      for (const key in formConfigs) {
        initialForms[key] = {};
        formConfigs[key].fields.forEach((f) => {
          const value = data[f];
          initialForms[key][f] =
            (f.toLowerCase().includes("date") ||
              f.toLowerCase().includes("expiry")) &&
            value
              ? dayjs(value)
              : value ?? "";
        });
      }
      setForms(initialForms);
    };

    fetchTutor();
  }, [tutorId, canSeeBankingTax, canSeeBlockedStudents]);

  const handleSave = async (key) => {
    setIsSaving(true);

    const tutorRef = doc(db, "tutors", tutorId);
    const payload = { ...forms[key] };

    if (payload.dateOfBirth)
      payload.dateOfBirth = payload.dateOfBirth.toISOString();
    if (payload.wwvpExpiry)
      payload.wwvpExpiry = payload.wwvpExpiry.toISOString();
    if (payload.faCourseDate)
      payload.faCourseDate = payload.faCourseDate.toISOString();
    if (payload.faExpiry) payload.faExpiry = payload.faExpiry.toISOString();

    if (key === "profile") {
      payload.tutorColor = tutorColor.hex;

      if (profilePic instanceof File) {
        const storage = getStorage();
        const storageRef = ref(storage, `profilePictures/${tutorId}`);
        await uploadBytes(storageRef, profilePic);
        const downloadURL = await getDownloadURL(storageRef);
        payload.avatar = downloadURL;
        setProfilePic(downloadURL);
      } else {
        payload.avatar = profilePic;
      }
    } else if (key === "wwvp") {
      if (wwvpFile instanceof File) {
        const storage = getStorage();
        const storageRef = ref(storage, `wwvpFiles/${tutorId}`);
        await uploadBytes(storageRef, wwvpFile);
        const downloadURL = await getDownloadURL(storageRef);
        payload.wwvpFilePath = downloadURL;
        setWwvpFile(null);
      } else {
        payload.wwvpFilePath = tutor.wwvpFilePath;
      }
    } else if (key === "firstaid") {
      if (firstAidFile instanceof File) {
        const storage = getStorage();
        const storageRef = ref(storage, `firstAidFiles/${tutorId}`);
        await uploadBytes(storageRef, firstAidFile);
        const downloadURL = await getDownloadURL(storageRef);
        payload.firstAidFilePath = downloadURL;
        setFirstAidFile(null);
      } else {
        payload.firstAidFilePath = tutor.firstAidFilePath;
      }
    } else if (key === "policecheck") {
      if (policeCheckFile instanceof File) {
        const storage = getStorage();
        const storageRef = ref(storage, `policeCheckFiles/${tutorId}`);
        await uploadBytes(storageRef, policeCheckFile);
        const downloadURL = await getDownloadURL(storageRef);
        payload.policeCheckFilePath = downloadURL;
        setPoliceCheckFile(null);
      } else {
        payload.policeCheckFilePath = tutor.policeCheckFilePath;
      }
    } else if (key === "availability") {
      payload.availability = AvailabilityFormatter(availability);
    } else if (key === "unavailability") {
      payload.unavailability = unavailability;
    } else if (key === "capabilities") {
      payload.capabilities = capabilityIds;
    } else if (key === "blockedstudents") {
      payload.blockedStudents = blockedStudentIds;
    }

    try {
      await updateDoc(tutorRef, payload);
      toast.success("Saved successfully");
      toggleEdit(key, false);
      setTutor((prev) => ({ ...prev, ...payload }));
    } catch (error) {
      toast.error("Error saving: " + error.message);
    }

    setIsSaving(false);
  };

  const handleCancel = (key) => {
    const resetData = {};
    formConfigs[key].fields.forEach((f) => {
      const value = tutor[f];
      resetData[f] =
        dateFields.includes(f) && value ? dayjs(value) : value ?? "";
    });
    setForm(key, resetData);
    toggleEdit(key, false);

    if (key === "profile") {
      if (tutor?.tutorColor) {
        const originalColor = ColorService.convert("hex", tutor.tutorColor);
        setTutorColor(originalColor);
      }
      if (tutor?.avatar) {
        setProfilePic(tutor.avatar);
        setProfilePicPreview(null);
      }
    }
    if (key === "wwvp") {
      setWwvpFile(null);
    }
    if (key === "firstaid") {
      setFirstAidFile(null);
    }
    if (key === "policecheck") {
      setPoliceCheckFile(null);
    }
    if (key === "availability") {
      setAvailability(tutor.availability);
    }
    if (key === "unavailability") {
      setUnavailability(tutor.unavailability);
    }
    if (key === "capabilities") {
      setCapabilityIds(tutor.capabilities);
    }
    if (key === "blockedstudents") {
      setBlockedStudentIds(tutor.blockedStudents);
    }
  };

  if (!tutor) {
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
          title={`${tutor.firstName} ${tutor.lastName}`}
          subtitle={tutor.role[0].toUpperCase() + tutor.role.slice(1)}
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
                  <Button
                    variant="contained"
                    onClick={() => handleSave(key)}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <CircularProgress size={20} sx={{ color: "white" }} />
                    ) : (
                      "Save"
                    )}
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

export default TutorProfile;
