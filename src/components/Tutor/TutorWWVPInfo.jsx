import { React, useState } from "react";
import {
  Typography,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  TextField,
  Dialog,
  DialogContent,
  DialogTitle,
  useTheme,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { tokens } from "../../theme";
import dayjs from "dayjs";

const TutorWWVPInfo = ({
  formData,
  setFormData,
  wwvpFile,
  setWwvpFile,
  isEdit,
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [openWwvp, setOpenWwvp] = useState(false);
  const [wwvpUrl, setWwvpUrl] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDateChange = (name) => (date) => {
    setFormData({ ...formData, [name]: date });
  };

  const handleWwvpFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "application/pdf") {
      const fileUrl = URL.createObjectURL(file);
      setWwvpFile(file);
      setWwvpUrl(fileUrl);
    }
  };

  const handleCloseWwvpPDF = () => {
    setOpenWwvp(false);
  };

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h4">Working With Vulnerable People</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          {isEdit ? (
            <>
              <TextField
                name="wwvpName"
                label="Name"
                value={formData.wwvpName}
                onChange={handleChange}
              />
              <TextField
                name="wwvpRegNumber"
                label="Registration Number"
                value={formData.wwvpRegNumber}
                onChange={handleChange}
              />
              <TextField
                name="wwvpCardNumber"
                label="Card Number"
                value={formData.wwvpCardNumber}
                onChange={handleChange}
              />
              <DatePicker
                label="Expiry"
                onChange={handleDateChange("wwvpExpiry")}
                value={formData.wwvpExpiry ? dayjs(formData.wwvpExpiry) : null}
              />
              <Button variant="contained" component="label">
                UPLOAD WORKING WITH VULNERABLE PEOPLE DOCUMENT
                <input
                  type="file"
                  id="wwvpFileInput"
                  hidden
                  accept="application/pdf"
                  onChange={handleWwvpFileChange}
                />
              </Button>
              <Button
                disabled={!wwvpFile && !formData.wwvpFilePath}
                variant="outlined"
                onClick={() => {
                  if (wwvpFile) {
                    const fileUrl = URL.createObjectURL(wwvpFile);
                    setWwvpUrl(fileUrl);
                  } else if (formData.wwvpFilePath) {
                    setWwvpUrl(formData.wwvpFilePath);
                  }
                  setOpenWwvp(true);
                }}
              >
                VIEW
              </Button>
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
                  Name
                </Typography>
                <Typography variant="h6" color={colors.grey[100]}>
                  {formData.wwvpName}
                </Typography>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <Typography
                  variant="h5"
                  color={colors.orangeAccent[400]}
                  fontWeight="bold"
                  sx={{ mb: "5px" }}
                >
                  Registration Number
                </Typography>
                <Typography variant="h6" color={colors.grey[100]}>
                  {formData.wwvpRegNumber}
                </Typography>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <Typography
                  variant="h5"
                  color={colors.orangeAccent[400]}
                  fontWeight="bold"
                  sx={{ mb: "5px" }}
                >
                  Card Number
                </Typography>
                <Typography variant="h6" color={colors.grey[100]}>
                  {formData.wwvpCardNumber}
                </Typography>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <Typography
                  variant="h5"
                  color={colors.orangeAccent[400]}
                  fontWeight="bold"
                  sx={{ mb: "5px" }}
                >
                  Expiry
                </Typography>
                <Typography variant="h6" color={colors.grey[100]}>
                  {formData.wwvpExpiry
                    ? dayjs(formData.wwvpExpiry).format("MMMM D, YYYY")
                    : "N/A"}
                </Typography>
              </div>
              <iframe
                src={formData.wwvpFilePath}
                width="100%"
                height="500px"
                title="Working With Vulnerable People"
              />
            </>
          )}
        </Stack>
      </AccordionDetails>
      <Dialog
        open={openWwvp}
        onClose={handleCloseWwvpPDF}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h3">Working With Vulnerable People</Typography>
        </DialogTitle>
        <DialogContent>
          {wwvpUrl && (
            <iframe
              src={wwvpUrl}
              width="100%"
              height="500px"
              title="Working With Vulnerable People"
            />
          )}
        </DialogContent>
      </Dialog>
    </Accordion>
  );
};

export default TutorWWVPInfo;
