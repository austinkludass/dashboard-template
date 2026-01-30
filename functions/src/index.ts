import * as admin from "firebase-admin";
import {logger} from "firebase-functions";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {onDocumentWritten} from "firebase-functions/v2/firestore";
import {onCall} from "firebase-functions/https";
import {onRequest} from "firebase-functions/https";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

admin.initializeApp();
const db = admin.firestore();
dayjs.extend(isSameOrBefore);
dayjs.extend(utc);
dayjs.extend(timezone);

export {
  getXeroAuthUrl,
  xeroCallback,
  getXeroStatus,
  disconnectXero,
  toggleXeroSandbox,
  exportInvoicesToXero,
  exportPayrollToXero,
  getXeroExportHistory,
} from "./xero";

type Priority = "low" | "medium" | "high";

interface Tutor {
  firstAidFilePath?: string | null;
  faExpiry?: admin.firestore.Timestamp | null;
  emergencyName?: string | null;
  emergencyPhone?: string | null;
  emergencyEmail?: string | null;
  emergencyRelationship?: string | null;
}

interface NotificationDoc {
  userId: string;
  key: string;
  title: string;
  message: string;
  priority: Priority;
  read: boolean;
  createdAt: admin.firestore.FieldValue | admin.firestore.Timestamp;
  updatedAt: admin.firestore.FieldValue | admin.firestore.Timestamp;
}

export interface LessonReport {
  effort: number | null;
  notes: string | null;
  quality: number | null;
  satisfaction: number | null;
  status: string | null;
  studentId: string;
  studentName: string;
  topic: string | null;
}

export interface Lesson {
  id: string;
  startDateTime: string;
  endDateTime: string;
  duration?: number;
  subjectGroupName: string;
  tutorName: string;
  type: string | null;
  reports: { [id: string]: LessonReport };
}

export interface FamilyStudentRef {
  id: string;
  name: string;
}

export interface Family {
  id: string;
  parentName: string;
  parentEmail: string;
  students: FamilyStudentRef[];
}

export interface Student {
  id: string;
  baseRate: string;
}

const notifId = (userId: string, key: string) => `${userId}__${key}`;

const tz = "Australia/Sydney";

async function upsertNotification(
  userId: string,
  key: string,
  title: string,
  message: string,
  priority: Priority
) {
  const id = notifId(userId, key);
  const ref = db.collection("notifications").doc(id);
  const snap = await ref.get();

  const base: Partial<NotificationDoc> = {
    userId,
    key,
    title,
    message,
    priority,
    read: false,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (snap.exists) {
    await ref.update(base);
  } else {
    await ref.set({
      ...base,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    } as NotificationDoc);
  }
}

async function deleteNotificationIfExists(userId: string, key: string) {
  const id = notifId(userId, key);
  const ref = db.collection("notifications").doc(id);
  const snap = await ref.get();
  if (snap.exists) {
    await ref.delete();
  }
}

function isBlank(v: any) {
  if (v === null || v === undefined) return true;
  if (typeof v === "string") return v.trim() === "";
  if (typeof v === "object") return Object.keys(v).length === 0;
  return false;
}

function daysUntil(ts?: any): number | null {
  if (!ts) return null;
  const d = dayjs(ts);
  if (!d.isValid()) return null;
  return d.diff(dayjs(), "day");
}

async function evaluateTutorNotifications(tutorId: string, tutor: Tutor) {
  if (isBlank(tutor.firstAidFilePath)) {
    await upsertNotification(
      tutorId,
      "missing_first_aid_file",
      "First Aid Certificate Missing",
      "Please upload your First Aid document to your profile.",
      "low"
    );
  } else {
    await deleteNotificationIfExists(tutorId, "missing_first_aid_file");
  }

  const days = daysUntil(tutor.faExpiry ?? null);
  if (days !== null && days <= 30 && days >= 0) {
    await upsertNotification(
      tutorId,
      "first_aid_expiring",
      "First Aid Expiring Soon",
      `Your First Aid certificate will expire in ${days} day${
        days === 1 ? "" : "s"
      }.`,
      "medium"
    );
  } else {
    await deleteNotificationIfExists(tutorId, "first_aid_expiring");
  }

  const missingEC =
    isBlank(tutor.emergencyName) ||
    isBlank(tutor.emergencyPhone) ||
    isBlank(tutor.emergencyEmail) ||
    isBlank(tutor.emergencyRelationship);

  if (missingEC) {
    await upsertNotification(
      tutorId,
      "missing_emergency_contact_fields",
      "Emergency Contact Details Incomplete",
      "Please fill in your Emergency Contact details",
      "high"
    );
  } else {
    await deleteNotificationIfExists(
      tutorId,
      "missing_emergency_contact_fields"
    );
  }
}

function requireApiKey(req: any, res: any): boolean {
  const key = req.headers["x-api-key"];
  const envKey = process.env.API_KEY;

  if (!key || key !== envKey) {
    res.status(401).json({error: "Unauthorized"});
    return false;
  }
  return true;
}

async function sendCollection(
  collectionName: string,
  res: any
) {
  const snap = await db.collection(collectionName).get();
  const arr = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
  return res.json(arr);
}

function validateLessonPayload(data: any) {
  const required = [
    "tutorId",
    "tutorColor",
    "tutorName",
    "subjectGroupId",
    "subjectGroupName",
    "startDateTime",
    "endDateTime",
    "type",
    "locationId",
    "locationName",
    "reports",
    "studentIds",
    "studentNames",
  ];

  for (const key of required) {
    if (!data[key]) {
      return `Missing field: ${key}`;
    }
  }

  if (!dayjs(data.startDateTime).isValid()) {
    return "Invalid startDateTime";
  }

  if (!dayjs(data.endDateTime).isValid()) {
    return "Invalid endDateTime";
  }

  return null;
}

export const generateTutorNotifications = onSchedule(
  {
    schedule: "every 24 hours",
    timeZone: "Australia/Sydney",
  },
  async () => {
    logger.info("Running scheduled tutor notification generation...");

    const pageSize = 300;
    let last: FirebaseFirestore.QueryDocumentSnapshot | undefined;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      let query = db
        .collection("tutors")
        .orderBy(admin.firestore.FieldPath.documentId())
        .limit(pageSize);
      if (last) query = query.startAfter(last);

      const snap = await query.get();
      if (snap.empty) break;

      for (const doc of snap.docs) {
        const tutor = doc.data() as Tutor;
        await evaluateTutorNotifications(doc.id, tutor);
      }

      last = snap.docs[snap.docs.length - 1];
      if (snap.size < pageSize) break;
    }
  }
);

