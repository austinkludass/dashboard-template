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

const TutorFirstAidInfo = ({
  formData,
  setFormData,
  firstAidFile,
  setFirstAidFile,
  isEdit,
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [firstAidUrl, setFirstAidUrl] = useState(null);
  const [openFirstAid, setOpenFirstAid] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDateChange = (name) => (date) => {
    setFormData({ ...formData, [name]: date });
  };

  const handleFirstAidFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "application/pdf") {
      const fileUrl = URL.createObjectURL(file);
      setFirstAidFile(file);
      setFirstAidUrl(fileUrl);
    }
  };

  const handleCloseFirstAidPDF = () => {
    setOpenFirstAid(false);
  };

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h4">First Aid</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          {isEdit ? (
            <>
              <DatePicker
                label="Course Date"
                onChange={handleDateChange("faCourseDate")}
                value={formData.faCourseDate ? dayjs(formData.faCourseDate) : null}
              />
              <TextField
                name="faProvider"
                label="Provider"
                value={formData.faProvider}
                onChange={handleChange}
              />
              <TextField
                name="faNumber"
                label="Number"
                value={formData.faNumber}
                onChange={handleChange}
              />
              <TextField
                name="faCourseType"
                label="Course Type"
                value={formData.faCourseType}
                onChange={handleChange}
              />
              <TextField
                name="faCourseCode"
                label="Course Code"
                value={formData.faCourseCode}
                onChange={handleChange}
              />
              <DatePicker
                label="Expiry"
                onChange={handleDateChange("faExpiry")}
                value={formData.faExpiry ? dayjs(formData.faExpiry) : null}
              />
              <Button variant="contained" component="label">
                UPLOAD FIRST AID DOCUMENT
                <input
                  type="file"
                  id="firstAidFileInput"
                  hidden
                  accept="application/pdf"
                  onChange={handleFirstAidFileChange}
                />
              </Button>
              <Button
                disabled={!firstAidFile && !formData.firstAidFilePath}
                variant="outlined"
                onClick={() => {
                  if (firstAidFile) {
                    const fileUrl = URL.createObjectURL(firstAidFile);
                    setFirstAidUrl(fileUrl);
                  } else if (formData.firstAidFilePath) {
                    setFirstAidUrl(formData.firstAidFilePath);
                  }
                  setOpenFirstAid(true);
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
                  Course Date
                </Typography>
                <Typography variant="h6" color={colors.grey[100]}>
                  {formData.faCourseDate
                    ? dayjs(formData.faCourseDate).format("MMMM D, YYYY")
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
                  Provider
                </Typography>
                <Typography variant="h6" color={colors.grey[100]}>
                  {formData.faProvider}
                </Typography>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <Typography
                  variant="h5"
                  color={colors.orangeAccent[400]}
                  fontWeight="bold"
                  sx={{ mb: "5px" }}
                >
                  Number
                </Typography>
                <Typography variant="h6" color={colors.grey[100]}>
                  {formData.faNumber}
                </Typography>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <Typography
                  variant="h5"
                  color={colors.orangeAccent[400]}
                  fontWeight="bold"
                  sx={{ mb: "5px" }}
                >
                  Course Type
                </Typography>
                <Typography variant="h6" color={colors.grey[100]}>
                  {formData.faCourseType}
                </Typography>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <Typography
                  variant="h5"
                  color={colors.orangeAccent[400]}
                  fontWeight="bold"
                  sx={{ mb: "5px" }}
                >
                  Course Code
                </Typography>
                <Typography variant="h6" color={colors.grey[100]}>
                  {formData.faCourseCode}
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
                  {formData.faExpiry
                    ? dayjs(formData.faExpiry).format("MMMM D, YYYY")
                    : "N/A"}
                </Typography>
              </div>
              <iframe
                src={formData.firstAidFilePath}
                width="100%"
                height="500px"
                title="First Aid"
              />
            </>
          )}
        </Stack>
      </AccordionDetails>
      <Dialog
        open={openFirstAid}
        onClose={handleCloseFirstAidPDF}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h3">First Aid</Typography>
        </DialogTitle>
        <DialogContent>
          {firstAidUrl && (
            <iframe
              src={firstAidUrl}
              width="100%"
              height="500px"
              title="First Aid"
            />
          )}
        </DialogContent>
      </Dialog>
    </Accordion>
  );
};

export default TutorFirstAidInfo;
