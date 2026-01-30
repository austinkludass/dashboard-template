import { useState } from "react";
import {
  Stack,
  Typography,
  Button,
  Divider,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import StudentBasicsStep from "./StudentBasicsStep";
import AcademicNeedsStep from "./AcademicNeedsStep";
import TrialStep from "./TrialStep";
import RegularAvailabilityStep from "./RegularAvailabilityStep";
import StudentAdditionalInfo from "../../student/StudentAdditionalInfo";
import { getRequestedTutoringHours } from "../../../scenes/Intake/intakeUtils";

const getChildLabel = (child, index) => {
  const name = [child.firstName, child.lastName].filter(Boolean).join(" ");
  return name ? `Child ${index + 1}: ${name}` : `Child ${index + 1}`;
};

const hasMissingBasics = (child) =>
  !child.firstName.trim() || !child.lastName.trim() || !child.dateOfBirth;

const ChildrenStep = ({
  childrenData,
  setChildrenData,
  childrenTouched,
  setChildrenTouched,
  createChild,
  createChildTouched,
  showTrialStep = true,
  allowRemoveLastChild = false,
  readOnlyIdentity = false,
  allowAddChild = true,
  showTutorPreferences = true,
}) => {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const addChild = () => {
    const nextIndex = childrenData.length;
    setChildrenData((prev) => [...prev, createChild()]);
    setChildrenTouched((prev) => [...prev, createChildTouched()]);
    setExpandedIndex(nextIndex);
  };

  const removeChild = (index) => {
    setChildrenData((prev) => prev.filter((_, i) => i !== index));
    setChildrenTouched((prev) => prev.filter((_, i) => i !== index));
  };

  const updateChild = (index, updater) => {
    setChildrenData((prev) =>
      prev.map((child, i) => (i === index ? updater(child) : child))
    );
  };

  const setChildFormData = (index) => (nextData) => {
    updateChild(index, () => nextData);
  };

  const setChildSubjects = (index) => (nextSubjects) => {
    updateChild(index, (child) => ({ ...child, subjects: nextSubjects }));
  };

  const setChildAvailability = (index) => (nextAvailability) => {
    updateChild(index, (child) => ({ ...child, availability: nextAvailability }));
  };

  const setChildTrialAvailability = (index) => (nextAvailability) => {
    updateChild(index, (child) => ({ ...child, trialAvailability: nextAvailability }));
  };

  const setChildTouched = (index) => (nextTouched) => {
    setChildrenTouched((prev) =>
      prev.map((touched, i) => (i === index ? nextTouched : touched))
    );
  };

  return (
    <Stack spacing={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" fontWeight="bold">
          Children Details
        </Typography>
        {allowAddChild && (
          <Button variant="outlined" onClick={addChild}>
            Add another child
          </Button>
        )}
      </Box>

      {childrenData.map((child, index) => (
        <Accordion
          key={index}
          expanded={expandedIndex === index}
          onChange={(_, isExpanded) =>
            setExpandedIndex(isExpanded ? index : null)
          }
          sx={{ borderRadius: 2 }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              "& .MuiAccordionSummary-content": {
                alignItems: "center",
              },
            }}
          >
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              gap={2}
              width="100%"
            >
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {getChildLabel(child, index)}
                </Typography>
                {hasMissingBasics(child) && (
                  <Typography variant="body2" color="text.secondary">
                    Missing basic details
                  </Typography>
                )}
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                {hasMissingBasics(child) && (
                  <Chip label="Incomplete" color="warning" size="small" />
                )}
                <Button
                  variant="text"
                  color="error"
                  component="span"
                  onClick={(event) => {
                    event.stopPropagation();
                    removeChild(index);
                  }}
                  onFocus={(event) => event.stopPropagation()}
                  disabled={!allowRemoveLastChild && childrenData.length === 1}
                >
                  Remove
                </Button>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={3}>
              <StudentBasicsStep
                formData={child}
                setFormData={setChildFormData(index)}
                touched={childrenTouched[index] || createChildTouched()}
                setTouched={setChildTouched(index)}
                readOnlyIdentity={readOnlyIdentity}
              />

              <Divider />

              <AcademicNeedsStep
                formData={child}
                setFormData={setChildFormData(index)}
                subjects={child.subjects}
                setSubjects={setChildSubjects(index)}
                showTutorPreferences={showTutorPreferences}
              />

              {showTrialStep && (
                <>
                  <Divider />
                  <TrialStep
                    formData={child}
                    setFormData={setChildFormData(index)}
                    trialAvailability={child.trialAvailability}
                    setTrialAvailability={setChildTrialAvailability(index)}
                  />
                </>
              )}

              <Divider />

              <RegularAvailabilityStep
                availability={child.availability}
                setAvailability={setChildAvailability(index)}
                requestedTutoringHours={getRequestedTutoringHours(
                  child.subjects
                )}
              />

              <Divider />

              <Stack spacing={2}>
                <Typography variant="h5" fontWeight="bold">
                  Child Preferences
                </Typography>
                <StudentAdditionalInfo
                  formData={child}
                  setFormData={setChildFormData(index)}
                  isEdit={true}
                  includeHowUserHeard={false}
                />
              </Stack>
            </Stack>
          </AccordionDetails>
        </Accordion>
      ))}

      {allowAddChild && (
        <Box display="flex" justifyContent="flex-end">
          <Button variant="outlined" onClick={addChild}>
            Add another child
          </Button>
        </Box>
      )}
    </Stack>
  );
};

export default ChildrenStep;
