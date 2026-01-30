export const deriveLessonTypeFromReports = (currentType, reports) => {
  if (!reports.length) return currentType;

  const allCancelled = reports.every((r) => r.status === "cancelled");

  if (allCancelled) return "Cancelled";

  if (currentType === "Cancelled") return "Normal";

  return currentType;
};
