import { useEffect } from "react";
import {
  Stack,
  Typography,
  TextField,
  Grid2 as Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import FamilySchedulingPreference from "./FamilySchedulingPreference";

const relationshipOptions = [
  "Mother",
  "Father",
  "Guardian",
  "Sibling",
  "Grandparent",
  "Friend",
  "Other",
];

const splitName = (fullName = "") => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
};

const FamilyEmergencyStep = ({ formData, setFormData }) => {
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUsePrimaryChange = (event) => {
    const checked = event.target.checked;
    setFormData((prev) => {
      if (!checked) {
        return { ...prev, usePrimaryAsEmergency: false };
      }

      const { first, last } = splitName(prev.parentName);
      return {
        ...prev,
        usePrimaryAsEmergency: true,
        emergencyFirst: first,
        emergencyLast: last,
        emergencyPhone: prev.familyPhone,
        emergencyRelationship: "Guardian",
        emergencyRelationshipOther: "",
      };
    });
  };

  const handleSecondarySameAddressChange = (event) => {
    const checked = event.target.checked;
    setFormData((prev) => ({
      ...prev,
      secondaryContactSameAddress: checked,
      secondaryContactAddress: checked ? prev.familyAddress : prev.secondaryContactAddress,
    }));
  };

  useEffect(() => {
    if (!formData.usePrimaryAsEmergency) return;
    setFormData((prev) => {
      if (!prev.usePrimaryAsEmergency) return prev;

      const { first, last } = splitName(prev.parentName);
      if (
        prev.emergencyFirst === first &&
        prev.emergencyLast === last &&
        prev.emergencyPhone === prev.familyPhone
      ) {
        return prev;
      }

      return {
        ...prev,
        emergencyFirst: first,
        emergencyLast: last,
        emergencyPhone: prev.familyPhone,
      };
    });
  }, [formData.parentName, formData.familyPhone, formData.usePrimaryAsEmergency, setFormData]);

  useEffect(() => {
    if (!formData.secondaryContactSameAddress) return;
    setFormData((prev) => {
      if (!prev.secondaryContactSameAddress) return prev;
      if (prev.secondaryContactAddress === prev.familyAddress) return prev;
      return {
        ...prev,
        secondaryContactAddress: prev.familyAddress,
      };
    });
  }, [formData.familyAddress, formData.secondaryContactSameAddress, setFormData]);

  return (
    <Stack spacing={4}>
      <Stack spacing={2}>
        <Typography variant="h5" fontWeight="bold">
          Parent or Guardian Details
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ fontSize: "1.05rem" }}
        >
          The Primary guardian is the main point of contact for a family. They
          will receive reports, invoices and other communications directly from
          us.
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              name="parentName"
              label="Primary Guardian Full Name"
              value={formData.parentName}
              onChange={handleChange}
              required
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              name="familyEmail"
              label="Primary Guardian Email"
              value={formData.familyEmail}
              onChange={handleChange}
              required
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              name="familyPhone"
              label="Primary Guardian Phone"
              value={formData.familyPhone}
              onChange={handleChange}
              required
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              name="familyAddress"
              label="Home Address"
              value={formData.familyAddress}
              onChange={handleChange}
              required
              fullWidth
            />
          </Grid>
        </Grid>

        <Typography variant="h5" fontWeight="bold">
          Optional secondary contact
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ fontSize: "1.05rem" }}
        >
          A secondary guardian will also receive a copy of student reports,
          invoices and email communications.
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              name="secondaryContactName"
              label="Secondary Guardian Name"
              value={formData.secondaryContactName}
              onChange={handleChange}
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              name="secondaryContactEmail"
              label="Secondary Guardian Email"
              value={formData.secondaryContactEmail}
              onChange={handleChange}
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              name="secondaryContactPhone"
              label="Secondary Guardian Phone"
              value={formData.secondaryContactPhone}
              onChange={handleChange}
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              name="secondaryContactAddress"
              label="Secondary Guardian Address"
              value={formData.secondaryContactAddress}
              onChange={handleChange}
              fullWidth
              disabled={formData.secondaryContactSameAddress}
            />
          </Grid>
        </Grid>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.secondaryContactSameAddress}
              onChange={handleSecondarySameAddressChange}
            />
          }
          label="Secondary guardian address is the same as primary"
        />

        <FamilySchedulingPreference
          formData={formData}
          setFormData={setFormData}
        />
      </Stack>

      <Stack spacing={2}>
        <Typography variant="h5" fontWeight="bold">
          Emergency Contact
        </Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.usePrimaryAsEmergency}
              onChange={handleUsePrimaryChange}
            />
          }
          label="Use primary guardian as the emergency contact"
        />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              name="emergencyFirst"
              label="First Name"
              value={formData.emergencyFirst}
              onChange={handleChange}
              required
              fullWidth
              disabled={formData.usePrimaryAsEmergency}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              name="emergencyLast"
              label="Last Name"
              value={formData.emergencyLast}
              onChange={handleChange}
              required
              fullWidth
              disabled={formData.usePrimaryAsEmergency}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth required>
              <InputLabel id="emergency-relationship-label">
                Relationship
              </InputLabel>
              <Select
                labelId="emergency-relationship-label"
                name="emergencyRelationship"
                value={formData.emergencyRelationship}
                label="Relationship"
                onChange={handleChange}
                disabled={formData.usePrimaryAsEmergency}
              >
                {relationshipOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              name="emergencyPhone"
              label="Phone"
              value={formData.emergencyPhone}
              onChange={handleChange}
              required
              fullWidth
              disabled={formData.usePrimaryAsEmergency}
            />
          </Grid>
          {!formData.usePrimaryAsEmergency &&
            formData.emergencyRelationship === "Other" && (
            <Grid size={{ xs: 12 }}>
              <TextField
                name="emergencyRelationshipOther"
                label="Please specify relationship"
                value={formData.emergencyRelationshipOther}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
          )}
        </Grid>
      </Stack>
    </Stack>
  );
};

export default FamilyEmergencyStep;
