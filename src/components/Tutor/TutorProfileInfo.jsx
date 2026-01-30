import { useState, useRef } from "react";
import {
  Avatar,
  Stack,
  Box,
  IconButton,
  TextField,
  Typography,
  useTheme,
  Tooltip,
} from "@mui/material";
import { Saturation, Hue } from "react-color-palette";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { tokens } from "../../theme";
import { InfoOutlined } from "@mui/icons-material";
import EditIcon from "@mui/icons-material/Edit";
import dayjs from "dayjs";
import Grid from "@mui/material/Grid2";
import "react-color-palette/css";

const TutorProfileInfo = ({
  formData,
  setFormData,
  tutorColor,
  setTutorColor,
  profilePic,
  setProfilePic,
  profilePicPreview,
  setProfilePicPreview,
  touched,
  setTouched,
  isEdit,
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const fileInputRef = useRef();
  const [hover, setHover] = useState(false);

  const isInvalid = (field) => touched[field] && !formData[field].trim();

  const handleAvatarClick = () => {
    document.getElementById("profilePicInput").click();
  };

  const handleProfilePicChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setProfilePic(file);
      setProfilePicPreview(URL.createObjectURL(file));
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched({ ...touched, [name]: true });
  };

  const handleDateChange = (name) => (date) => {
    setFormData({ ...formData, [name]: date });
  };

  const isTooLight = (r, g, b) => r * 0.299 + g * 0.587 + b * 0.114 > 186;

  const handleColorChange = (color) => {
    const { r, g, b } = color.rgb;
    if (!isTooLight(r, g, b)) {
      setTutorColor(color);
    }
  };

  return (
    <Grid container spacing={2} alignItems="center">
      <Grid size={4} sx={{ display: "flex", justifyContent: "center" }}>
        <Stack spacing={2}>
          <Box
            style={{
              position: "relative",
              width: "140px",
              height: "140px",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
          >
            <Avatar
              src={isEdit ? profilePicPreview ?? profilePic : profilePic}
              sx={{
                width: 140,
                height: 140,
                bgcolor: tutorColor.hex,
                position: "absolute",
                border: `4px solid ${tutorColor.hex}`,
              }}
            />
            {hover && isEdit && (
              <IconButton
                onClick={handleAvatarClick}
                sx={[
                  {
                    width: 140,
                    height: 140,
                    position: "absolute",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                  },
                  {
                    "&:hover": {
                      backgroundColor: "rgba(0, 0, 0, 0.5)",
                    },
                  },
                ]}
              >
                <EditIcon sx={{ width: 40, height: 40 }} />
              </IconButton>
            )}
            <input
              type="file"
              id="profilePicInput"
              hidden
              accept="image/*"
              ref={fileInputRef}
              onChange={handleProfilePicChange}
            />
          </Box>
          {isEdit && (
            <Box display="flex" justifyContent="center" position="relative">
              <Box
                sx={{
                  position: "absolute",
                  left: -50,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              >
                <Tooltip title="Lighter colors are unable to be selected as white text is displayed on top of your color">
                  <IconButton size="small">
                    <InfoOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>

              <Stack width="140px" spacing={1} alignItems="center">
                <Saturation
                  height={70}
                  color={tutorColor}
                  onChange={handleColorChange}
                />
                <Hue color={tutorColor} onChange={handleColorChange} />
              </Stack>
            </Box>
          )}
        </Stack>
      </Grid>
      <Grid size={8}>
        <Stack spacing={2}>
          {isEdit ? (
            <>
              <TextField
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                label="First Name"
                error={isInvalid("firstName")}
              />
              <TextField
                name="middleName"
                value={formData.middleName}
                onChange={handleChange}
                label="Middle Name"
              />
              <TextField
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                label="Last Name"
              />
              <DatePicker
                value={
                  formData.dateOfBirth ? dayjs(formData.dateOfBirth) : null
                }
                onChange={handleDateChange("dateOfBirth")}
                label="Date of Birth"
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
                  First Name
                </Typography>
                <Typography variant="h6" color={colors.grey[100]}>
                  {formData.firstName}
                </Typography>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <Typography
                  variant="h5"
                  color={colors.orangeAccent[400]}
                  fontWeight="bold"
                  sx={{ mb: "5px" }}
                >
                  Middle Name
                </Typography>
                <Typography variant="h6" color={colors.grey[100]}>
                  {formData.middleName}
                </Typography>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <Typography
                  variant="h5"
                  color={colors.orangeAccent[400]}
                  fontWeight="bold"
                  sx={{ mb: "5px" }}
                >
                  Last Name
                </Typography>
                <Typography variant="h6" color={colors.grey[100]}>
                  {formData.lastName}
                </Typography>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <Typography
                  variant="h5"
                  color={colors.orangeAccent[400]}
                  fontWeight="bold"
                  sx={{ mb: "5px" }}
                >
                  Date of Birth
                </Typography>
                <Typography variant="h6" color={colors.grey[100]}>
                  {formData.dateOfBirth
                    ? dayjs(formData.dateOfBirth).format("MMMM D, YYYY")
                    : "N/A"}
                </Typography>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <Typography
                  variant="h5"
                  color={colors.orangeAccent[400]}
                  fontWeight="bold"
                  sx={{ mb: "5px" }}
                >
                  Wise Minds Email
                </Typography>
                <Typography variant="h6" color={colors.grey[100]}>
                  {formData.wiseMindsEmail}
                </Typography>
              </div>
            </>
          )}
        </Stack>
      </Grid>
    </Grid>
  );
};

export default TutorProfileInfo;
