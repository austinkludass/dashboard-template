import { useState, useEffect, useContext, useMemo } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../data/firebase";
import { AuthContext } from "../context/AuthContext";
import {
  hasMinimumRole,
  hasPermission,
  isHeadTutorOrAbove,
  isSeniorTutorOrAbove,
  isAdmin,
  canViewBankingTax,
  canViewBlockedStudents,
  canEditSubjects,
  canEditLocations,
  canEditPermissions,
} from "../utils/permissions";

const usePermissions = () => {
  const { currentUser } = useContext(AuthContext);
  const [tutorData, setTutorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      setTutorData(null);
      return;
    }

    setLoading(true);

    const tutorRef = doc(db, "tutors", currentUser.uid);
    const unsubscribe = onSnapshot(
      tutorRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setTutorData({
            id: docSnap.id,
            ...docSnap.data(),
          });
        } else {
          setTutorData(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching tutor data for permissions:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  const role = tutorData?.role || null;

  const permissions = useMemo(() => {
    return {
      role,
      tutorData,
      loading,
      error,
      userId: currentUser?.uid,

      isAdmin: isAdmin(role),
      isSeniorTutorOrAbove: isSeniorTutorOrAbove(role),
      isHeadTutorOrAbove: isHeadTutorOrAbove(role),

      hasPermission: (permission) => hasPermission(role, permission),
      hasMinimumRole: (minimumRole) => hasMinimumRole(role, minimumRole),

      canViewStatsCards: isHeadTutorOrAbove(role),
      canAccessInvoices: isHeadTutorOrAbove(role),
      canAccessPayroll: isHeadTutorOrAbove(role),
      canAccessIntegrations: isHeadTutorOrAbove(role),
      canEditPermissions: canEditPermissions(role),
      canEditSubjects: canEditSubjects(role),
      canEditLocations: canEditLocations(role),
      canViewBlockedStudents: canViewBlockedStudents(role),

      canViewBankingTax: (profileTutorId) =>
        canViewBankingTax(role, currentUser?.uid, profileTutorId),
    };
  }, [role, tutorData, loading, error, currentUser?.uid]);

  return permissions;
};

export default usePermissions;
