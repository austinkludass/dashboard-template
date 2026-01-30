import studentAvailabilityBounds from "../../components/student/studentAvailabilityBounds";

const defaultFamilyData = {
  parentName: "",
  familyEmail: "",
  familyPhone: "",
  familyAddress: "",
  secondaryContactName: "",
  secondaryContactEmail: "",
  secondaryContactPhone: "",
  secondaryContactAddress: "",
  secondaryContactSameAddress: true,
  schedulePreference: "no_preference",
  usePrimaryAsEmergency: false,
  emergencyFirst: "",
  emergencyLast: "",
  emergencyRelationship: "",
  emergencyRelationshipOther: "",
  emergencyPhone: "",
  howUserHeard: "",
  homeLocation: "",
  additionalNotes: "",
  consentAccepted: false,
};

const schedulePreferenceValues = [
  "same_day",
  "back_to_back",
  "same_time_within_hour",
  "no_preference",
];

const DEFAULT_AVAILABILITY_THRESHOLD = 5;

const hasAvailability = (availability) =>
  Object.values(availability || {}).some((slots) => slots?.length);

const formatDateValue = (value) =>
  value && typeof value.toISOString === "function" ? value.toISOString() : null;

const parseDateValue = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value?.seconds === "number") {
    return new Date(value.seconds * 1000);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const defaultSubjects = [
  {
    id: "",
    hours: "",
    selected: true,
    preferredTutorIds: [],
    blockedTutorIds: [],
  },
];

const normalizeTutorIds = (value) => {
  if (!value) return [];
  if (!Array.isArray(value)) return [];
  const ids = value
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        return item.id || item.tutorId || "";
      }
      return "";
    })
    .filter(Boolean);
  return Array.from(new Set(ids));
};
const getClientMeta = () => {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {};
  }

  const userAgent = navigator.userAgent || "";
  const userAgentData = navigator.userAgentData;
  const platform = userAgentData?.platform || navigator.platform || "";
  const language = navigator.language || "";
  const timeZone = (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    } catch (error) {
      return "";
    }
  })();

  const viewportWidth = window.innerWidth || null;
  const viewportHeight = window.innerHeight || null;
  const screenWidth = window.screen?.width || null;
  const screenHeight = window.screen?.height || null;
  const devicePixelRatio = window.devicePixelRatio || null;
  const mobile =
    typeof userAgentData?.mobile === "boolean"
      ? userAgentData.mobile
      : /Mobi|Android/i.test(userAgent);

  return {
    userAgent,
    platform,
    language,
    timeZone,
    viewport: { width: viewportWidth, height: viewportHeight },
    screen: { width: screenWidth, height: screenHeight },
    devicePixelRatio,
    mobile,
  };
};

const normalizeIntakeSubjects = (subjects) => {
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

const parseHoursValue = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
};

const isWholeHourValue = (value) => {
  const parsed = parseHoursValue(value);
  if (parsed === null) return true;
  return Number.isInteger(parsed);
};

const resolveSlotDate = (value) => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value === "string" && value.includes(":")) {
    const [hours, minutes] = value.split(":").map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }
  return null;
};

