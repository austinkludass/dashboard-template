import { React, useState } from "react";
import {
  Typography,
  Stack,
  IconButton,
  InputAdornment,
  TextField,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

const TutorLoginInfo = ({ formData, setFormData, touched, setTouched }) => {
  const [showPassword, setShowPassword] = useState(false);

  const isInvalid = (field) => touched[field] && !formData[field].trim();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched({ ...touched, [name]: true });
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleMouseUpPassword = (event) => {
    event.preventDefault();
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h4">Login Information</Typography>
      <TextField
        name="wiseMindsEmail"
        value={formData.wiseMindsEmail}
        onChange={handleChange}
        onBlur={handleBlur}
        required
        type="email"
        label="Wise Minds Email"
        error={isInvalid("wiseMindsEmail")}
      />
      <TextField
        name="password"
        value={formData.password}
        onChange={handleChange}
        onBlur={handleBlur}
        error={isInvalid("password")}
        label="Password"
        autoComplete="new-password"
        required
        type={showPassword ? "text" : "password"}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleClickShowPassword}
                  onMouseDown={handleMouseDownPassword}
                  onMouseUp={handleMouseUpPassword}
                  tabIndex={-1}
                >
                  {showPassword ? <Visibility /> : <VisibilityOff />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
      <TextField
        name="secondPassword"
        value={formData.secondPassword}
        onChange={handleChange}
        label="Re-enter Password"
        autoComplete="new-password"
        onBlur={handleBlur}
        error={isInvalid("secondPassword")}
        required
        type={showPassword ? "text" : "password"}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleClickShowPassword}
                  onMouseDown={handleMouseDownPassword}
                  onMouseUp={handleMouseUpPassword}
                  tabIndex={-1}
                >
                  {showPassword ? <Visibility /> : <VisibilityOff />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
    </Stack>
  );
};

export default TutorLoginInfo;
