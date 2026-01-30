import React, { useEffect, useState } from "react";
import {
  TextField,
  List,
  ListItem,
  ListItemText,
  Button,
  Paper,
  Box,
  IconButton,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../data/firebase";

const TutorBlockedStudents = ({
  blockedStudentIds,
  setBlockedStudentIds,
  isEdit,
}) => {
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const snapshot = await getDocs(collection(db, "students"));
        const studentsData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            firstName: data.firstName,
            lastName: data.lastName,
            name: `${data.firstName} ${data.lastName}`,
          };
        });
        setAllStudents(studentsData);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch students:", error);
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const selectedStudents = allStudents.filter((s) =>
    blockedStudentIds.includes(s.id)
  );

  const filteredStudents =
    searchTerm.trim() === ""
      ? []
      : allStudents.filter((student) =>
          student.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

  const handleAddStudent = (studentId) => {
    if (!blockedStudentIds.includes(studentId)) {
      setBlockedStudentIds([...blockedStudentIds, studentId]);
      setSearchTerm("");
    }
  };

  const handleRemoveStudent = (studentId) => {
    setBlockedStudentIds(blockedStudentIds.filter((id) => id !== studentId));
  };

  return (
    <Box sx={{ mb: 4 }}>
      {isEdit && (
        <Box sx={{ position: "relative", mb: 2 }}>
          <TextField
            fullWidth
            label="Students"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Start typing to search..."
            slotProps={{
              input: {
                startAdornment: (
                  <SearchIcon size={20} style={{ marginRight: "8px" }} />
                ),
              },
            }}
          />
        </Box>
      )}

      {loading ? (
        <CircularProgress />
      ) : (
        <>
          {searchTerm.trim() !== "" && (
            <Paper elevation={2} sx={{ mb: 4 }}>
              <List>
                {filteredStudents.length === 0 ? (
                  <ListItem>
                    <ListItemText
                      primary="No matching students found"
                      sx={{ color: "text.secondary" }}
                    />
                  </ListItem>
                ) : (
                  filteredStudents.map((student) => (
                    <ListItem
                      key={student.id}
                      secondaryAction={
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleAddStudent(student.id)}
                          disabled={blockedStudentIds.includes(student.id)}
                        >
                          Add
                        </Button>
                      }
                    >
                      <ListItemText primary={student.name} />
                    </ListItem>
                  ))
                )}
              </List>
            </Paper>
          )}

          <Paper elevation={2}>
            <List>
              {selectedStudents.length === 0 ? (
                <ListItem>
                  {isEdit ? (
                    <ListItemText
                      primary="No blocked students"
                      secondary="Search and add students above"
                      sx={{ color: "text.secondary" }}
                    />
                  ) : (
                    <ListItemText
                      primary="No blocked students"
                      sx={{ color: "text.secondary" }}
                    />
                  )}
                </ListItem>
              ) : (
                selectedStudents.map((student) => (
                  <ListItem
                    key={student.id}
                    secondaryAction={
                      isEdit && (
                        <IconButton
                          edge="end"
                          aria-label="remove"
                          onClick={() => handleRemoveStudent(student.id)}
                          size="small"
                          sx={{ "&:hover": { color: "error.main" } }}
                        >
                          <CloseIcon />
                        </IconButton>
                      )
                    }
                  >
                    <ListItemText primary={student.name} />
                  </ListItem>
                ))
              )}
            </List>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default TutorBlockedStudents;