export const onTutorWrite = onDocumentWritten(
  {
    document: "tutors/{tutorId}",
    region: "australia-southeast1",
  },
  async (event) => {
    const tutorId = event.params.tutorId as string;
    const before = event.data?.before?.data() as any | undefined;
    const after = event.data?.after?.data() as any | undefined;

    if (!after) {
      await Promise.all([
        deleteNotificationIfExists(tutorId, "missing_first_aid_file"),
        deleteNotificationIfExists(tutorId, "first_aid_expiring"),
        deleteNotificationIfExists(tutorId, "missing_emergency_contact_fields"),
      ]);

      try {
        await admin.auth().setCustomUserClaims(tutorId, null);
      } catch (error) {
        logger.error("Error clearing custom claims: ", error);
      }
      return;
    }

    const newRole = after.role;
    const oldRule = before?.role;

    if (newRole && newRole !== oldRule) {
      try {
        await admin.auth().setCustomUserClaims(tutorId, {role: newRole});
        logger.info(`Updated custom claims for ${tutorId} to role: ${newRole}`);
      } catch (error) {
        logger.error("Error setting custom claims: ", error);
      }
    }

    await evaluateTutorNotifications(tutorId, after);
  }
);

export const generateWeeklyStats = onSchedule(
  {
    schedule: "every monday 02:00",
    timeZone: "Australia/Sydney",
  },
  async () => {
    logger.info("Running weekly stats generation...");

    const collections = ["students", "tutors", "lessons", "subjects"];
    const counts: Record<string, number> = {};

    for (const col of collections) {
      const agg = await db.collection(col).count().get();
      counts[col] = agg.data().count;
    }

    const now = dayjs().tz(tz).startOf("day");
    const docId = now.format("YYYY-MM-DD");

    await db
      .collection("stats")
      .doc(docId)
      .set({
        ...counts,
        timestamp: admin.firestore.Timestamp.fromDate(now.toDate()),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    logger.info("Saved stats snapshot:", counts);
  }
);

export const createRepeatingLessons = onCall(
  {
    region: "australia-southeast1",
    timeoutSeconds: 60,
  },
  async (request) => {
    const data = request.data;
    if (!data || !data.repeatingId || !data.startDateTime || !data.frequency) {
      throw new Error(
        "Missing required fields (repeatingId, startDateTime, frequency)"
      );
    }

    const {
      repeatingId,
      startDateTime,
      endDateTime,
      frequency,
      ...baseLessonData
    } = data;

    const start = dayjs(startDateTime).tz(tz);
    const end = dayjs(endDateTime).tz(tz);
    const endOfNextYear = dayjs().tz(tz).add(1, "year").endOf("year");
    const lessonsToCreate: any[] = [];
    const intervalDays = frequency === "weekly" ? 7 : 14;
    let nextStart = start;
    let nextEnd = end;

    while (nextStart.isSameOrBefore(endOfNextYear)) {
      lessonsToCreate.push({
        ...baseLessonData,
        startDateTime: nextStart.toISOString(),
        endDateTime: nextEnd.toISOString(),
        repeatingId,
        frequency,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      nextStart = nextStart.add(intervalDays, "day");
      nextEnd = nextEnd.add(intervalDays, "day");
    }

    const batch = db.batch();
    const lessonsCol = db.collection("lessons");

    for (const lesson of lessonsToCreate) {
      const docRef = lessonsCol.doc();
      batch.set(docRef, lesson);
    }

    await batch.commit();

    return {
      success: true,
      created: lessonsToCreate.length,
    };
  }
);

export const updateRepeatingLessons = onCall(
  {
    region: "australia-southeast1",
    timeoutSeconds: 60,
  },
  async (request) => {
    const {repeatingId, updatedFields, currentLessonStart,
      startShiftMs, endShiftMs} = request.data || {};
    if (!repeatingId || !updatedFields) {
      throw new Error("Missing required fields (repeatingId, updatedFields)");
    }

    try {
      const lessonsRef = db.collection("lessons");
      let query = lessonsRef.where("repeatingId", "==", repeatingId);
      if (currentLessonStart) {
        const startDate = dayjs(currentLessonStart).tz(tz).toDate();
        query = query.where("startDateTime", ">=", startDate.toISOString());
      }

      const snapshot = await query.get();
      if (snapshot.empty) {
        return {success: false, message: "No lessons found."};
      }

      const batch = db.batch();
      let opCount = 0;
      const MAX_BATCH_SIZE = 500;

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const newStart = new Date(
          new Date(data.startDateTime).getTime() + startShiftMs
        );
        const newEnd = new Date(
          new Date(data.endDateTime).getTime() + endShiftMs
        );

        batch.update(doc.ref, {
          ...updatedFields,
          startDateTime: newStart.toISOString(),
          endDateTime: newEnd.toISOString(),
        });

        if (++opCount === MAX_BATCH_SIZE) {
          await batch.commit();
          opCount = 0;
        }
      }

      if (opCount > 0) await batch.commit();
      return {success: true, updated: snapshot.size};
    } catch (error: any) {
      throw new Error("Error updating repeating lessons:" + error.message);
    }
  }
);

export const deleteRepeatingLessons = onCall(
  {
    region: "australia-southeast1",
    timeoutSeconds: 60,
  },
  async (request) => {
    const {repeatingId, currentLessonStart} = request.data || {};

    if (!repeatingId || !currentLessonStart) {
      throw new Error(
        "Missing required fields (repeatingId, currentLessonStart)"
      );
    }

    try {
      const lessonsRef = db.collection("lessons");
      const startDate = dayjs(currentLessonStart).tz(tz).toISOString();

      const snapshot = await lessonsRef
        .where("repeatingId", "==", repeatingId)
        .where("startDateTime", ">=", startDate)
        .get();

      if (snapshot.empty) {
        return {success: false, message: "No lessons found."};
      }

      let opCount = 0;
      const MAX_BATCH_SIZE = 500;
      let batch = db.batch();

      for (const doc of snapshot.docs) {
        batch.delete(doc.ref);

        if (++opCount === MAX_BATCH_SIZE) {
          await batch.commit();
          batch = db.batch();
          opCount = 0;
        }
      }

      if (opCount > 0) await batch.commit();
      return {success: true, deleted: snapshot.size};
    } catch (error: any) {
      throw new Error("Error deleting repeating lessons:" + error.message);
    }
  }
);

export const api = onRequest(
  {
    region: "australia-southeast1",
    cors: true,
  },
  async (req, res) => {
    if (!requireApiKey(req, res)) return;

    const path = req.path.replace(/^\/api/, "").toLowerCase();

    try {
      switch (path) {
      /* ---------- READ ---------- */
      case "/students":
        return sendCollection("students", res);

      case "/subjectgroups":
        return sendCollection("subjectGroups", res);

      case "/subjects":
        return sendCollection("subjects", res);

      case "/tutors":
        return sendCollection("tutors", res);

      case "/locations":
        return sendCollection("locations", res);

      case "/families":
        return sendCollection("families", res);

      case "/invoices":
        return sendCollection("invoices", res);

      case "/curriculums":
        return sendCollection("curriculums", res);

      case "/intakesubmissions":
        return sendCollection("intakeSubmissions", res);

      /* ---------- READ AND WRITE LESSONS ---------- */
      case "/lessons":
        if (req.method === "GET") {
          return sendCollection("lessons", res);
        }

        if (req.method === "POST") {
          const error = validateLessonPayload(req.body);
          if (error) {
            return res.status(400).json({error});
          }

          const lesson = {
            ...req.body,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          };

          const docRef = await db.collection("lessons").add(lesson);

          return res.status(201).json({
            success: true,
            lessonId: docRef.id,
          });
        }

        return res.status(405).json({error: "Method not allowed"});

      default:
        return res.status(404).json({error: "Unknown endpoint"});
      }
    } catch (error: any) {
      res.status(500).json({error: error.message});
    }
  }
);

export const generateWeeklyInvoices = onCall(
  {
    region: "australia-southeast1",
    timeoutSeconds: 120,
  },
  async (request) => {
    const {start, end} = request.data;
    if (!start || !end) throw new Error("Missing dates");

    const weekKey = dayjs(start).startOf("day").format("YYYY-MM-DD");

    const todayInAU = dayjs().tz("Australia/Sydney");
    const weekEndFriday = dayjs.tz(end, "YYYY-MM-DD", tz).startOf("day");

    const isPastOrCurrentFriday =
      todayInAU.isSame(weekEndFriday, "day") ||
      todayInAU.isAfter(weekEndFriday, "day");

    if (!isPastOrCurrentFriday) {
      throw new Error(
        `Invoices can only be generated from 
        ${weekEndFriday.format("dddd, MMM D, YYYY")}`
      );
    }

    const weekDocRef = db.collection("invoices").doc(weekKey);
    const weekDocSnap = await weekDocRef.get();

    if (weekDocSnap.exists) {
      const weekData = weekDocSnap.data();
      if (weekData?.generated === true) {
        throw new Error("Invoices have already been generated for this week");
      }
      if (weekData?.locked === true) {
        throw new Error("This week has been locked and cannot be regenerated");
      }
    }

    const weekStart = dayjs.tz(start, "YYYY-MM-DD", "Australia/Sydney")
      .startOf("day").toISOString();
    const weekEnd = dayjs.tz(end, "YYYY-MM-DD", "Australia/Sydney")
      .endOf("day").toISOString();

    const lessonsSnap = await db
      .collection("lessons")
      .where("startDateTime", ">=", weekStart)
      .where("startDateTime", "<=", weekEnd)
      .get();

    const lessons: Lesson[] = lessonsSnap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Lesson, "id">),
    })).filter((l) => l.type === "Normal" || l.type === "Tutor Trial");

    if (lessons.length === 0) {
      await weekDocRef.set({
        generated: true,
        locked: false,
        lastGenerated: admin.firestore.FieldValue.serverTimestamp(),
      }, {merge: true});
      return {success: true, message: "No lessons found for this week"};
    }

    const [famSnap, studentSnap] = await Promise.all([
      db.collection("families").get(),
      db.collection("students").get(),
    ]);

    const families: Family[] = famSnap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Family, "id">),
    }));

    const students = studentSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as any[];

    const familyMapById = new Map(families.map((f) => [f.id, f]));
    const studentMapById = new Map(students.map((s: any) => [s.id, s]));

    const findFamily = (studentId: string) =>
      families.find((f) => f.students?.some((s) => s.id === studentId));

    const studentUpdates = new Map<string, {
      discountHoursRemaining?: number;
      removeDiscount?: boolean;
      creditBalance?: number;
      creditHoursRemaining?: number;
      removeCredit?: boolean;
    }>();

    const getStudentUpdate = (studentId: string) => {
      if (!studentUpdates.has(studentId)) {
        const student = studentMapById.get(studentId);
        studentUpdates.set(studentId, {
          discountHoursRemaining: Number(student?.discount?.hoursRemaining) ||
            0,
          creditBalance: student?.credit?.type === "dollars" ?
            Number(student.credit.balance) || 0 : undefined,
          creditHoursRemaining: student?.credit?.type === "hours" ?
            Number(student.credit.hoursRemaining) || 0 : undefined,
        });
      }
      return studentUpdates.get(studentId)!;
    };

    const familyMap = new Map<string, any[]>();

    const sortedLessons = [...lessons].sort((a, b) =>
      new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
    );

    for (const lesson of sortedLessons) {
      const allReports = Object.values(lesson.reports || {}) as any[];

      for (const rep of allReports) {
        if (rep.status === "cancelled") continue;
        const family = findFamily(rep.studentId);
        if (!family) continue;

        const student = studentMapById.get(rep.studentId);
        const baseRate = Number(student?.baseRate) || 0;
        const duration = dayjs(lesson.endDateTime)
          .diff(dayjs(lesson.startDateTime), "hour", true);

        const originalPrice = duration * baseRate;
        const studentUpdate = getStudentUpdate(rep.studentId);

        let discountAmount = 0;
        let discountDescription = "";
        const discount = student?.discount;

        if (discount?.type && discount?.value &&
            studentUpdate.discountHoursRemaining &&
            studentUpdate.discountHoursRemaining > 0) {
          const discountableHours = Math.min(duration,
            studentUpdate.discountHoursRemaining);

          if (discount.type === "percentage") {
            discountAmount = (discountableHours * baseRate) *
              (Number(discount.value) / 100);
            discountDescription =
              `${discount.value}% off for ${discountableHours}h`;
          } else if (discount.type === "fixed") {
            discountAmount = discountableHours * Number(discount.value);
            discountDescription =
              `$${discount.value}/hr off for ${discountableHours}h`;
          }

          if (discount.reason) {
            discountDescription += ` (${discount.reason})`;
          }

          studentUpdate.discountHoursRemaining -= discountableHours;
          if (studentUpdate.discountHoursRemaining <= 0) {
            studentUpdate.discountHoursRemaining = 0;
            studentUpdate.removeDiscount = true;
          }
        }

        const priceAfterDiscount = Math.max(0, originalPrice - discountAmount);

        let creditApplied = 0;
        let creditDescription = "";
        const credit = student?.credit;

        if (credit?.type === "dollars" &&
            studentUpdate.creditBalance !== undefined &&
            studentUpdate.creditBalance > 0) {
          creditApplied = Math
            .min(studentUpdate.creditBalance, priceAfterDiscount);
          studentUpdate.creditBalance -= creditApplied;
          creditDescription = "Credit applied";
          if (studentUpdate.creditBalance <= 0) {
            studentUpdate.creditBalance = 0;
            studentUpdate.removeCredit = true;
          }
        } else if (credit?.type === "hours" &&
                   studentUpdate.creditHoursRemaining !== undefined &&
                   studentUpdate.creditHoursRemaining > 0) {
          const hoursToUse = Math.min(duration,
            studentUpdate.creditHoursRemaining);
          const hourlyRateAfterDiscount = priceAfterDiscount / duration;
          creditApplied = hoursToUse * hourlyRateAfterDiscount;
          creditApplied = Math.min(creditApplied, priceAfterDiscount);
          studentUpdate.creditHoursRemaining -= hoursToUse;
          creditDescription = `${hoursToUse}h prepaid applied`;
          if (studentUpdate.creditHoursRemaining <= 0) {
            studentUpdate.creditHoursRemaining = 0;
            studentUpdate.removeCredit = true;
          }
        }

        const finalPrice = Math.max(0, priceAfterDiscount - creditApplied);

        const item = {
          lessonId: lesson.id,
          studentId: rep.studentId,
          studentName: rep.studentName,
          date: lesson.startDateTime,
          duration,
          originalPrice,
          discountAmount,
          discountDescription: discountDescription || null,
          creditApplied,
          creditDescription: creditDescription || null,
          price: finalPrice,
          subject: lesson.subjectGroupName || null,
          tutorName: lesson.tutorName,
          reported: rep.status,
        };

        if (!familyMap.has(family.id)) familyMap.set(family.id, []);
        familyMap.get(family.id)!.push(item);
      }
    }

    const weekCollection = db.collection(`invoices/${weekKey}/items`);

    await weekDocRef.set({
      generated: true,
      locked: false,
      lastGenerated: admin.firestore.FieldValue.serverTimestamp(),
    }, {merge: true});
    const batch = db.batch();

    const existing = await weekCollection.get();
    existing.forEach((doc) => batch.delete(doc.ref));

    for (const [familyId, lineItems] of familyMap.entries()) {
      const fam = familyMapById.get(familyId);
      if (!fam) continue;

      const subtotal = lineItems
        .reduce((sum, li) => sum + li.originalPrice, 0);
      const totalDiscount = lineItems
        .reduce((sum, li) => sum + li.discountAmount, 0);
      const totalCredit = lineItems
        .reduce((sum, li) => sum + li.creditApplied, 0);
      const total = lineItems.reduce((sum, li) => sum + li.price, 0);

      const ref = weekCollection.doc();
      const invoice = {
        familyId,
        familyName: fam.parentName,
        parentEmail: fam.parentEmail,
        weekStart,
        weekEnd,
        subtotal,
        totalDiscount,
        totalCredit,
        total,
        lineItems,
        editedSinceGeneration: false,
      };
      batch.set(ref, invoice);
    }

    for (const [studentId, update] of studentUpdates.entries()) {
      const studentRef = db.collection("students").doc(studentId);

      if (update.removeDiscount) {
        batch.update(studentRef,
          {discount: admin.firestore.FieldValue.delete()});
      } else if (update.discountHoursRemaining !== undefined) {
        batch.update(studentRef,
          {"discount.hoursRemaining": update.discountHoursRemaining});
      }

      if (update.removeCredit) {
        batch.update(studentRef, {credit: admin.firestore.FieldValue.delete()});
      } else if (update.creditBalance !== undefined) {
        batch.update(studentRef, {"credit.balance": update.creditBalance});
      } else if (update.creditHoursRemaining !== undefined) {
        batch.update(studentRef,
          {"credit.hoursRemaining": update.creditHoursRemaining});
      }
    }

    await batch.commit();
    return {success: true};
  }
);

