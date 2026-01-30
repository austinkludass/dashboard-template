import { Stack } from "@mui/material";
import FamilyEmergencyStep from "./FamilyEmergencyStep";

const FamilyStep = ({ formData, setFormData }) => {
  return (
    <Stack spacing={4}>
      <FamilyEmergencyStep formData={formData} setFormData={setFormData} />
    </Stack>
  );
};

export default FamilyStep;
