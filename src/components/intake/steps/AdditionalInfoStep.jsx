import {
  Stack,
  Typography,
  TextField,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
const AdditionalInfoStep = ({ formData, setFormData }) => {
  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleConsentChange = (event) => {
    setFormData({ ...formData, consentAccepted: event.target.checked });
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h5" fontWeight="bold">
        Additional Information
      </Typography>

      <TextField
        name="howUserHeard"
        label="How did you hear about Wise Minds Canberra?"
        value={formData.howUserHeard}
        onChange={handleChange}
      />

      <TextField
        name="additionalNotes"
        label="Additional notes"
        value={formData.additionalNotes}
        onChange={handleChange}
        multiline
        minRows={3}
      />

      <FormControlLabel
        control={
          <Checkbox
            checked={formData.consentAccepted}
            onChange={handleConsentChange}
          />
        }
        label={
          <Typography variant="body2">
            I agree to the Wise Minds terms and conditions. You can read them at{" "}
            <a
              href="https://www.wisemindscanberra.com/terms-and-conditions"
              target="_blank"
              rel="noreferrer"
            >
              this link
            </a>
            .
          </Typography>
        }
      />
    </Stack>
  );
};

export default AdditionalInfoStep;