export const generateWeeklyPayroll = onCall(
  {
    region: "australia-southeast1",
    timeoutSeconds: 120,
  },
  async (request) => {
    const {weekStart, weekEnd} = request.data;

    if (!weekStart || !weekEnd) {
      throw new Error("Missing required fields (weekStart, weekEnd)");
    }

    const weekKey = weekStart;

    const todayInAu = dayjs().tz(tz).startOf("day");
    const weekEndFriday = dayjs.tz(weekEnd, "YYYY-MM-DD", tz).startOf("day");
    const isPastOrCurrentFriday = todayInAu.isSame(weekEndFriday, "day") ||
      todayInAu.isAfter(weekEndFriday, "day");

    if (!isPastOrCurrentFriday) {
      throw new Error(
        `Payroll can only be generated from 
        ${weekEndFriday.format("dddd, MMM D, YYYY")}`
      );
    }

    const weekDocRef = db.collection("payroll").doc(weekKey);
    const weekDocSnap = await weekDocRef.get();

    if (weekDocSnap.exists) {
      const existingData = weekDocSnap.data();
      if (existingData?.generated) {
        throw new Error("Payroll has already been generated for this week");
      }
    }

    const startISO = dayjs.tz(weekStart, "YYYY-MM-DD", "Australia/Sydney")
      .startOf("day").toISOString();
    const endISO = dayjs.tz(weekEnd, "YYYY-MM-DD", "Australia/Sydney")
      .endOf("day").toISOString();

    const lessonsSnap = await db
      .collection("lessons")
      .where("startDateTime", ">=", startISO)
      .where("startDateTime", "<=", endISO)
      .get();

    const lessons = lessonsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const tutorsSnap = await db.collection("tutors").get();
    const tutors = tutorsSnap.docs.map((doc) => ({
      id: doc.id,
      firstName: doc.data().firstName,
      lastName: doc.data().lastName,
      avatar: doc.data().avatar,
      tutorColor: doc.data().tutorColor,
    }));

    const tutorPayrollMap: Record<string, any> = {};

    tutors.forEach((tutor) => {
      tutorPayrollMap[tutor.id] = {
        tutorId: tutor.id,
        tutorName: `${tutor.firstName} ${tutor.lastName}`,
        avatar: tutor.avatar || null,
        tutorColor: tutor.tutorColor || "#888888",
        lessonHours: 0,
        lessonCount: 0,
        additionalHours: 0,
        totalHours: 0,
        lessons: [],
      };
    });

    lessons.forEach((lesson: any) => {
      if (lesson.type !== "Normal" && lesson.type !== "Tutor Trial") {
        return;
      }

      const tutorId = lesson.tutorId;
      if (!tutorId) return;

      const start = dayjs(lesson.startDateTime);
      const end = dayjs(lesson.endDateTime);
      const durationHours = end.diff(start, "hour", true);

      if (tutorPayrollMap[tutorId]) {
        tutorPayrollMap[tutorId].lessonHours += durationHours;
        tutorPayrollMap[tutorId].lessonCount += 1;
        tutorPayrollMap[tutorId].lessons.push({
          id: lesson.id,
          date: lesson.startDateTime,
          duration: durationHours,
          subjectGroupName: lesson.subjectGroupName || "",
          studentNames: lesson.studentNames || [],
          type: lesson.type,
        });
      } else {
        tutorPayrollMap[tutorId] = {
          tutorId,
          tutorName: lesson.tutorName || "Unknown Tutor",
          avatar: null,
          tutorColor: lesson.tutorColor || "#888888",
          lessonHours: durationHours,
          lessonCount: 1,
          additionalHours: 0,
          totalHours: durationHours,
          lessons: [
            {
              id: lesson.id,
              date: lesson.startDateTime,
              duration: durationHours,
              subjectGroupName: lesson.subjectGroupName || "",
              studentNames: lesson.studentNames || [],
              type: lesson.type,
            },
          ],
        };
      }
    });

    Object.keys(tutorPayrollMap).forEach((tutorId) => {
      tutorPayrollMap[tutorId].totalHours =
        tutorPayrollMap[tutorId].lessonHours +
        tutorPayrollMap[tutorId].additionalHours;
    });

    const batch = db.batch();

    batch.set(
      weekDocRef,
      {
        generated: true,
        locked: false,
        lastGenerated: admin.firestore.FieldValue.serverTimestamp(),
        weekStart,
        weekEnd,
      },
      {merge: true}
    );

    const existingItems = await db
      .collection(`payroll/${weekKey}/items`)
      .get();
    existingItems.forEach((doc) => batch.delete(doc.ref));

    Object.values(tutorPayrollMap).forEach((tutorData: any) => {
      if (tutorData.lessonCount > 0 || tutorData.additionalHours > 0) {
        const itemRef = db
          .collection(`payroll/${weekKey}/items`)
          .doc(tutorData.tutorId);
        batch.set(itemRef, tutorData);
      }
    });

    await batch.commit();

    logger.info(`Generated payroll for week ${weekKey}`);

    return {success: true, weekKey};
  }
);

