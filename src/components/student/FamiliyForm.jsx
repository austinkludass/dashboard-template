import { useState } from "react";
import { Paper, TextField, Button, Stack, Box } from "@mui/material";
import { collection, addDoc, where, getDocs } from "firebase/firestore";
import { query } from "firebase/database";
import { db } from "../../data/firebase";
import StudentSelector from "./StudentSelector";

const FamilyForm = ({ students, assignedIds, refresh, isExisting }) => {
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);

  const onSubmit = async () => {
    if (!parentEmail.trim()) return;

    const q = query(
      collection(db, "families"),
      where("parentEmail", "==", parentEmail.trim())
    );

    const existing = await getDocs(q);

    if (!existing.empty) {
      isExisting?.();
      return;
    }

    const familyData = {
      parentName,
      parentEmail,
      parentPhone,
      students: selectedStudents,
    };

    await addDoc(collection(db, "families"), familyData);

    clearFields();
    refresh();
  };

  const clearFields = () => {
    setParentName("");
    setParentEmail("");
    setParentPhone("");
    setSelectedStudents([]);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={2}>
        <TextField
          label="Parent Name"
          value={parentName}
          onChange={(e) => setParentName(e.target.value)}
        />

        <TextField
          label="Family Email"
          required
          value={parentEmail}
          onChange={(e) => setParentEmail(e.target.value)}
        />

        <TextField
          label="Family Phone"
          value={parentPhone}
          onChange={(e) => setParentPhone(e.target.value)}
        />

        <StudentSelector
          students={students}
          selected={selectedStudents}
          setSelected={setSelectedStudents}
          assignedIds={assignedIds}
        />

        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            onClick={onSubmit}
            disabled={!parentEmail.trim()}
          >
            Create Family
          </Button>
          <Button variant="outlined" onClick={() => clearFields()}>
            Clear
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
};

export default FamilyForm;
