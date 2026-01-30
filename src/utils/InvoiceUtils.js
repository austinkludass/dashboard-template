import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  getDoc,
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

export const fetchLessonsForWeek = async (start, end) => {
  const startISO = start.startOf("day").toISOString();
  const endISO = end.endOf("day").toISOString();

  const q = query(
    collection(db, "lessons"),
    where("startDateTime", ">=", startISO),
    where("startDateTime", "<=", endISO)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter(
      (lesson) => lesson.type === "Normal" || lesson.type === "Tutor Trial"
    );
};

export const fetchInvoicesForWeek = async (date) => {
  const week = dayjs(date).startOf("day").format("YYYY-MM-DD");
  const col = collection(db, `invoices/${week}/items`);
  const snap = await getDocs(col);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => a.familyName.localeCompare(b.familyName));
};

export const getWeeklyReportStatusBreakdown = (lessons) => {
  const counts = {
    present: 0,
    partial: 0,
    noShow: 0,
    null: 0,
  };

  let totalReports = 0;
  lessons.forEach((lesson) => {
    const reports = lesson.reports || [];
    reports.forEach((rep) => {
      if (!rep || rep.status === "cancelled") return;

      totalReports++;
      const status = rep.status ?? null;
      if (status === "present") counts.present++;
      else if (status === "partial") counts.partial++;
      else if (status === "noShow") counts.noShow++;
      else counts.null++;
    });
  });

  const total = totalReports || 1;

  const data = [
    {
      label: "Present",
      value: (counts.present / total) * 100,
      count: counts.present,
    },
    {
      label: "Partial",
      value: (counts.partial / total) * 100,
      count: counts.partial,
    },
    {
      label: "No Show",
      value: (counts.noShow / total) * 100,
      count: counts.noShow,
    },
    {
      label: "Unreported",
      value: (counts.null / total) * 100,
      count: counts.null,
    },
  ];

  return data;
};

export const updateInvoice = async (weekDate, invoiceId, data) => {
  const week = dayjs(weekDate).startOf("day").format("YYYY-MM-DD");
  const ref = doc(db, `invoices/${week}/items/${invoiceId}`);
  await updateDoc(ref, {
    ...data,
  });
};

export const fetchWeekMeta = async (weekDate) => {
  const week = dayjs(weekDate).startOf("day").format("YYYY-MM-DD");
  const ref = doc(db, "invoices", week);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
};

export const updateWeekMeta = async (weekDate, data) => {
  const week = dayjs(weekDate).startOf("day").format("YYYY-MM-DD");
  const ref = doc(db, "invoices", week);
  await updateDoc(ref, data);
};
