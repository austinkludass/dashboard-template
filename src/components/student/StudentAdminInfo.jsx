import { useState, useEffect } from "react";
import {
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  TextField,
  Box,
  Paper,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
  InputAdornment,
  IconButton,
  Tooltip,
  useTheme,
} from "@mui/material";
import { tokens } from "../../theme";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../data/firebase";
import { ToastContainer, toast } from "react-toastify";
import PercentIcon from "@mui/icons-material/Percent";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import DeleteIcon from "@mui/icons-material/Delete";
import "react-toastify/dist/ReactToastify.css";

const StudentAdminInfo = ({ formData, setFormData, isEdit }) => {
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
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDiscountChange = (field, value) => {
    setFormData({
      ...formData,
      discount: {
        ...formData.discount,
        [field]: value,
      },
    });
  };

  const handleCreditChange = (field, value) => {
    setFormData({
      ...formData,
      credit: {
        ...formData.credit,
        [field]: value,
      },
    });
  };

  const clearDiscount = () => {
    setFormData({
      ...formData,
      discount: null,
    });
  };

  const clearCredit = () => {
    setFormData({
      ...formData,
      credit: null,
    });
  };

  const formatDiscount = (discount) => {
    if (!discount || !discount.type || !discount.value) return "None";
    const hoursLeft = discount.hoursRemaining || 0;
    if (discount.type === "percentage") {
      return `${discount.value}% off (${hoursLeft}h remaining)`;
    }
    return `$${Number(discount.value).toFixed(
      2
    )} off/hr (${hoursLeft}h remaining)`;
  };

  const formatCredit = (credit) => {
    if (!credit || !credit.type) return "None";
    if (credit.type === "dollars") {
      const balance = Number(credit.balance) || 0;
      return `$${balance.toFixed(2)} credit remaining`;
    }
    const hours = Number(credit.hoursRemaining) || 0;
    return `${hours}h prepaid remaining`;
  };

  return (
    <Stack spacing={3}>
      {isEdit ? (
        <>
          <FormControl fullWidth>
            <InputLabel id="homelocation-select-label">
              Home Location
            </InputLabel>
            <Select
              name="homeLocation"
              label="Home Location"
              labelId="homelocation-select-label"
              value={formData.homeLocation || ""}
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
            fullWidth
            type="number"
            label="Base Rate ($)"
            name="baseRate"
            value={formData.baseRate || ""}
            onChange={handleChange}
            InputProps={{ inputProps: { min: 0 } }}
          />

          <Divider sx={{ my: 2 }} />

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h6" color={colors.orangeAccent[400]}>
                Discount
              </Typography>
              {formData.discount?.type && (
                <Tooltip title="Remove discount">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={clearDiscount}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Discount Type
                </Typography>
                <ToggleButtonGroup
                  value={formData.discount?.type || null}
                  exclusive
                  onChange={(e, value) => {
                    if (value === null) {
                      clearDiscount();
                    } else {
                      handleDiscountChange("type", value);
                    }
                  }}
                  fullWidth
                  size="small"
                >
                  <ToggleButton value={null}>None</ToggleButton>
                  <ToggleButton value="percentage">
                    <PercentIcon sx={{ mr: 1 }} /> Percentage
                  </ToggleButton>
                  <ToggleButton value="fixed">
                    <AttachMoneyIcon sx={{ mr: 1 }} /> Fixed $/hr
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {formData.discount?.type && (
                <>
                  <TextField
                    fullWidth
                    type="number"
                    label={
                      formData.discount?.type === "percentage"
                        ? "Discount Percentage"
                        : "Discount Amount ($ off per hour)"
                    }
                    value={formData.discount?.value || ""}
                    onChange={(e) =>
                      handleDiscountChange("value", e.target.value)
                    }
                    InputProps={{
                      inputProps: {
                        min: 0,
                        max:
                          formData.discount?.type === "percentage"
                            ? 100
                            : undefined,
                        step:
                          formData.discount?.type === "percentage" ? 1 : 0.5,
                      },
                      startAdornment: (
                        <InputAdornment position="start">
                          {formData.discount?.type === "percentage" ? "%" : "$"}
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    type="number"
                    label="Hours Remaining (discount duration)"
                    value={formData.discount?.hoursRemaining || ""}
                    onChange={(e) =>
                      handleDiscountChange("hoursRemaining", e.target.value)
                    }
                    InputProps={{
                      inputProps: { min: 0, step: 0.5 },
                      endAdornment: (
                        <InputAdornment position="end">hours</InputAdornment>
                      ),
                    }}
                    helperText="Discount applies until these hours are used up"
                  />

                  <TextField
                    fullWidth
                    label="Discount Reason (optional)"
                    value={formData.discount?.reason || ""}
                    onChange={(e) =>
                      handleDiscountChange("reason", e.target.value)
                    }
                    placeholder="e.g., Sibling discount, Promotional offer"
                  />
                </>
              )}
            </Stack>
          </Paper>

          <Divider sx={{ my: 2 }} />

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h6" color={colors.orangeAccent[400]}>
                Pay in Advance / Credit
              </Typography>
              {formData.credit?.type && (
                <Tooltip title="Remove credit">
                  <IconButton size="small" color="error" onClick={clearCredit}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Credit Type
                </Typography>
                <ToggleButtonGroup
                  value={formData.credit?.type || null}
                  exclusive
                  onChange={(e, value) => {
                    if (value === null) {
                      clearCredit();
                    } else {
                      handleCreditChange("type", value);
                    }
                  }}
                  fullWidth
                  size="small"
                >
                  <ToggleButton value={null}>None</ToggleButton>
                  <ToggleButton value="dollars">
                    <AttachMoneyIcon sx={{ mr: 1 }} /> Dollar Credit
                  </ToggleButton>
                  <ToggleButton value="hours">Prepaid Hours</ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {formData.credit?.type === "dollars" && (
                <TextField
                  fullWidth
                  type="number"
                  label="Credit Balance ($)"
                  value={formData.credit?.balance || ""}
                  onChange={(e) =>
                    handleCreditChange("balance", e.target.value)
                  }
                  InputProps={{
                    inputProps: { min: 0, step: 0.01 },
                    startAdornment: (
                      <InputAdornment position="start">$</InputAdornment>
                    ),
                  }}
                  helperText="Amount of prepaid credit remaining"
                />
              )}

              {formData.credit?.type === "hours" && (
                <TextField
                  fullWidth
                  type="number"
                  label="Prepaid Hours Remaining"
                  value={formData.credit?.hoursRemaining || ""}
                  onChange={(e) =>
                    handleCreditChange("hoursRemaining", e.target.value)
                  }
                  InputProps={{
                    inputProps: { min: 0, step: 0.5 },
                    endAdornment: (
                      <InputAdornment position="end">hours</InputAdornment>
                    ),
                  }}
                  helperText="Number of prepaid lesson hours remaining"
                />
              )}
            </Stack>
          </Paper>
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
              Base Rate
            </Typography>
            <Typography variant="h6" color={colors.grey[100]}>
              {formData.baseRate ? `$${formData.baseRate}` : "Not Set"}
            </Typography>
          </div>

          <Divider sx={{ my: 1 }} />

          <div style={{ display: "flex", gap: "10px" }}>
            <Typography
              variant="h5"
              color={colors.orangeAccent[400]}
              fontWeight="bold"
              sx={{ mb: "5px" }}
            >
              Discount
            </Typography>
            <Typography variant="h6" color={colors.grey[100]}>
              {formatDiscount(formData.discount)}
            </Typography>
          </div>

          {formData.discount?.reason && (
            <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
              Reason: {formData.discount.reason}
            </Typography>
          )}

          <div style={{ display: "flex", gap: "10px" }}>
            <Typography
              variant="h5"
              color={colors.orangeAccent[400]}
              fontWeight="bold"
              sx={{ mb: "5px" }}
            >
              Credit
            </Typography>
            <Typography variant="h6" color={colors.grey[100]}>
              {formatCredit(formData.credit)}
            </Typography>
          </div>
        </>
      )}
      <ToastContainer position="top-right" autoClose={3000} />
    </Stack>
  );
};

export default StudentAdminInfo;