export const approveAdditionalHours = onCall(
  {
    region: "australia-southeast1",
  },
  async (request) => {
    const {requestId, approved, reviewedBy} = request.data;

    if (!requestId || approved === undefined) {
      throw new Error("Missing required fields (requestId, approved)");
    }

    const requestRef = db.collection("additionalHoursRequests").doc(requestId);
    const requestSnap = await requestRef.get();

    if (!requestSnap.exists) {
      throw new Error("Request not found");
    }

    const requestData = requestSnap.data();
    if (!requestData) {
      throw new Error("Request data is empty");
    }

    if (requestData.status !== "pending") {
      throw new Error("Request has already been reviewed");
    }

    const newStatus = approved ? "approved" : "declined";

    await requestRef.update({
      status: newStatus,
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
      reviewedBy: reviewedBy || null,
    });

    if (approved) {
      const weekKey = requestData.weekStart;
      const tutorId = requestData.tutorId;
      const hours = requestData.hours || 0;

      const payrollItemRef = db
        .collection(`payroll/${weekKey}/items`)
        .doc(tutorId);
      const payrollItemSnap = await payrollItemRef.get();

      if (payrollItemSnap.exists) {
        const currentData = payrollItemSnap.data();
        const newAdditionalHours =
          (currentData?.additionalHours || 0) + hours;
        const newTotalHours =
          (currentData?.lessonHours || 0) + newAdditionalHours;

        const additionalHoursDetails =
          currentData?.additionalHoursDetails || [];
        additionalHoursDetails.push({
          requestId,
          hours: requestData.hours,
          description: requestData.description,
          notes: requestData.notes,
          approvedAt: new Date().toISOString(),
        });

        await payrollItemRef.update({
          additionalHours: newAdditionalHours,
          totalHours: newTotalHours,
          additionalHoursDetails,
        });
      } else {
        await payrollItemRef.set({
          tutorId,
          tutorName: requestData.tutorName,
          avatar: null,
          tutorColor: "#888888",
          lessonHours: 0,
          lessonCount: 0,
          additionalHours: hours,
          totalHours: hours,
          lessons: [],
          additionalHoursDetails: [
            {
              requestId,
              hours: requestData.hours,
              description: requestData.description,
              notes: requestData.notes,
              approvedAt: new Date().toISOString(),
            },
          ],
        });
      }
    }

    logger.info(`Additional hours request ${requestId} ${newStatus}`);

    return {success: true, status: newStatus};
  }
);

