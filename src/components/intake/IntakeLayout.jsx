import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Stack,
  Button,
  Typography,
  Alert,
  LinearProgress,
} from "@mui/material";

const IntakeLayout = ({
  title = "Student Intake Form",
  introTitle = "Welcome to the new student form",
  introBody = "This form covers a variety of core information required for the student to get started at Wise Minds! Please fill out this form to the best of your knowledge and do not hesitate to reach out if you have any questions.",
  steps,
  currentStep,
  errors,
  children,
  onNext,
  onBack,
  onSubmit,
  isSubmitting,
  isLastStep,
}) => {
  return (
    <Box sx={{ px: { xs: 2, md: 6 }, py: { xs: 3, md: 5 } }}>
      <Stack spacing={3} sx={{ maxWidth: 980, mx: "auto" }}>
        <Box display="flex" justifyContent="center">
          <Box
            component="img"
            src="../../assets/dashboardlogo.png"
            alt="Wise Minds logo"
            sx={{ width: 56, height: 56 }}
          />
        </Box>
        <Box>
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            {title}
          </Typography>
          <Paper
            variant="outlined"
            sx={{ p: { xs: 2, md: 3 }, mt: 2, bgcolor: "background.paper" }}
          >
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              {introTitle}
            </Typography>
            <Typography variant="body1" sx={{ fontSize: "1.05rem" }}>
              {introBody}
            </Typography>
          </Paper>
        </Box>

        <Stepper activeStep={currentStep} alternativeLabel>
          {steps.map((step) => (
            <Step key={step.label}>
              <StepLabel>{step.label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {isSubmitting && <LinearProgress />}

        {errors.length > 0 && (
          <Alert severity="error">
            <Typography variant="subtitle1" fontWeight="bold">
              Please review the following:
            </Typography>
            <ul>
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </Alert>
        )}

        <Paper sx={{ p: { xs: 2, md: 4 } }}>{children}</Paper>

        <Box display="flex" justifyContent="space-between" gap={2}>
          <Button
            variant="outlined"
            onClick={onBack}
            disabled={currentStep === 0 || isSubmitting}
          >
            Back
          </Button>
          {isLastStep ? (
            <Button
              variant="contained"
              onClick={onSubmit}
              disabled={isSubmitting}
            >
              Submit
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={onNext}
              disabled={isSubmitting}
            >
              Next
            </Button>
          )}
        </Box>
      </Stack>
    </Box>
  );
};

export default IntakeLayout;
