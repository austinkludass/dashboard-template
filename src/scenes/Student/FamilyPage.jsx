import {
  Box,
  Paper,
  TextField,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { toast, ToastContainer } from "react-toastify";
import { db } from "../../data/firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { useEffect, useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ConfirmDialog from "../../components/Global/ConfirmDialog";
import FamiliesList from "../../components/student/FamiliesList";
import FamilyForm from "../../components/student/FamiliyForm";
import Header from "../../components/Global/Header";

const FamilyPage = () => {
  const [students, setStudents] = useState([]);
  const [families, setFamilies] = useState([]);
  const [search, setSearch] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState(null);

  useEffect(() => {
    loadStudents();
    loadFamilies();
  }, []);

  const loadStudents = async () => {
    const s = await getDocs(collection(db, "students"));
    const mapped = s.docs.map((d) => ({ id: d.id, ...d.data() }));
    setStudents(mapped);
  };

  const loadFamilies = async () => {
    const f = await getDocs(collection(db, "families"));
    const mapped = f.docs.map((d) => ({ id: d.id, ...d.data() }));
    setFamilies(mapped);
  };

  const assignedIds = families.flatMap((f) => f.students.map((s) => s.id));

  const handleDelete = async (family) => {
    await deleteDoc(doc(db, "families", family.id));
    toast.success("Deleted family with email: " + family.parentEmail);
    loadFamilies();
  };

  const handleDeleteClick = (family) => {
    setConfirmOpen(true);
    setSelectedFamily(family);
  };

  const handleConfirmDelete = () => {
    setConfirmOpen(false);
    setSelectedFamily(null);
    handleDelete(selectedFamily);
  };

  const handleCancelConfirm = () => {
    setConfirmOpen(false);
    setSelectedFamily(null);
  };

  return (
    <Box p={4}>
      <Box
        sx={{ mx: "auto", display: "flex", flexDirection: "column", gap: 4 }}
      >
        <Header
          title="Families"
          subtitle="Manage all families and their students"
        />

        <Paper>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h5">Create New Family</Typography>
            </AccordionSummary>

            <AccordionDetails>
              <FamilyForm
                students={students}
                assignedIds={assignedIds}
                refresh={loadFamilies}
                isExisting={() =>
                  toast.error("A family with the same email already exists")
                }
              />
            </AccordionDetails>
          </Accordion>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" mb={2}>
            Families
          </Typography>

          <TextField
            fullWidth
            placeholder="Search families..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ mb: 2 }}
          />

          <FamiliesList
            families={families}
            search={search}
            onDelete={handleDeleteClick}
            students={students}
            refresh={loadFamilies}
            onEdit={(e) =>
              toast.success(
                "Family information saved with email: " + e.parentEmail
              )
            }
            isExisting={() =>
              toast.error("A family with the same email already exists")
            }
          />
        </Paper>
      </Box>
      <ToastContainer position="top-right" autoClose={3000} />
      <ConfirmDialog
        open={confirmOpen}
        title="Confirm Deletion"
        description="Are you sure you want to delete this family? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="error"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelConfirm}
      />
    </Box>
  );
};

export default FamilyPage;
