import {
  Paper,
  Box,
  Typography,
  IconButton,
  Stack,
  TextField,
  Button,
  Chip,
} from "@mui/material";
import { useState } from "react";
import { db } from "../../data/firebase";
import { updateDoc, doc, collection, where, getDocs } from "firebase/firestore";
import StudentSelector from "../student/StudentSelector";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { query } from "firebase/database";

const FamiliesList = ({
  families,
  search,
  onDelete,
  students,
  refresh,
  onEdit,
  isExisting,
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState(null);

  const startEdit = (family) => {
    setEditingId(family.id);
    setEditData({
      parentName: family.parentName,
      parentEmail: family.parentEmail,
      parentPhone: family.parentPhone,
      students: family.students,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData(null);
  };

  const saveEdit = async (id) => {
    if (!editData.parentEmail.trim()) return;

    const email = editData.parentEmail.trim();

    const q = query(
      collection(db, "families"),
      where("parentEmail", "==", email)
    );

    const snap = await getDocs(q);
    const duplicate = snap.docs.find((doc) => doc.id !== id);

    if (duplicate) {
      isExisting?.();
      return;
    }

    await updateDoc(doc(db, "families", id), editData);
    setEditingId(null);
    setEditData(null);
    onEdit?.(editData);
    refresh();
  };

  const filtered = families.filter((f) => {
    const target = search.toLowerCase();

    return (
      f.parentName.toLowerCase().includes(target) ||
      f.parentEmail.toLowerCase().includes(target) ||
      f.parentPhone.toLowerCase().includes(target) ||
      f.students.some((s) => s.name.toLowerCase().includes(target))
    );
  });

  return (
    <Stack spacing={2}>
      {filtered.map((family) => {
        const isEditing = editingId === family.id;

        return (
          <Paper key={family.id} sx={{ p: 2 }}>
            {isEditing ? (
              <Stack spacing={2}>
                <TextField
                  label="Parent Name"
                  value={editData.parentName}
                  onChange={(e) =>
                    setEditData({ ...editData, parentName: e.target.value })
                  }
                />

                <TextField
                  label="Email"
                  required
                  value={editData.parentEmail}
                  onChange={(e) =>
                    setEditData({ ...editData, parentEmail: e.target.value })
                  }
                />

                <TextField
                  label="Phone"
                  value={editData.parentPhone}
                  onChange={(e) =>
                    setEditData({ ...editData, parentPhone: e.target.value })
                  }
                />

                <StudentSelector
                  students={students}
                  selected={editData.students}
                  setSelected={(s) => setEditData({ ...editData, students: s })}
                  assignedIds={[]}
                />

                <Box display="flex" gap={1}>
                  <Button
                    variant="contained"
                    onClick={() => saveEdit(family.id)}
                    disabled={!editData.parentEmail.trim()}
                  >
                    Save
                  </Button>
                  <Button variant="outlined" onClick={cancelEdit}>
                    Cancel
                  </Button>
                </Box>
              </Stack>
            ) : (
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Box>
                  <Typography variant="h6">{family.parentName}</Typography>
                  <Typography>{family.parentEmail}</Typography>
                  <Typography>{family.parentPhone}</Typography>
                  <Box
                    sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}
                  >
                    {family.students.map((s) => (
                      <Chip key={s.id} label={s.name} />
                    ))}
                  </Box>
                </Box>

                <Box>
                  <IconButton onClick={() => startEdit(family)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => onDelete(family)}>
                    <DeleteIcon color="error" />
                  </IconButton>
                </Box>
              </Box>
            )}
          </Paper>
        );
      })}
    </Stack>
  );
};

export default FamiliesList;
