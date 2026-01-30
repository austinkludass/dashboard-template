import { Stack, Typography } from "@mui/material";
import StudentAcademicInfo from "../../student/StudentAcademicInfo";

const AcademicNeedsStep = ({
  formData,
  setFormData,
  subjects,
  setSubjects,
  showTutorPreferences = true,
}) => {
  return (
    <Stack spacing={3}>
      <Typography variant="h5" fontWeight="bold">
        Academic Information
      </Typography>
      <StudentAcademicInfo
        formData={formData}
        setFormData={setFormData}
        isEdit={true}
        subjects={subjects}
        setSubjects={setSubjects}
        allowTutoringToggle={true}
        showTutorPreferences={showTutorPreferences}
        showHoursWarning={true}
      />
    </Stack>
  );
};

export default AcademicNeedsStep;