const formatTimeLabel = (value) =>
  value.toLocaleTimeString("en-AU", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

const getAvailabilityBoundsForDay = (day, bounds = studentAvailabilityBounds) => {
  const dayBounds = bounds?.[day];
  if (!dayBounds) return null;
  const start = resolveSlotDate(dayBounds.start);
  const end = resolveSlotDate(dayBounds.end);
  if (!start || !end) return null;
  return { start, end };
};

const validateAvailabilityWithinBounds = (
  availability,
  label,
  bounds = studentAvailabilityBounds
) => {
  const messages = [];
  const reported = new Set();

  Object.entries(availability || {}).forEach(([day, slots]) => {
    if (!Array.isArray(slots) || slots.length === 0) return;
    const dayBounds = getAvailabilityBoundsForDay(day, bounds);
    if (!dayBounds) return;

    const outOfBounds = slots.some((slot) => {
      const start = resolveSlotDate(slot?.start);
      const end = resolveSlotDate(slot?.end);
      if (!start || !end) return false;
      return start < dayBounds.start || end > dayBounds.end;
    });

    if (outOfBounds) {
      const key = `${label}-${day}-outside-hours`;
      if (!reported.has(key)) {
        const openHours = `${formatTimeLabel(dayBounds.start)} to ${formatTimeLabel(
          dayBounds.end
        )}`;
        messages.push(
          `${label}: ${day} has times outside Wise Minds opening hours (${openHours}).`
        );
        reported.add(key);
      }
    }
  });

  return messages;
};

const getAvailabilityHours = (availability) => {
  let total = 0;
  Object.values(availability || {}).forEach((slots) => {
    if (!Array.isArray(slots)) return;
    slots.forEach((slot) => {
      const start = resolveSlotDate(slot?.start);
      const end = resolveSlotDate(slot?.end);
      if (!start || !end) return;
      const durationMs = end.getTime() - start.getTime();
      if (durationMs > 0) {
        total += durationMs / (1000 * 60 * 60);
      }
    });
  });
  return total;
};

const getRequestedTutoringHours = (subjects = []) => {
  if (!Array.isArray(subjects)) return 0;
  return subjects.reduce((total, subject) => {
    if (!subject?.id) return total;
    if (typeof subject?.selected === "boolean" && !subject.selected) {
      return total;
    }
    const hours = parseHoursValue(subject?.hours);
    if (!Number.isFinite(hours) || hours <= 0) return total;
    return total + hours;
  }, 0);
};

const createChild = (overrides = {}) => ({
  firstName: "",
  middleName: "",
  lastName: "",
  dateOfBirth: null,
  allergiesAna: "",
  allergiesNonAna: "",
  doesCarryEpi: false,
  doesAdminEpi: false,
  school: "",
  yearLevel: "",
  notes: "",
  maxHoursPerDay: "",
  preferredStart: null,
  trialNotes: "",
  canOfferFood: true,
  avoidFoods: "",
  questions: "",
  subjects: defaultSubjects.map((subject) => ({ ...subject })),
  availability: {},
  trialAvailability: {},
  ...overrides,
});

const mapExistingSubmissionToIntakeState = (submission = {}) => {
  const family = submission.family || {};
  const familyForm = {
    parentName: family.parentName || family.parentFullName || "",
    parentEmail: family.parentEmail || family.familyEmail || "",
    schedulePreference: getSchedulePreferenceFromFamily(family) || "",
  };

  const children = Array.isArray(submission.children)
    ? submission.children.map((child) => {
        const base = createChild();
        const subjects = normalizeIntakeSubjects(child?.subjects);
        return {
          ...base,
          studentId: child?.studentId || "",
          firstName: child?.firstName || "",
          middleName: child?.middleName || "",
          lastName: child?.lastName || "",
          dateOfBirth: parseDateValue(child?.dateOfBirth),
          allergiesAna: child?.allergiesAna || "",
          allergiesNonAna: child?.allergiesNonAna || "",
          doesCarryEpi:
            typeof child?.doesCarryEpi === "boolean"
              ? child.doesCarryEpi
              : base.doesCarryEpi,
          doesAdminEpi:
            typeof child?.doesAdminEpi === "boolean"
              ? child.doesAdminEpi
              : base.doesAdminEpi,
          school: child?.school || "",
          yearLevel: child?.yearLevel || "",
          notes: child?.notes || "",
          maxHoursPerDay: child?.maxHoursPerDay || "",
          preferredStart: parseDateValue(child?.preferredStart),
          trialNotes: child?.trialNotes || "",
          canOfferFood:
            typeof child?.canOfferFood === "boolean"
              ? child.canOfferFood
              : base.canOfferFood,
          avoidFoods: child?.avoidFoods || "",
          questions: child?.questions || "",
          subjects: subjects.length > 0 ? subjects : base.subjects,
          availability: child?.availability || {},
          trialAvailability: child?.trialAvailability || {},
        };
      })
    : [];

  return { familyForm, children };
};

const mapNewSubmissionToIntakeState = (submission = {}) => {
  const family = submission.family || {};
  const familyData = {
    parentName: family.parentName || "",
    familyEmail: family.parentEmail || "",
    familyPhone: family.parentPhone || "",
    familyAddress: family.parentAddress || "",
    secondaryContactName: family.secondaryName || "",
    secondaryContactEmail: family.secondaryEmail || "",
    secondaryContactPhone: family.secondaryPhone || "",
    secondaryContactAddress: family.secondaryAddress || "",
    schedulePreference: getSchedulePreferenceFromFamily(family) || "no_preference",
    usePrimaryAsEmergency: Boolean(family.usePrimaryAsEmergency),
    emergencyFirst: family.emergencyFirst || "",
    emergencyLast: family.emergencyLast || "",
    emergencyRelationship: family.emergencyRelationship || "",
    emergencyRelationshipOther: "",
    emergencyPhone: family.emergencyPhone || "",
    howUserHeard: family.howUserHeard || "",
    homeLocation: family.homeLocation || "",
    additionalNotes: family.additionalNotes || "",
    consentAccepted: false,
  };

  const children = Array.isArray(submission.children)
    ? submission.children.map((child) => {
        const base = createChild();
        const subjects = normalizeIntakeSubjects(child?.subjects);
        return {
          ...base,
          firstName: child?.firstName || "",
          middleName: child?.middleName || "",
          lastName: child?.lastName || "",
          dateOfBirth: parseDateValue(child?.dateOfBirth),
          allergiesAna: child?.allergiesAna || "",
          allergiesNonAna: child?.allergiesNonAna || "",
          doesCarryEpi:
            typeof child?.doesCarryEpi === "boolean"
              ? child.doesCarryEpi
              : base.doesCarryEpi,
          doesAdminEpi:
            typeof child?.doesAdminEpi === "boolean"
              ? child.doesAdminEpi
              : base.doesAdminEpi,
          school: child?.school || "",
          yearLevel: child?.yearLevel || "",
          notes: child?.notes || "",
          maxHoursPerDay: child?.maxHoursPerDay || "",
          preferredStart: parseDateValue(child?.preferredStart),
          trialNotes: child?.trialNotes || "",
          canOfferFood:
            typeof child?.canOfferFood === "boolean"
              ? child.canOfferFood
              : base.canOfferFood,
          avoidFoods: child?.avoidFoods || "",
          questions: child?.questions || "",
          subjects: subjects.length > 0 ? subjects : base.subjects,
          availability: child?.availability || {},
          trialAvailability: child?.trialAvailability || {},
        };
      })
    : [];

  return { familyData, children };
};

const createChildTouched = () => ({
  firstName: false,
  lastName: false,
});

const toTimeValue = (value) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.getTime();
  }
  if (typeof value === "string" && value.includes(":")) {
    const [hours, minutes] = value.split(":").map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.getTime();
  }
  return null;
};