export const lockPayroll = onCall(
  {
    region: "australia-southeast1",
  },
  async (request) => {
    const {weekStart} = request.data;

    if (!weekStart) {
      throw new Error("Missing required field (weekStart)");
    }

    const weekDocRef = db.collection("payroll").doc(weekStart);
    const weekDocSnap = await weekDocRef.get();

    if (!weekDocSnap.exists) {
      throw new Error("Payroll not found for this week");
    }

    const data = weekDocSnap.data();
    if (!data?.generated) {
      throw new Error("Payroll must be generated before locking");
    }

    if (data?.locked) {
      throw new Error("Payroll is already locked");
    }

    const pendingRequests = await db
      .collection("additionalHoursRequests")
      .where("weekStart", "==", weekStart)
      .where("status", "==", "pending")
      .get();

    if (!pendingRequests.empty) {
      throw new Error(
        "Cannot lock payroll while there are pending additional hours requests"
      );
    }

    await weekDocRef.update({
      locked: true,
      lockedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info(`Locked payroll for week ${weekStart}`);

    return {success: true};
  }
);

export const reserveTutor = onCall(
  {
    region: "australia-southeast1",
  },
  async (request) => {
    const {auth, data} = request;

    if (!auth) throw new Error("Not authenticated");

    const adminSnap = await db.doc(`tutors/${auth.uid}`).get();
    const role = adminSnap.data()?.role;
    if (!adminSnap.exists || !["Admin", "Head Tutor"].includes(role)) {
      throw new Error("Permission denied");
    }

    const user = await admin.auth().createUser({
      email: data.email,
      password: data.password,
    });

    return {uid: user.uid};
  }
);

export const finalizeTutor = onCall(
  {
    region: "australia-southeast1",
  },
  async (request) => {
    const {auth, data} = request;

    if (!auth) throw new Error("Not authenticated");

    const adminSnap = await db.doc(`tutors/${auth.uid}`).get();
    const role = adminSnap.data()?.role;
    if (!adminSnap.exists || !["Admin", "Head Tutor"].includes(role)) {
      throw new Error("Permission denied");
    }

    await db.doc(`tutors/${data.uid}`).set({
      ...data.tutorData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {success: true};
  }
);

/**
 * Fetches a prior intake submission by ID for new family form rehydration.
 * Called from ParentIntake when a submissionId is found in localStorage.
 * Acts as a secure gateway - clients cannot read intakeSubmissions directly.
 */
export const getNewFamilySubmission = onCall(
  {
    region: "australia-southeast1",
  },
  async (request) => {
    const {submissionId} = request.data || {};

    if (!submissionId || typeof submissionId !== "string") {
      throw new Error("Missing or invalid submissionId");
    }

    const submissionRef = db.collection("intakeSubmissions").doc(submissionId);
    const submissionSnap = await submissionRef.get();

    if (!submissionSnap.exists) {
      return {found: false, submission: null};
    }

    return {
      found: true,
      submission: {
        id: submissionSnap.id,
        ...submissionSnap.data(),
      },
    };
  }
);

/**
 * Fetches the most recent intake submission for an existing family.
 * Called from ExistingFamilyIntake to rehydrate the form with prior data.
 * Also returns family and student data to avoid direct Firestore reads.
 */
export const getExistingFamilySubmission = onCall(
  {
    region: "australia-southeast1",
  },
  async (request) => {
    const {familyId} = request.data || {};

    if (!familyId || typeof familyId !== "string") {
      throw new Error("Missing or invalid familyId");
    }

    const familyRef = db.collection("families").doc(familyId);
    const familySnap = await familyRef.get();

    if (!familySnap.exists) {
      return {found: false, family: null, students: [], submission: null};
    }

    const familyData: any = {id: familySnap.id, ...familySnap.data()};

    // Fetch student details if family has students
    const studentRefs = familyData.students || [];
    const studentDetails: any[] = [];
    for (const studentRef of studentRefs) {
      const studentId = typeof studentRef === "string" ?
        studentRef :
        studentRef?.id || studentRef?.ref?.id;
      if (studentId) {
        const studentSnap = await db
          .collection("students").doc(studentId).get();
        if (studentSnap.exists) {
          studentDetails.push({id: studentSnap.id, ...studentSnap.data()});
        }
      }
    }

    // Fetch latest submission
    const submissionsQuery = db
      .collection("intakeSubmissions")
      .where("family.familyId", "==", familyId)
      .orderBy("meta.submittedAt", "desc")
      .limit(1);

    const submissionsSnap = await submissionsQuery.get();

    const submission = submissionsSnap.empty ?
      null :
      {id: submissionsSnap.docs[0].id, ...submissionsSnap.docs[0].data()};

    return {
      found: !submissionsSnap.empty,
      submission,
      family: familyData,
      students: studentDetails,
    };
  }
);

/**
 * Fetches subjects, curriculums, and tutors for intake form dropdowns.
 * Called from StudentAcademicInfo to populate subject/tutor selection.
 * Allows unauthenticated access to reference data without exposing Firestore.
 */
export const getIntakeFormData = onCall(
  {
    region: "australia-southeast1",
  },
  async () => {
    const [subjectsSnap, curriculumsSnap, tutorsSnap] = await Promise.all([
      db.collection("subjects").get(),
      db.collection("curriculums").get(),
      db.collection("tutors").get(),
    ]);

    const subjects = subjectsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const curriculums = curriculumsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const tutors = tutorsSnap.docs.map((doc) => {
      const data = doc.data() || {};
      const firstName = data.firstName || "";
      const lastName = data.lastName || "";
      const name = [firstName, lastName].filter(Boolean).join(" ");
      return {
        id: doc.id,
        name: name || data.name || "Unnamed tutor",
      };
    });

    return {subjects, curriculums, tutors};
  }
);
