import {
  Grid2 as Grid,
  Stack,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  useTheme,
} from "@mui/material";
import { tokens } from "../../theme";

const StudentAdditionalInfo = ({
  formData,
  setFormData,
  isEdit,
  includeHowUserHeard = true,
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const maxHoursValue = formData.maxHoursPerDay;
  const maxHoursDisplay =
    maxHoursValue === "" || maxHoursValue === null || maxHoursValue === undefined
      ? "N/A"
      : maxHoursValue;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSwitchChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.checked });
  };

  return (
    <Stack spacing={2}>
      {isEdit ? (
        <>
          <FormControlLabel
            control={
              <Switch
                id="canOfferFood"
                checked={formData.canOfferFood ?? false}
                onChange={handleSwitchChange}
              />
            }
            label="Provide child with tea/coffee and/or snacks?"
          />
          <TextField
            name="avoidFoods"
            value={formData.avoidFoods ?? ""}
            onChange={handleChange}
            label="Do not provide the child with the following food/drink"
          />
          <TextField
            name="questions"
            value={formData.questions ?? ""}
            onChange={handleChange}
            label="Questions regarding tutoring of this child"
          />
          <TextField
            name="maxHoursPerDay"
            value={formData.maxHoursPerDay ?? ""}
            onChange={handleChange}
            label="Max tutoring hours per day (optional)"
            type="number"
            inputProps={{ min: 0, step: 0.5 }}
          />
          {includeHowUserHeard && (
            <TextField
              name="howUserHeard"
              value={formData.howUserHeard ?? ""}
              onChange={handleChange}
              label="How did the person hear about Wise Minds Canberra?"
            />
          )}
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
              Provide child with tea/coffee and/or snacks?
            </Typography>
            <Typography variant="h6" color={colors.grey[100]}>
              {formData.canOfferFood ? "Yes" : "No"}
            </Typography>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <Typography
              variant="h5"
              color={colors.orangeAccent[400]}
              fontWeight="bold"
              sx={{ mb: "5px" }}
            >
              Do not provide the child with the following food/drink
            </Typography>
            <Typography variant="h6" color={colors.grey[100]}>
              {formData.avoidFoods}
            </Typography>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <Typography
              variant="h5"
              color={colors.orangeAccent[400]}
              fontWeight="bold"
              sx={{ mb: "5px" }}
            >
              Questions regarding tutoring of this child
            </Typography>
            <Typography variant="h6" color={colors.grey[100]}>
              {formData.questions}
            </Typography>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <Typography
              variant="h5"
              color={colors.orangeAccent[400]}
              fontWeight="bold"
              sx={{ mb: "5px" }}
            >
              Max tutoring hours per day
            </Typography>
            <Typography variant="h6" color={colors.grey[100]}>
              {maxHoursDisplay}
            </Typography>
          </div>
          {includeHowUserHeard && (
            <div style={{ display: "flex", gap: "10px" }}>
              <Typography
                variant="h5"
                color={colors.orangeAccent[400]}
                fontWeight="bold"
                sx={{ mb: "5px" }}
              >
                How did the person hear about us?
              </Typography>
              <Typography variant="h6" color={colors.grey[100]}>
                {formData.howUserHeard}
              </Typography>
            </div>
          )}
        </>
      )}
    </Stack>
  );
};

export default StudentAdditionalInfo;
