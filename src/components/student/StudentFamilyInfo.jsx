import {
  Stack,
  Grid2 as Grid,
  Typography,
  TextField,
  useTheme,
} from "@mui/material";
import { tokens } from "../../theme";

const StudentFamilyInfo = ({
  formData,
  isEdit,
  setFormData,
  touched,
  setTouched,
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const isInvalid = (field) => touched[field] && !formData[field].trim();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched({ ...touched, [name]: true });
  };

  return (
    <Stack spacing={2}>
      {isEdit ? (
        <>
          <TextField
            name="familyPhone"
            value={formData.familyPhone ?? ""}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            label="Phone"
            error={isInvalid("familyPhone")}
          />
          <TextField
            name="familyEmail"
            value={formData.familyEmail ?? ""}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            label="Email"
            error={isInvalid("familyEmail")}
          />
          <TextField
            name="familyAddress"
            value={formData.familyAddress ?? ""}
            onChange={handleChange}
            label="Address"
          />
        </>
      ) : (
        <>
          <div style={{ display: "flex", gap: "10px" }}>
            <Typography
              variant="h5"
              color={colors.orangeAccent[400]}
              fontWeight="bold"
              sx={{ mb: "5px" }}
            >
              Phone
            </Typography>
            <Typography variant="h6" color={colors.grey[100]}>
              {formData.familyPhone}
            </Typography>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <Typography
              variant="h5"
              color={colors.orangeAccent[400]}
              fontWeight="bold"
              sx={{ mb: "5px" }}
            >
              Email
            </Typography>
            <Typography variant="h6" color={colors.grey[100]}>
              {formData.familyEmail}
            </Typography>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <Typography
              variant="h5"
              color={colors.orangeAccent[400]}
              fontWeight="bold"
              sx={{ mb: "5px" }}
            >
              Address
            </Typography>
            <Typography variant="h6" color={colors.grey[100]}>
              {formData.familyAddress}
            </Typography>
          </div>
        </>
      )}
    </Stack>
  );
};

export default StudentFamilyInfo;
