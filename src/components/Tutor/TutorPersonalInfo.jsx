import React, { useEffect, useState } from "react";
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
  Box,
  Slider,
  TextField,
  useTheme,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { tokens } from "../../theme";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../data/firebase";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const TutorPersonalInfo = ({ formData, setFormData, isEdit }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const snapshot = await getDocs(collection(db, "locations"));
        const locs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setLocations(locs);
      } catch (error) {
        toast.error("Error fetching locations: ", error);
      }
    };

    fetchLocations();
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMinMaxChange = (event, newValue, activeThumb) => {
    if (!Array.isArray(newValue)) return;

    let updatedHours = [...newValue];

    if (activeThumb === 0) {
      updatedHours[0] = Math.min(newValue[0], updatedHours[1] - 3);
    } else {
      updatedHours[1] = Math.max(newValue[1], updatedHours[0] + 3);
    }

    setFormData({ ...formData, hours: updatedHours });
  };

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h4">Personal Information</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          {isEdit ? (
            <>
              <TextField
                name="career"
                label="Career"
                value={formData.career}
                onChange={handleChange}
              />
              <TextField
                name="degree"
                label="Degree"
                value={formData.degree}
                onChange={handleChange}
              />
              <TextField
                name="position"
                label="Position"
                value={formData.position}
                onChange={handleChange}
              />
              <FormControl fullWidth>
                <InputLabel id="location-select-label">
                  Home Location
                </InputLabel>
                <Select
                  name="homeLocation"
                  label="Home Location"
                  labelId="location-select-label"
                  value={formData.homeLocation}
                  onChange={handleChange}
                >
                  {locations.map((loc) => (
                    <MenuItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                name="rate"
                type="number"
                label="Rate ($)"
                value={formData.rate}
                onChange={handleChange}
              />
              <Box sx={{ paddingLeft: 2, paddingRight: 2 }}>
                <Typography gutterBottom>Hours</Typography>
                <Slider
                  valueLabelDisplay="auto"
                  onChange={handleMinMaxChange}
                  value={formData.hours}
                  disableSwap
                  max={60}
                  min={0}
                />
              </Box>
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
                  Career
                </Typography>
                <Typography variant="h6" color={colors.grey[100]}>
                  {formData.career}
                </Typography>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <Typography
                  variant="h5"
                  color={colors.orangeAccent[400]}
                  fontWeight="bold"
                  sx={{ mb: "5px" }}
                >
                  Degree
                </Typography>
                <Typography variant="h6" color={colors.grey[100]}>
                  {formData.degree}
                </Typography>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <Typography
                  variant="h5"
                  color={colors.orangeAccent[400]}
                  fontWeight="bold"
                  sx={{ mb: "5px" }}
                >
                  Position
                </Typography>
                <Typography variant="h6" color={colors.grey[100]}>
                  {formData.position}
                </Typography>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <Typography
                  variant="h5"
                  color={colors.orangeAccent[400]}
                  fontWeight="bold"
                  sx={{ mb: "5px" }}
                >
                  Home Location
                </Typography>
                {locations.length === 0 ? (
                  <Typography variant="h6" color={colors.grey[100]}>
                    Loading ...
                  </Typography>
                ) : (
                  <Typography variant="h6" color={colors.grey[100]}>
                    {locations.find((loc) => loc.id === formData.homeLocation)
                      ?.name || "Unknown Location"}
                  </Typography>
                )}
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <Typography
                  variant="h5"
                  color={colors.orangeAccent[400]}
                  fontWeight="bold"
                  sx={{ mb: "5px" }}
                >
                  Role
                </Typography>
                <Typography variant="h6" color={colors.grey[100]}>
                  {formData.role}
                </Typography>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <Typography
                  variant="h5"
                  color={colors.orangeAccent[400]}
                  fontWeight="bold"
                  sx={{ mb: "5px" }}
                >
                  Hours (Min - Max)
                </Typography>
                <Typography variant="h6" color={colors.grey[100]}>
                  {formData.hours[0]} - {formData.hours[1]}
                </Typography>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <Typography
                  variant="h5"
                  color={colors.orangeAccent[400]}
                  fontWeight="bold"
                  sx={{ mb: "5px" }}
                >
                  Rate ($)
                </Typography>
                <Typography variant="h6" color={colors.grey[100]}>
                  {formData.rate}
                </Typography>
              </div>
            </>
          )}
        </Stack>
      </AccordionDetails>
      <ToastContainer position="top-right" autoClose={3000} />
    </Accordion>
  );
};

export default TutorPersonalInfo;
