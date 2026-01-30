import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { addDoc, collection } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useParams } from "react-router-dom";
import { db, app } from "../../data/firebase";
import IntakeLayout from "../../components/intake/IntakeLayout";
import ChildrenStep from "../../components/intake/steps/ChildrenStep";
import ExistingFamilyStep from "../../components/intake/steps/ExistingFamilyStep";
import AvailabilityFormatter from "../../utils/AvailabilityFormatter";
import {
  createChild,
  createChildTouched,
  defaultFamilyData,
  DEFAULT_AVAILABILITY_THRESHOLD,
  formatDateValue,
  getAvailabilityHours,
  getClientMeta,
  getSchedulePreferenceFromFamily,
  getRequestedTutoringHours,
  hasAvailability,
  isWholeHourValue,
  mapExistingSubmissionToIntakeState,
  mapSchedulePreference,
  normalizeTutorIds,
  parseDateValue,
  validateAvailabilityWithinBounds,
  validateAvailability,
} from "./intakeUtils";

const functions = getFunctions(app, "australia-southeast1");

const splitFullName = (fullName = "") => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "", middle: "", last: "" };
  if (parts.length === 1) return { first: parts[0], middle: "", last: "" };
  if (parts.length === 2) return { first: parts[0], middle: "", last: parts[1] };
  return {
    first: parts[0],
    middle: parts.slice(1, -1).join(" "),
    last: parts[parts.length - 1],
  };
};

const getLastName = (fullName = "") => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : "";
};

const normalizeSubjects = (subjects) => {
  if (!Array.isArray(subjects)) return [];
  return subjects.map((subject) => {
    const resolvedId = subject?.id || subject?.subjectId || "";
    const preferredTutorIds = normalizeTutorIds(
      subject?.preferredTutorIds || subject?.preferredTutors
    );
    const blockedTutorIds = normalizeTutorIds(
      subject?.blockedTutorIds || subject?.blockedTutors
    );
    return {
      id: resolvedId,
      hours: subject?.hours ?? "",
      selected:
        typeof subject?.selected === "boolean"
          ? subject.selected
          : Boolean(resolvedId),
      preferredTutorIds,
      blockedTutorIds,
    };
  });
};

const mapStudentToChild = ({
  studentData,
  fallbackName,
  studentId,
  fallbackSchool = "",
  fallbackYearLevel = "",
  fallbackNotes = "",
  fallbackAllergiesAna = "",
  fallbackAllergiesNonAna = "",
  fallbackDateOfBirth = null,
  fallbackDoesCarryEpi = false,
  fallbackDoesAdminEpi = false,
  fallbackMaxHoursPerDay = "",
}) => {
  const base = createChild();
  const fallbackParts = splitFullName(fallbackName);
  const mappedSubjects = normalizeSubjects(studentData?.subjects);
  const dateOfBirth = parseDateValue(
    studentData?.dateOfBirth ||
      studentData?.dob ||
      studentData?.birthDate ||
      fallbackDateOfBirth
  );
  const doesCarryEpi =
    typeof studentData?.doesCarryEpi === "boolean"
      ? studentData.doesCarryEpi
      : typeof studentData?.epiPenCarried === "boolean"
        ? studentData.epiPenCarried
        : Boolean(fallbackDoesCarryEpi);
  const doesAdminEpi =
    typeof studentData?.doesAdminEpi === "boolean"
      ? studentData.doesAdminEpi
      : typeof studentData?.epiPenSelfAdmin === "boolean"
        ? studentData.epiPenSelfAdmin
        : Boolean(fallbackDoesAdminEpi);
  const allergiesAna =
    studentData?.allergiesAna ||
    studentData?.allergies?.ana ||
    fallbackAllergiesAna ||
    "";
  const allergiesNonAna =
    studentData?.allergiesNonAna ||
    studentData?.allergies?.nonAna ||
    studentData?.allergiesNonAnaphylactic ||
    fallbackAllergiesNonAna ||
    "";
  const school =
    studentData?.school ||
    studentData?.academicInfo?.school ||
    studentData?.academic?.school ||
    studentData?.schoolName ||
    fallbackSchool ||
    "";
  const yearLevel =
    studentData?.yearLevel ||
    studentData?.academicInfo?.yearLevel ||
    studentData?.academic?.yearLevel ||
    fallbackYearLevel ||
    "";
  const notes =
    studentData?.notes ||
    studentData?.academicInfo?.notes ||
    studentData?.academic?.notes ||
    fallbackNotes ||
    "";
  const maxHoursPerDay =
    studentData?.maxHoursPerDay ||
    studentData?.maxDailyHours ||
    studentData?.dailyMaxHours ||
    fallbackMaxHoursPerDay ||
    "";

  return {
    ...base,
    studentId,
    firstName: studentData?.firstName || fallbackParts.first,
    middleName: studentData?.middleName || fallbackParts.middle,
    lastName: studentData?.lastName || fallbackParts.last,
    dateOfBirth,
    allergiesAna,
    allergiesNonAna,
    doesCarryEpi,
    doesAdminEpi,
    school,
    yearLevel,
    notes,
    maxHoursPerDay,
    preferredStart: parseDateValue(studentData?.preferredStart),
    trialNotes: studentData?.trialNotes || "",
    canOfferFood:
      typeof studentData?.canOfferFood === "boolean"
        ? studentData.canOfferFood
        : base.canOfferFood,
    avoidFoods: studentData?.avoidFoods || "",
    questions: studentData?.questions || "",
    subjects: mappedSubjects.length > 0 ? mappedSubjects : base.subjects,
    availability: studentData?.availability || {},
    trialAvailability: studentData?.trialAvailability || {},
  };
};

