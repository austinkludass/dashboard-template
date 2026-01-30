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
  FormControlLabel,
  Switch,
  useTheme,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { tokens } from "../../theme";

const TutorPoliceCheckInfo = ({
  formData,
  setFormData,
  policeCheckFile,
  setPoliceCheckFile,
  isEdit,
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [policeCheckUrl, setPoliceCheckUrl] = useState(null);
  const [openPoliceCheck, setOpenPoliceCheck] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSwitchChange = (e) => {
    setFormData({ ...formData, pcIsNational: e.target.checked });
  };

  const handlePoliceCheckFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "application/pdf") {
      const fileUrl = URL.createObjectURL(file);
      setPoliceCheckFile(file);
      setPoliceCheckUrl(fileUrl);
    }
  };

  const handleClosePoliceCheckPDF = () => {
    setOpenPoliceCheck(false);
  };

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h4">Police Check</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          {isEdit ? (
            <>
              <TextField
                name="pcName"
                label="Name"
                value={formData.pcName}
                onChange={handleChange}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.pcIsNational}
                    onChange={handleSwitchChange}
                  />
                }
                label="National Police Check"
              />
              <TextField
                name="pcAddress"
                label="Address"
                value={formData.pcAddress}
                onChange={handleChange}
              />
              <TextField
                name="pcResult"
                label="Result"
                value={formData.pcResult}
                onChange={handleChange}
              />
              <TextField
                name="pcAPPRef"
                label="APP Reference"
                value={formData.pcAPPRef}
                onChange={handleChange}
              />
              <Button variant="contained" component="label">
                UPLOAD POLICE CHECK DOCUMENT
                <input
                  type="file"
                  id="policeCheckFileInput"
                  hidden
                  accept="application/pdf"
                  onChange={handlePoliceCheckFileChange}
                />
              </Button>
              <Button
                disabled={!policeCheckFile && !formData.policeCheckFilePath}
                variant="outlined"
                onClick={() => {
                  if (policeCheckFile) {
                    const fileUrl = URL.createObjectURL(policeCheckFile);
                    setPoliceCheckUrl(fileUrl);
                  } else if (formData.policeCheckFilePath) {
                    setPoliceCheckUrl(formData.policeCheckFilePath);
                  }
                  setOpenPoliceCheck(true);
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
                  {formData.pcName}
                </Typography>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <Typography
                  variant="h5"
                  color={colors.orangeAccent[400]}
                  fontWeight="bold"
                  sx={{ mb: "5px" }}
                >
                  National
                </Typography>
                <Typography variant="h6" color={colors.grey[100]}>
                  {formData.pcIsNational ? "Yes" : "No"}
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
                  {formData.pcAddress}
                </Typography>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <Typography
                  variant="h5"
                  color={colors.orangeAccent[400]}
                  fontWeight="bold"
                  sx={{ mb: "5px" }}
                >
                  Result
                </Typography>
                <Typography variant="h6" color={colors.grey[100]}>
                  {formData.pcResult}
                </Typography>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <Typography
                  variant="h5"
                  color={colors.orangeAccent[400]}
                  fontWeight="bold"
                  sx={{ mb: "5px" }}
                >
                  Reference
                </Typography>
                <Typography variant="h6" color={colors.grey[100]}>
                  {formData.pcAPPRef}
                </Typography>
              </div>
              <iframe
                src={formData.policeCheckFilePath}
                width="100%"
                height="500px"
                title="Police Check"
              />
            </>
          )}
        </Stack>
      </AccordionDetails>
      <Dialog
        open={openPoliceCheck}
        onClose={handleClosePoliceCheckPDF}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h3">Police Check</Typography>
        </DialogTitle>
        <DialogContent>
          {policeCheckUrl && (
            <iframe
              src={policeCheckUrl}
              width="100%"
              height="500px"
              title="Police Check"
            />
          )}
        </DialogContent>
      </Dialog>
    </Accordion>
  );
};

export default TutorPoliceCheckInfo;
