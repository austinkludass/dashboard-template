import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import {
  Box,
  Typography,
  useTheme,
  Button,
  TextField,
  Paper,
  Stack,
  Chip,
  Card,
  CardContent,
  Divider,
} from "@mui/material";
import DesktopWindowsOutlinedIcon from "@mui/icons-material/DesktopWindowsOutlined";
import LanguageOutlinedIcon from "@mui/icons-material/LanguageOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import {
  addDoc,
  collection,
  serverTimestamp,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { tokens } from "../../theme";
import { toast, ToastContainer } from "react-toastify";
import { format } from "date-fns";
import Header from "../../components/Global/Header";
import { db } from "../../data/firebase";

const ReportBug = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [page, setPage] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState("");
  const [browser, setBrowser] = useState("");
  const [bugs, setBugs] = useState([]);

  const { currentUser } = useContext(AuthContext);

  useEffect(() => {
    const q = query(collection(db, "bugs"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setBugs(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!page || !description || !steps || !browser) {
      toast.warning("Please fill in all fields.");
      return;
    }

    try {
      await addDoc(collection(db, "bugs"), {
        page,
        description,
        steps,
        browser,
        reportedBy: currentUser?.email,
        status: "open",
        createdAt: serverTimestamp(),
      });

      setPage("");
      setDescription("");
      setSteps("");
      setBrowser("");
    } catch (error) {
      toast.error("Error submitting bug: " + error);
    }
  };

  return (
    <Box m="20px">
      <Header
        title="REPORT A BUG"
        subtitle="Report and view all Wise Minds Admin bugs"
      />

      <Paper sx={{ p: 3, mb: 4 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Page the bug occurs on"
              value={page}
              onChange={(e) => setPage(e.target.value)}
              required
            />
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={2}
              required
            />
            <TextField
              label="Steps to reproduce"
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              multiline
              rows={3}
              required
            />
            <TextField
              label="Browser used"
              value={browser}
              onChange={(e) => setBrowser(e.target.value)}
              required
            />
            <Button variant="contained" color="primary" type="submit">
              Submit Bug
            </Button>
          </Stack>
        </form>
      </Paper>

      <Typography variant="h5" gutterBottom>
        Existing Bugs
      </Typography>
      <Paper sx={{ p: 2 }}>
        {bugs.length === 0 ? (
          <Typography>No bugs</Typography>
        ) : (
          <Stack spacing={2}>
            {bugs.map((bug) => (
              <Card key={bug.id} variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                    <Chip
                      label={bug.status === "open" ? "Open" : "Closed"}
                      color={bug.status === "open" ? "warning" : "success"}
                      size="small"
                    />
                    <Chip
                      icon={<LanguageOutlinedIcon />}
                      sx={{ p: 0.5 }}
                      label={bug.page}
                      variant="outlined"
                      size="small"
                    />
                    {bug.browser && (
                      <Chip
                        icon={<DesktopWindowsOutlinedIcon />}
                        sx={{ p: 0.5 }}
                        label={bug.browser}
                        variant="outlined"
                        size="small"
                      />
                    )}
                  </Stack>

                  <Typography variant="h4" gutterBottom>
                    {bug.description}
                  </Typography>

                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      mb: 2,
                      whiteSpace: "pre-line",
                    }}
                  >
                    <Typography variant="subtitle2" gutterBottom>
                      Steps to Reproduce:
                    </Typography>
                    <Typography variant="body2">{bug.steps}</Typography>
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  <Stack direction="row" spacing={2} alignItems="center">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PersonOutlineOutlinedIcon />
                      <Typography variant="caption">
                        {bug.reportedBy}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <AccessTimeOutlinedIcon />
                      <Typography variant="caption">
                        {bug.createdAt?.toDate
                          ? format(bug.createdAt.toDate(), "MMM d, yyyy h:mm a")
                          : ""}
                      </Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Paper>

      <ToastContainer position="top-right" autoClose={3000} />
    </Box>
  );
};

export default ReportBug;