const validateAvailability = (availability, label) => {
  const messages = [];
  const reported = new Set();

  Object.entries(availability || {}).forEach(([day, slots]) => {
    if (!Array.isArray(slots) || slots.length === 0) return;

    const normalized = [];
    let hasInvalidValue = false;
    let hasInvalidRange = false;

    slots.forEach((slot) => {
      const start = toTimeValue(slot.start);
      const end = toTimeValue(slot.end);
      if (start === null || end === null) {
        hasInvalidValue = true;
        return;
      }
      if (start >= end) {
        hasInvalidRange = true;
      }
      normalized.push({ start, end });
    });

    if (hasInvalidValue) {
      const key = `${label}-${day}-invalid`;
      if (!reported.has(key)) {
        messages.push(`${label}: ${day} has an invalid time value.`);
        reported.add(key);
      }
    }

    if (hasInvalidRange) {
      const key = `${label}-${day}-range`;
      if (!reported.has(key)) {
        messages.push(`${label}: ${day} has an end time before the start time.`);
        reported.add(key);
      }
    }

    if (normalized.length > 1) {
      normalized.sort((a, b) => a.start - b.start);
      const hasOverlap = normalized.some((slot, index) => {
        if (index === 0) return false;
        return slot.start < normalized[index - 1].end;
      });
      if (hasOverlap) {
        const key = `${label}-${day}-overlap`;
        if (!reported.has(key)) {
          messages.push(`${label}: ${day} has overlapping time slots.`);
          reported.add(key);
        }
      }
    }
  });

  return messages;
};

const mapSchedulePreference = (preference) => {
  const value = preference || "";
  return {
    preferContiguousDays: value === "same_day",
    preferBackToBack: value === "back_to_back",
    preferSameTime: value === "same_time_within_hour",
  };
};

const getSchedulePreferenceFromFamily = (familyData = {}) => {
  if (!familyData) return "";
  if (schedulePreferenceValues.includes(familyData.schedulePreference)) {
    return familyData.schedulePreference;
  }

  const storedPrefs = familyData.familySchedulingPreferences || {};
  if (storedPrefs.preferSameTime) return "same_time_within_hour";
  if (storedPrefs.preferBackToBack) return "back_to_back";
  if (storedPrefs.preferContiguousDays) return "same_day";

  if (familyData.preferSameTime) return "same_time_within_hour";
  if (familyData.preferBackToBack) return "back_to_back";
  if (familyData.preferContiguousDays) return "same_day";

  return "";
};

export {
  createChild,
  createChildTouched,
  defaultFamilyData,
  defaultSubjects,
  mapExistingSubmissionToIntakeState,
  mapNewSubmissionToIntakeState,
  formatDateValue,
  parseDateValue,
  getClientMeta,
  hasAvailability,
  mapSchedulePreference,
  getSchedulePreferenceFromFamily,
  normalizeTutorIds,
  normalizeIntakeSubjects,
  DEFAULT_AVAILABILITY_THRESHOLD,
  parseHoursValue,
  isWholeHourValue,
  getAvailabilityHours,
  getRequestedTutoringHours,
  validateAvailabilityWithinBounds,
  validateAvailability,
};
