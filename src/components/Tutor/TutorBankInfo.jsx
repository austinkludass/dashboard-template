import React from "react";
import {
  Typography,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  useTheme,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { tokens } from "../../theme";

const TutorBankInfo = ({ formData, setFormData, isEdit }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h4">Banking and Tax</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          {isEdit ? (
            <>
              <TextField
                name="bankName"
                label="Bank Name"
                value={formData.bankName}
                onChange={handleChange}
              />
              <TextField
                name="accountName"
                label="Account Name"
                value={formData.accountName}
                onChange={handleChange}
              />
              <TextField
                name="bsb"
                label="BSB"
                value={formData.bsb}
                onChange={handleChange}
              />
              <TextField
                name="accountNumber"
                label="Account Number"
                value={formData.accountNumber}
                onChange={handleChange}
              />
              <TextField
                name="tfn"
                label="Tax File Number"
                value={formData.tfn}
                onChange={handleChange}
              />
              <TextField
                name="superCompany"
                label="Super Company"
                value={formData.superCompany}
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
                  Bank Name
                </Typography>
                <Typography variant="h6" color={colors.grey[100]}>
                  {formData.bankName}
                </Typography>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <Typography
                  variant="h5"
                  color={colors.orangeAccent[400]}
                  fontWeight="bold"
                  sx={{ mb: "5px" }}
                >
                  Account Name
                </Typography>
                <Typography variant="h6" color={colors.grey[100]}>
                  {formData.accountName}
                </Typography>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <Typography
                  variant="h5"
                  color={colors.orangeAccent[400]}
                  fontWeight="bold"
                  sx={{ mb: "5px" }}
                >
                  BSB
                </Typography>
                <Typography variant="h6" color={colors.grey[100]}>
                  {formData.bsb}
                </Typography>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <Typography
                  variant="h5"
                  color={colors.orangeAccent[400]}
                  fontWeight="bold"
                  sx={{ mb: "5px" }}
                >
                  Account Number
                </Typography>
                <Typography variant="h6" color={colors.grey[100]}>
                  {formData.accountNumber}
                </Typography>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <Typography
                  variant="h5"
                  color={colors.orangeAccent[400]}
                  fontWeight="bold"
                  sx={{ mb: "5px" }}
                >
                  Tax File Number
                </Typography>
                <Typography variant="h6" color={colors.grey[100]}>
                  {formData.tfn}
                </Typography>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <Typography
                  variant="h5"
                  color={colors.orangeAccent[400]}
                  fontWeight="bold"
                  sx={{ mb: "5px" }}
                >
                  Super Company
                </Typography>
                <Typography variant="h6" color={colors.grey[100]}>
                  {formData.superCompany}
                </Typography>
              </div>
            </>
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
};

export default TutorBankInfo;
