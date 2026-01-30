import React from "react";
import {
  Typography,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  TextField,
  useTheme,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { tokens } from "../../theme";

const TutorEmergencyInfo = ({ formData, setFormData, isEdit }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h4">Emergency Contact</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          {isEdit ? (
            <>
              <TextField
                name="emergencyName"
                label="Full Name"
                value={formData.emergencyName}
                onChange={handleChange}
              />
              <FormControl fullWidth>
                <InputLabel id="relationship-select-label">
                  Relationship
                </InputLabel>
                <Select
                  name="emergencyRelationship"
                  label="Relationship"
                  labelId="relationship-select-label"
                  value={formData.emergencyRelationship}
                  onChange={handleChange}
                >
                  <MenuItem value={"daughter"}>Daughter</MenuItem>
                  <MenuItem value={"father"}>Father</MenuItem>
                  <MenuItem value={"friend"}>Friend</MenuItem>
                  <MenuItem value={"husband"}>Husband</MenuItem>
                  <MenuItem value={"mother"}>Mother</MenuItem>
                  <MenuItem value={"partner"}>Partner</MenuItem>
                  <MenuItem value={"son"}>Son</MenuItem>
                  <MenuItem value={"wife"}>Wife</MenuItem>
                </Select>
              </FormControl>
              <TextField
                name="emergencyPhone"
                label="Phone Number"
                value={formData.emergencyPhone}
                onChange={handleChange}
              />
              <TextField
                name="emergencyEmail"
                label="Email"
                value={formData.emergencyEmail}
                onChange={handleChange}
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
                  Full Name
                </Typography>
                <Typography variant="h6" color={colors.grey[100]}>
                  {formData.emergencyName}
                </Typography>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <Typography
                  variant="h5"
                  color={colors.orangeAccent[400]}
                  fontWeight="bold"
                  sx={{ mb: "5px" }}
                >
                  Relationship
                </Typography>
                <Typography variant="h6" color={colors.grey[100]}>
                  {formData.emergencyRelationship ??
                    formData.emergencyRelationship[0].toUpperCase() +
                      formData.emergencyRelationship.slice(1)}
                </Typography>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <Typography
                  variant="h5"
                  color={colors.orangeAccent[400]}
                  fontWeight="bold"
                  sx={{ mb: "5px" }}
                >
                  Phone Number
                </Typography>
                <Typography variant="h6" color={colors.grey[100]}>
                  {formData.emergencyPhone}
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
                  {formData.emergencyEmail}
                </Typography>
              </div>
            </>
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
};

export default TutorEmergencyInfo;
