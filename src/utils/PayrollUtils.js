import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  orderBy,
} from "firebase/firestore";
import { db } from "../data/firebase";
import dayjs from "dayjs";

export const getWeekRange = (date) => {
  const current = dayjs(date);
  const start = current.startOf("week");
  const end = start.add(6, "day");
  return { start, end };
};

export const nextWeek = (weekStart) => weekStart.add(7, "day");
export const prevWeek = (weekStart) => weekStart.subtract(7, "day");
export const getCurrentWeekStart = () => getWeekRange(dayjs()).start;

export const getWeekKey = (weekStart) => {
  return dayjs(weekStart).startOf("day").format("YYYY-MM-DD");
};

export const fetchLessonsForWeek = async (start, end) => {
  const startISO = start.startOf("day").toISOString();
  const endISO = end.endOf("day").toISOString();

  const q = query(
    collection(db, "lessons"),
    where("startDateTime", ">=", startISO),
    where("startDateTime", "<=", endISO)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const fetchTutors = async () => {
  const snapshot = await getDocs(collection(db, "tutors"));
  return snapshot.docs.map((d) => ({
    id: d.id,
    firstName: d.data().firstName,
    lastName: d.data().lastName,
    avatar: d.data().avatar,
    tutorColor: d.data().tutorColor,
  }));
};

export const calculateTutorHoursPreview = (lessons, tutors) => {
  const tutorHoursMap = {};

  tutors.forEach((tutor) => {
    tutorHoursMap[tutor.id] = {
      tutorId: tutor.id,
      tutorName: `${tutor.firstName} ${tutor.lastName}`,
      avatar: tutor.avatar,
      tutorColor: tutor.tutorColor,
      lessonHours: 0,
      lessonCount: 0,
      lessons: [],
    };
  });

  lessons.forEach((lesson) => {
    if (lesson.type !== "Normal" && lesson.type !== "Tutor Trial") {
      return;
    }

    const tutorId = lesson.tutorId;
    if (!tutorId) return;

    const start = dayjs(lesson.startDateTime);
    const end = dayjs(lesson.endDateTime);
    const durationHours = end.diff(start, "hour", true);

    if (tutorHoursMap[tutorId]) {
      tutorHoursMap[tutorId].lessonHours += durationHours;
      tutorHoursMap[tutorId].lessonCount += 1;
      tutorHoursMap[tutorId].lessons.push({
        id: lesson.id,
        date: lesson.startDateTime,
        duration: durationHours,
        subjectGroupName: lesson.subjectGroupName,
        studentNames: lesson.studentNames,
        type: lesson.type,
      });
    } else {
      tutorHoursMap[tutorId] = {
        tutorId,
        tutorName: lesson.tutorName || "Unknown Tutor",
        avatar: null,
        tutorColor: lesson.tutorColor || "#888888",
        lessonHours: durationHours,
        lessonCount: 1,
        lessons: [
          {
            id: lesson.id,
            date: lesson.startDateTime,
            duration: durationHours,
            subjectGroupName: lesson.subjectGroupName,
            studentNames: lesson.studentNames,
            type: lesson.type,
          },
        ],
      };
    }
  });

  return tutorHoursMap;
};

export const fetchPayrollMeta = async (weekStart) => {
  const weekKey = getWeekKey(weekStart);
  const docRef = doc(db, "payroll", weekKey);
  const snap = await getDoc(docRef);
  return snap.exists() ? snap.data() : null;
};

export const fetchPayrollItems = async (weekStart) => {
  const weekKey = getWeekKey(weekStart);
  const col = collection(db, `payroll/${weekKey}/items`);
  const snap = await getDocs(col);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const fetchAdditionalHoursRequests = async (weekStart) => {
  const weekKey = getWeekKey(weekStart);
  const q = query(
    collection(db, "additionalHoursRequests"),
    where("weekStart", "==", weekKey),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const fetchPendingRequests = async (weekStart) => {
  const weekKey = getWeekKey(weekStart);
  const q = query(
    collection(db, "additionalHoursRequests"),
    where("weekStart", "==", weekKey),
    where("status", "==", "pending")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const submitAdditionalHoursRequest = async (data) => {
  const col = collection(db, "additionalHoursRequests");
  const docRef = doc(col);
  await setDoc(docRef, {
    ...data,
    status: "pending",
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
};

export const fetchTutorRequests = async (tutorId) => {
  const q = query(
    collection(db, "additionalHoursRequests"),
    where("tutorId", "==", tutorId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const calculatePreviewTotals = (tutorHoursMap) => {
  const values = Object.values(tutorHoursMap);
  return {
    lessonHours: values.reduce((acc, t) => acc + (t.lessonHours || 0), 0),
    lessonCount: values.reduce((acc, t) => acc + (t.lessonCount || 0), 0),
    tutorCount: values.filter((t) => t.lessonCount > 0).length,
  };
};

export const calculatePayrollTotals = (payrollItems) => {
  return {
    lessonHours: payrollItems.reduce((acc, t) => acc + (t.lessonHours || 0), 0),
    additionalHours: payrollItems.reduce(
      (acc, t) => acc + (t.additionalHours || 0),
      0
    ),
    totalHours: payrollItems.reduce((acc, t) => acc + (t.totalHours || 0), 0),
    lessonCount: payrollItems.reduce((acc, t) => acc + (t.lessonCount || 0), 0),
    tutorCount: payrollItems.length,
  };
};
