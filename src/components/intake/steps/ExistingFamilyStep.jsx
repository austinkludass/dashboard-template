import { Stack, Typography, TextField } from "@mui/material";
import FamilySchedulingPreference from "./FamilySchedulingPreference";

const ExistingFamilyStep = ({ formData, setFormData }) => {
  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h5" fontWeight="bold">
        Family Details
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Update the primary guardian details for this family before continuing.
      </Typography>
      <TextField
        name="parentName"
        label="Primary Guardian Full Name"
        value={formData.parentName}
        onChange={handleChange}
        required
        fullWidth
      />
      <TextField
        name="parentEmail"
        label="Primary Guardian Email"
        type="email"
        value={formData.parentEmail}
        onChange={handleChange}
        required
        fullWidth
      />
      <FamilySchedulingPreference
        formData={formData}
        setFormData={setFormData}
      />
    </Stack>
  );
};

export default ExistingFamilyStep;
