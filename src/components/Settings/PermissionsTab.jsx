import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Select,
  MenuItem,
  CircularProgress,
  Divider,
  Alert,
  Tooltip,
} from "@mui/material";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../../data/firebase";
import LockIcon from "@mui/icons-material/Lock";

const roleOptions = ["Admin", "Senior Tutor", "Head Tutor", "Tutor", "Minion"];

const PermissionsTab = ({ canEdit = false }) => {
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTutors = async () => {
      const snap = await getDocs(collection(db, "tutors"));
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      const roleOrder = {
        Admin: 1,
        "Senior Tutor": 2,
        "Head Tutor": 3,
        Tutor: 4,
        Minion: 5,
      };
      list.sort((a, b) => {
        const roleCompare =
          (roleOrder[a.role] || 99) - (roleOrder[b.role] || 99);
        if (roleCompare !== 0) return roleCompare;
        return `${a.firstName} ${a.lastName}`.localeCompare(
          `${b.firstName} ${b.lastName}`
        );
      });
      setTutors(list);
      setLoading(false);
    };
    fetchTutors();
  }, []);

  const handleRoleChange = async (id, newRole) => {
    if (!canEdit) return;

    try {
      await updateDoc(doc(db, "tutors", id), { role: newRole });
      setTutors((prev) =>
        prev.map((t) => (t.id === id ? { ...t, role: newRole } : t))
      );
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  if (loading) {
    return (
      <Box p={4} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper elevation={1} sx={{ p: 3, borderRadius: "12px" }}>
      <Typography variant="h5" fontWeight="600" mb={1}>
        Tutor Permissions
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Manage roles and permissions for all tutors in your organisation.
      </Typography>

      {!canEdit && (
        <Alert severity="info" icon={<LockIcon />} sx={{ mb: 3 }}>
          Only Admins can modify tutor roles. Contact an Admin if you need to
          change permissions.
        </Alert>
      )}

      <Box
        display="grid"
        gridTemplateColumns={{
          xs: "1fr",
          md: "1fr 1fr 150px",
        }}
        px={1}
        py={1}
        sx={{ opacity: "0.6" }}
      >
        <Typography fontWeight={600}>User</Typography>
        <Typography fontWeight={600}>Email</Typography>
        <Typography fontWeight={600}>Role</Typography>
      </Box>
      <Divider sx={{ mb: 2 }} />

      {tutors.map((tutor) => (
        <Box
          key={tutor.id}
          display="grid"
          gridTemplateColumns={{
            xs: "1fr",
            md: "1fr 1fr 150px",
          }}
          alignItems="center"
          rowGap={1}
          px={1}
          py={1.5}
          sx={{
            borderRadius: "8px",
            "&:hover": { backgroundColor: "action.hover" },
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar
              sx={{ width: 40, height: 40, bgcolor: tutor.tutorColor }}
              src={tutor.avatar ?? ""}
            />
            <Typography fontWeight={500}>
              {tutor.firstName} {tutor.lastName}
            </Typography>
          </Box>

          <Typography color="text.secondary">{tutor.wiseMindsEmail}</Typography>

          <Select
            size="small"
            fullWidth
            disabled={!canEdit}
            value={tutor.role || ""}
            onChange={(e) => handleRoleChange(tutor.id, e.target.value)}
            sx={{ borderRadius: "8px" }}
          >
            {roleOptions.map((role) => (
              <MenuItem key={role} value={role}>
                {role}
              </MenuItem>
            ))}
          </Select>
        </Box>
      ))}
    </Paper>
  );
};

export default PermissionsTab;
