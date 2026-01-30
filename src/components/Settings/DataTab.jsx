import { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  LinearProgress,
} from "@mui/material";
import {
  Download as DownloadIcon,
  Upload as UploadIcon,
  School as SchoolIcon,
  Event as EventIcon,
  Category as CategoryIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  People as PeopleIcon,
} from "@mui/icons-material";
import { collection, getDocs, doc, writeBatch } from "firebase/firestore";
import { db } from "../../data/firebase";

const COLLECTIONS = [
  {
    key: "students",
    label: "Students",
    icon: <SchoolIcon />,
    description:
      "Student profiles including personal info, academic details, and family contacts",
  },
  {
    key: "lessons",
    label: "Lessons",
    icon: <EventIcon />,
    description:
      "Lesson records with scheduling, tutor assignments, and student reports",
  },
  {
    key: "subjectGroups",
    label: "Subject Groups",
    icon: <CategoryIcon />,
    description: "Subject groupings used for lesson categorisation",
  },
  {
    key: "families",
    label: "Families",
    icon: <PeopleIcon />,
    description: "Families and their students",
  }
];

const DataTab = () => {
  const [exporting, setExporting] = useState({});
  const [importing, setImporting] = useState({});
  const [importResults, setImportResults] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    collection: null,
    file: null,
    data: null,
  });

  const handleExport = async (collectionKey) => {
    setExporting((prev) => ({ ...prev, [collectionKey]: true }));

    try {
      const snapshot = await getDocs(collection(db, collectionKey));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${collectionKey}_export_${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setImportResults({
        type: "success",
        message: `Successfully exported ${data.length} ${collectionKey} records`,
      });
    } catch (error) {
      console.error("Export error:", error);
      setImportResults({
        type: "error",
        message: `Export failed: ${error.message}`,
      });
    } finally {
      setExporting((prev) => ({ ...prev, [collectionKey]: false }));
    }
  };

  const handleFileSelect = (collectionKey, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        if (!Array.isArray(data)) {
          setImportResults({
            type: "error",
            message: "Invalid JSON format: Expected an array of objects",
          });
          return;
        }

        const validationResult = validateImportData(collectionKey, data);
        if (!validationResult.valid) {
          setImportResults({
            type: "error",
            message: validationResult.message,
          });
          return;
        }

        setConfirmDialog({
          open: true,
          collection: collectionKey,
          file: file.name,
          data,
        });
      } catch (error) {
        setImportResults({
          type: "error",
          message: `Failed to parse JSON file: ${error.message}`,
        });
      }
    };
    reader.readAsText(file);

    event.target.value = "";
  };

  const validateImportData = (collectionKey, data) => {
    if (data.length === 0) {
      return { valid: false, message: "File contains no records" };
    }

    const requiredFields = {
      students: ["firstName", "lastName"],
      lessons: ["startDateTime", "endDateTime", "tutorId"],
      subjectGroups: ["name", "subjectIds"],
      families: ["parentEmail"],
    };

    const required = requiredFields[collectionKey] || [];
    const firstItem = data[0];

    for (const field of required) {
      if (!(field in firstItem)) {
        return {
          valid: false,
          message: `Missing required field "${field}" in ${collectionKey} data`,
        };
      }
    }

    return { valid: true };
  };

  const handleImport = async () => {
    const { collection: collectionKey, data } = confirmDialog;
    setConfirmDialog({ open: false, collection: null, file: null, data: null });
    setImporting((prev) => ({ ...prev, [collectionKey]: true }));

    try {
      const batchSize = 500;
      let imported = 0;
      let errors = 0;

      for (let i = 0; i < data.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = data.slice(i, i + batchSize);

        for (const item of chunk) {
          try {
            const docId = item.id || doc(collection(db, collectionKey)).id;
            const { id, ...docData } = item;

            const docRef = doc(db, collectionKey, docId);
            batch.set(docRef, docData, { merge: true });
            imported++;
          } catch (err) {
            console.error("Error preparing document:", err);
            errors++;
          }
        }

        await batch.commit();
      }

      setImportResults({
        type: errors > 0 ? "warning" : "success",
        message: `Imported ${imported} records${
          errors > 0 ? `, ${errors} errors` : ""
        }`,
      });
    } catch (error) {
      console.error("Import error:", error);
      setImportResults({
        type: "error",
        message: `Import failed: ${error.message}`,
      });
    } finally {
      setImporting((prev) => ({ ...prev, [collectionKey]: false }));
    }
  };

  return (
    <Paper elevation={1} sx={{ p: 3, borderRadius: "12px" }}>
      <Typography variant="h5" fontWeight="600" mb={1}>
        Data Import / Export
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Import and export collection data as JSON files. Use this feature for
        backups or data migration.
      </Typography>

      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Caution:</strong> Importing data will merge with existing
          records. If a record with the same ID exists, it will be updated.
          Always export a backup before importing.
        </Typography>
      </Alert>

      {importResults && (
        <Alert
          severity={importResults.type}
          onClose={() => setImportResults(null)}
          sx={{ mb: 3 }}
          icon={
            importResults.type === "success" ? (
              <CheckCircleIcon />
            ) : (
              <WarningIcon />
            )
          }
        >
          {importResults.message}
        </Alert>
      )}

      <Stack spacing={2}>
        {COLLECTIONS.map((col) => (
          <Card key={col.key} variant="outlined">
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={1}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: "8px",
                    backgroundColor: "action.hover",
                    display: "flex",
                  }}
                >
                  {col.icon}
                </Box>
                <Box flex={1}>
                  <Typography variant="h6">{col.label}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {col.description}
                  </Typography>
                </Box>
              </Box>

              {(exporting[col.key] || importing[col.key]) && (
                <LinearProgress sx={{ mt: 2 }} />
              )}
            </CardContent>

            <Divider />

            <CardActions sx={{ p: 2, gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={
                  exporting[col.key] ? (
                    <CircularProgress size={16} />
                  ) : (
                    <DownloadIcon />
                  )
                }
                onClick={() => handleExport(col.key)}
                disabled={exporting[col.key] || importing[col.key]}
              >
                Export
              </Button>

              <Button
                variant="contained"
                component="label"
                startIcon={
                  importing[col.key] ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <UploadIcon />
                  )
                }
                disabled={exporting[col.key] || importing[col.key]}
              >
                Import
                <input
                  type="file"
                  hidden
                  accept=".json"
                  onChange={(e) => handleFileSelect(col.key, e)}
                />
              </Button>
            </CardActions>
          </Card>
        ))}
      </Stack>

      <Box mt={4}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          JSON Format Requirements
        </Typography>
        <Typography variant="body2" color="text.secondary" component="div">
          <ul style={{ margin: 0, paddingLeft: "20px" }}>
            <li>
              <strong>Students:</strong> Must include <code>firstName</code> and{" "}
              <code>lastName</code>
            </li>
            <li>
              <strong>Lessons:</strong> Must include <code>startDateTime</code>,{" "}
              <code>endDateTime</code>, and <code>tutorId</code>
            </li>
            <li>
              <strong>Subject Groups:</strong> Must include <code>name</code>{" "}
              and <code>subjectIds</code> (array)
            </li>
            <li>
              <strong>Families:</strong> Must include <code>parentEmail</code>
            </li>
          </ul>
        </Typography>
      </Box>

      <Dialog
        open={confirmDialog.open}
        onClose={() =>
          setConfirmDialog({
            open: false,
            collection: null,
            file: null,
            data: null,
          })
        }
      >
        <DialogTitle>Confirm Import</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You are about to import{" "}
            <strong>{confirmDialog.data?.length || 0}</strong> records into the{" "}
            <strong>{confirmDialog.collection}</strong> collection from{" "}
            <strong>{confirmDialog.file}</strong>.
          </DialogContentText>
          <Alert severity="info" sx={{ mt: 2 }}>
            Records with existing IDs will be merged/updated. New records will
            be created.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setConfirmDialog({
                open: false,
                collection: null,
                file: null,
                data: null,
              })
            }
          >
            Cancel
          </Button>
          <Button onClick={handleImport} variant="contained" color="primary">
            Import
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default DataTab;