const ExistingFamilyIntake = () => {
  const { familyId } = useParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [familySummary, setFamilySummary] = useState(null);
  const [familyForm, setFamilyForm] = useState({
    parentName: "",
    parentEmail: "",
    schedulePreference: "",
  });
  const [children, setChildren] = useState([createChild()]);
  const [childrenTouched, setChildrenTouched] = useState([
    createChildTouched(),
  ]);
  const [hydratedFromSubmission, setHydratedFromSubmission] = useState(false);
  const [latestSubmissionMeta, setLatestSubmissionMeta] = useState(null);
  const hasUserChangesRef = useRef(false);
  const baseSnapshotRef = useRef(null);

  const steps = useMemo(
    () => [{ label: "Family" }, { label: "Children" }],
    []
  );
  const resolvedParentName =
    familyForm.parentName.trim() || familySummary?.parentName || "";
  const resolvedParentEmail =
    familyForm.parentEmail.trim() || familySummary?.parentEmail || "";
  const familyLastName = getLastName(resolvedParentName);
  const latestSubmissionDate = latestSubmissionMeta?.submittedAt
    ? parseDateValue(latestSubmissionMeta.submittedAt)
    : null;
  const latestSubmissionLabel = latestSubmissionDate
    ? latestSubmissionDate.toLocaleString("en-AU")
    : "";
  const latestSubmissionMessage = latestSubmissionLabel
    ? `Loaded your last submission from ${latestSubmissionLabel}.`
    : "Loaded your last submission.";

  const markDirty = () => {
    hasUserChangesRef.current = true;
  };

  const handleFamilyFormChange = (nextForm) => {
    markDirty();
    setFamilyForm(nextForm);
  };

  const handleChildrenDataChange = (updater) => {
    markDirty();
    setChildren(updater);
  };

  const handleChildrenTouchedChange = (updater) => {
    markDirty();
    setChildrenTouched(updater);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentStep]);

  useEffect(() => {
    let isMounted = true;
    hasUserChangesRef.current = false;
    baseSnapshotRef.current = null;
    setHydratedFromSubmission(false);
    setLatestSubmissionMeta(null);

    const fetchFamily = async () => {
      if (!familyId) {
        setLoadError("Missing family id.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError("");
      try {
        // Fetch family, students, and latest submission via Cloud Function
        const getSubmission = httpsCallable(functions, "getExistingFamilySubmission");
        const result = await getSubmission({ familyId });
        const { found, submission, family: familyData, students: studentDocs } = result.data;

        if (!familyData) {
          setLoadError("We couldn't find that family.");
          setIsLoading(false);
          return;
        }
        if (!isMounted) return;

        setFamilySummary({ ...familyData, id: familyId });
        const schedulePreference =
          getSchedulePreferenceFromFamily(familyData) ||
          defaultFamilyData.schedulePreference;

        const baseFamilyForm = {
          parentName: familyData.parentName || "",
          parentEmail: familyData.parentEmail || "",
          schedulePreference,
        };

        // Build student map from Cloud Function response
        const studentMap = new Map(
          (studentDocs || []).map((s) => [s.id, s])
        );

        const familyStudents = Array.isArray(familyData.students)
          ? familyData.students
          : [];
        const normalizedStudents = familyStudents.map((student) => {
          if (!student) {
            return { id: "", name: "" };
          }
          if (typeof student === "string") {
            return { id: student, name: "" };
          }
          if (typeof student?.id === "string") {
            return { id: student.id, name: student.name || "" };
          }
          return { id: student.studentId || "", name: student.name || "" };
        });

        let baseChildren = [];
        if (normalizedStudents.length > 0) {
          if (!isMounted) return;

          baseChildren = normalizedStudents.map((student) => {
            const fallbackName = student.name || "";
            const studentData = studentMap.get(student.id) || null;
            return mapStudentToChild({
              studentData,
              fallbackName,
              studentId: student.id || "",
              fallbackSchool: student.school,
              fallbackYearLevel: student.yearLevel,
              fallbackNotes: student.notes,
              fallbackAllergiesAna: student.allergiesAna,
              fallbackAllergiesNonAna: student.allergiesNonAna,
              fallbackDateOfBirth: student.dateOfBirth,
              fallbackDoesCarryEpi: student.doesCarryEpi,
              fallbackDoesAdminEpi: student.doesAdminEpi,
              fallbackMaxHoursPerDay: student.maxHoursPerDay,
            });
          });
        }

        if (baseChildren.length === 0) {
          baseChildren = [createChild()];
        }

        baseSnapshotRef.current = {
          familyForm: baseFamilyForm,
          children: baseChildren,
        };

        let resolvedFamilyForm = baseFamilyForm;
        let resolvedChildren = baseChildren;
        let didHydrate = false;
        const latestSubmission = found ? submission : null;

        if (!isMounted) return;

        if (latestSubmission && !hasUserChangesRef.current) {
          const submissionState = mapExistingSubmissionToIntakeState(
            latestSubmission
          );
          const submissionFamilyForm = submissionState.familyForm || {};
          const submissionChildren = submissionState.children || [];
          const resolvedSchedulePreference =
            submissionFamilyForm.schedulePreference ||
            baseFamilyForm.schedulePreference ||
            defaultFamilyData.schedulePreference;
          resolvedFamilyForm = {
            ...baseFamilyForm,
            ...submissionFamilyForm,
            schedulePreference: resolvedSchedulePreference,
          };
          if (submissionChildren.length > 0) {
            resolvedChildren = submissionChildren;
          }
          didHydrate = true;
          setLatestSubmissionMeta({
            id: latestSubmission.id,
            submittedAt: latestSubmission.meta?.submittedAt || null,
          });
        }

        if (!hasUserChangesRef.current) {
          setFamilyForm(resolvedFamilyForm);
          setChildren(resolvedChildren);
          setChildrenTouched(resolvedChildren.map(() => createChildTouched()));
        }

        setHydratedFromSubmission(didHydrate);
        if (!didHydrate) setLatestSubmissionMeta(null);
      } catch (error) {
        if (isMounted) {
          setLoadError(
            error?.message
              ? `Unable to load family details: ${error.message}`
              : "Unable to load family details right now."
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchFamily();

    return () => {
      isMounted = false;
    };
  }, [familyId]);

  const buildSubmissionPayload = () => {
    const schedulePreference =
      familyForm.schedulePreference || defaultFamilyData.schedulePreference;
    return {
      family: {
        familyId: familyId || "",
        parentName: resolvedParentName,
        parentLastName: familyLastName,
        parentEmail: resolvedParentEmail,
        parentPhone: familySummary?.parentPhone || "",
        schedulePreference,
        familySchedulingPreferences: mapSchedulePreference(schedulePreference),
      },
      children: children.map((child) => ({
        studentId: child.studentId || "",
        firstName: child.firstName.trim(),
        middleName: child.middleName.trim(),
        lastName: child.lastName.trim(),
        dateOfBirth: formatDateValue(child.dateOfBirth),
        allergiesAna: child.allergiesAna,
        allergiesNonAna: child.allergiesNonAna,
        doesCarryEpi: Boolean(child.doesCarryEpi),
        doesAdminEpi: Boolean(child.doesAdminEpi),
        school: child.school,
        yearLevel: child.yearLevel,
        notes: child.notes,
        maxHoursPerDay: child.maxHoursPerDay,
        canOfferFood: Boolean(child.canOfferFood),
        avoidFoods: child.avoidFoods,
        questions: child.questions,
        availability: hasAvailability(child.availability)
          ? AvailabilityFormatter(child.availability)
          : {},
        subjects: child.subjects
          .filter((subject) => subject.id)
          .map((subject) => ({
            id: subject.id,
            hours: subject.hours ? String(subject.hours) : "0",
            selected: Boolean(subject.selected),
            preferredTutorIds: normalizeTutorIds(
              subject.preferredTutorIds || subject.preferredTutors
            ),
            blockedTutorIds: normalizeTutorIds(
              subject.blockedTutorIds || subject.blockedTutors
            ),
          })),
      })),
      meta: {
        status: "existing",
        source: "existing-family-intake",
        submittedAt: new Date().toISOString(),
        client: getClientMeta(),
      },
    };
  };

  const validateFamily = () => {
    const nextErrors = [];

    if (!familyForm.parentName.trim())
      nextErrors.push("Primary guardian name is required.");
    if (!familyForm.parentEmail.trim())
      nextErrors.push("Primary guardian email is required.");

    return nextErrors;
  };

  const validateForm = () => {
    const nextErrors = [];

    if (children.length < 1) nextErrors.push("Please add at least one child.");

    children.forEach((child, index) => {
      const label = `Child ${index + 1}`;
      if (!child.firstName.trim())
        nextErrors.push(`${label}: first name is required.`);
      if (!child.lastName.trim())
        nextErrors.push(`${label}: last name is required.`);
      if (!child.dateOfBirth)
        nextErrors.push(`${label}: date of birth is required.`);
      if (!child.allergiesNonAna.trim())
        nextErrors.push(`${label}: Allergies (Non-Anaphylactic) is required.`);
      if (!child.school.trim())
        nextErrors.push(`${label}: school is required.`);
      if (!child.yearLevel.trim())
        nextErrors.push(`${label}: year level is required.`);
      if (!hasAvailability(child.availability))
        nextErrors.push(`${label}: add regular availability.`);

      if (hasAvailability(child.availability)) {
        nextErrors.push(
          ...validateAvailability(
            child.availability,
            `${label} regular availability`
          )
        );
        nextErrors.push(
          ...validateAvailabilityWithinBounds(
            child.availability,
            `${label} regular availability`
          )
        );
      }

      child.subjects.forEach((subject) => {
        if (!subject?.id) return;
        if (typeof subject?.selected === "boolean" && !subject.selected) return;
        if (!isWholeHourValue(subject.hours)) {
          nextErrors.push(
            `${label}: tutoring hours must be whole numbers (1, 2, 3...).`
          );
        }
      });
    });

    return nextErrors;
  };

  const handleNext = () => {
    if (currentStep !== 0) {
      setErrors([]);
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
      return;
    }

    const validationErrors = validateFamily();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    const validationErrors = validateForm();

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const formatHoursLabel = (hours) => {
      if (!Number.isFinite(hours)) return "0";
      return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
    };
    const getChildLabel = (child, index) => {
      const name = [child.firstName, child.lastName].filter(Boolean).join(" ");
      return name || `Child ${index + 1}`;
    };
    const lowAvailabilityChildren = children
      .map((child, index) => {
        const availabilityHours = getAvailabilityHours(child.availability);
        const requestedHours = getRequestedTutoringHours(child.subjects);
        if (requestedHours <= 0) return null;
        if (availabilityHours >= DEFAULT_AVAILABILITY_THRESHOLD) return null;
        if (availabilityHours >= requestedHours) return null;
        return {
          label: getChildLabel(child, index),
          hours: availabilityHours,
        };
      })
      .filter(Boolean);

    if (lowAvailabilityChildren.length > 0) {
      const summary = lowAvailabilityChildren
        .map(
          (child) => `${child.label}: ${formatHoursLabel(child.hours)} hours`
        )
        .join(", ");
      const message =
        lowAvailabilityChildren.length === 1
          ? `Are you sure that you want to submit this form with only ${formatHoursLabel(
              lowAvailabilityChildren[0].hours
            )} hours of availability? This may make it tricky for us to place your family effectively.`
          : `Are you sure that you want to submit this form with only ${summary} of availability? This may make it tricky for us to place your family effectively.`;
      if (!window.confirm(message)) {
        return;
      }
    }

    setErrors([]);
    setIsSubmitting(true);

    try {
      const payload = buildSubmissionPayload();
      await addDoc(collection(db, "intakeSubmissions"), payload);
      setSubmitted(true);
    } catch (error) {
      setErrors(["Submission failed. Please try again in a moment."]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetToFamily = () => {
    const baseSnapshot = baseSnapshotRef.current;
    if (!baseSnapshot) return;
    hasUserChangesRef.current = false;
    setHydratedFromSubmission(false);
    setLatestSubmissionMeta(null);
    setErrors([]);
    setFamilyForm(baseSnapshot.familyForm);
    setChildren(baseSnapshot.children);
    setChildrenTouched(baseSnapshot.children.map(() => createChildTouched()));
  };

  const handleStartNew = () => {
    setSubmitted(false);
    setCurrentStep(0);
    setErrors([]);
  };

  if (submitted) {
    return (
      <Box sx={{ px: { xs: 2, md: 6 }, py: { xs: 4, md: 8 } }}>
        <Stack spacing={3} sx={{ maxWidth: 700, mx: "auto" }}>
          <Typography variant="h3" fontWeight="bold">
            Thanks! Your updates are in.
          </Typography>
          <Typography variant="body1" color="text.secondary">
            We'll review the details and confirm any changes shortly.
          </Typography>
          <Button variant="contained" onClick={handleStartNew}>
            Update another family
          </Button>
        </Stack>
      </Box>
    );
  }

  const titleText = familyLastName
    ? `Existing intake for ${familyLastName} family`
    : "Existing family intake";

  return (
    <IntakeLayout
      title={titleText}
      introTitle={familyLastName ? `${familyLastName} Family` : "Existing Family"}
      introBody={
        <>
          Welcome back to Wise Minds for 2026! We're excited to have you.
          <br />
          <br />
          Please fill in this form with all the details about what you're
          requesting that your family receives tutoring in for the coming
          semester. Please pay careful attention to the{" "}
          <strong>year level</strong>, which you should update to reflect the
          year for your children in 2026.
        </>
      }
      steps={steps}
      currentStep={currentStep}
      errors={errors}
      onNext={handleNext}
      onBack={handleBack}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      isLastStep={currentStep === steps.length - 1}
    >
      <Stack spacing={3}>
        {isLoading && (
          <Alert severity="info">
            <Stack direction="row" spacing={2} alignItems="center">
              <CircularProgress size={16} />
              <Typography variant="body2">Loading family details...</Typography>
            </Stack>
          </Alert>
        )}
        {loadError && <Alert severity="error">{loadError}</Alert>}
        {hydratedFromSubmission && (
          <Alert severity="info">
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "flex-start", sm: "center" }}
            >
              <Typography variant="body2">{latestSubmissionMessage}</Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={handleResetToFamily}
              >
                Reset to family data
              </Button>
            </Stack>
          </Alert>
        )}
        <Box>
          <Typography variant="overline" color="text.secondary">
            {titleText}
          </Typography>
          <Typography variant="h5" fontWeight="bold">
            {familyLastName ? `${familyLastName} Family` : "Existing Family"}
          </Typography>
        </Box>
        {currentStep === 0 && (
          <ExistingFamilyStep
            formData={familyForm}
            setFormData={handleFamilyFormChange}
          />
        )}
        {currentStep === 1 && (
          <ChildrenStep
            childrenData={children}
            setChildrenData={handleChildrenDataChange}
            childrenTouched={childrenTouched}
            setChildrenTouched={handleChildrenTouchedChange}
            createChild={createChild}
            createChildTouched={createChildTouched}
            showTrialStep={false}
            allowRemoveLastChild={true}
            readOnlyIdentity={true}
            allowAddChild={false}
          />
        )}
      </Stack>
    </IntakeLayout>
  );
};

export default ExistingFamilyIntake;
