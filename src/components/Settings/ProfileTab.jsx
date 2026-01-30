import { useState, useContext, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Avatar,
  InputAdornment,
  IconButton,
} from "@mui/material";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../data/firebase";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const ProfileTab = () => {
  const { currentUser } = useContext(AuthContext);
  const [tutorData, setTutorData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const fetchTutorData = async () => {
      if (!currentUser?.uid) {
        setLoading(false);
        return;
      }

      try {
        const tutorRef = doc(db, "tutors", currentUser.uid);
        const tutorSnap = await getDoc(tutorRef);

        if (tutorSnap.exists()) {
          setTutorData(tutorSnap.data());
        }
      } catch (error) {
        console.error("Error fetching tutor data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTutorData();
  }, [currentUser]);

  const validatePassword = () => {
    if (!currentPassword) {
      setPasswordError("Please enter your current password");
      return false;
    }

    if (!newPassword) {
      setPasswordError("Please enter a new password");
      return false;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return false;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return false;
    }

    if (currentPassword === newPassword) {
      setPasswordError("New password must be different from current password");
      return false;
    }

    return true;
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess(false);

    if (!validatePassword()) {
      return;
    }

    setChangingPassword(true);

    try {
      const user = auth.currentUser;

      if (!user || !user.email) {
        throw new Error("No authenticated user found");
      }

      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );

      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated successfully");
    } catch (error) {
      console.error("Password change error:", error);

      switch (error.code) {
        case "auth/wrong-password":
          setPasswordError("Current password is incorrect");
          break;
        case "auth/invalid-credential":
          setPasswordError("Current password is incorrect");
          break;
        case "auth/too-many-requests":
          setPasswordError("Too many failed attempts. Please try again later.");
          break;
        case "auth/requires-recent-login":
          setPasswordError("Please log out and log back in, then try again");
          break;
        case "auth/weak-password":
          setPasswordError(
            "Password is too weak. Please choose a stronger password."
          );
          break;
        default:
          setPasswordError(error.message || "Failed to change password");
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const handleClearForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
    setPasswordSuccess(false);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Paper elevation={1} sx={{ p: 3, borderRadius: "12px", mb: 3 }}>
        <Typography variant="h5" fontWeight="600" mb={1}>
          Profile Information
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Your account details and profile information.
        </Typography>

        <Box display="flex" alignItems="center" gap={3} mb={2}>
          <Avatar
            src={tutorData?.avatar}
            sx={{
              width: 80,
              height: 80,
              bgcolor: tutorData?.tutorColor || "primary.main",
              fontSize: "2rem",
            }}
          >
            {tutorData?.firstName?.charAt(0) || currentUser?.email?.charAt(0)}
          </Avatar>

          <Box>
            <Typography variant="h6">
              {tutorData
                ? `${tutorData.firstName} ${tutorData.lastName}`
                : "User"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {currentUser?.email}
            </Typography>
            {tutorData?.role && (
              <Typography
                variant="caption"
                color="primary.main"
                sx={{ textTransform: "capitalize" }}
              >
                {tutorData.role}
              </Typography>
            )}
          </Box>
        </Box>
      </Paper>

      <Paper elevation={1} sx={{ p: 3, borderRadius: "12px" }}>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <LockIcon color="action" />
          <Typography variant="h5" fontWeight="600">
            Change Password
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Update your password to keep your account secure. You'll need to enter
          your current password first.
        </Typography>

        <Divider sx={{ mb: 3 }} />

        {passwordSuccess && (
          <Alert
            severity="success"
            icon={<CheckCircleIcon />}
            sx={{ mb: 3 }}
            onClose={() => setPasswordSuccess(false)}
          >
            Your password has been changed successfully.
          </Alert>
        )}

        {passwordError && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            onClose={() => setPasswordError("")}
          >
            {passwordError}
          </Alert>
        )}

        <Box
          component="form"
          sx={{ maxWidth: 400 }}
          onSubmit={(e) => {
            e.preventDefault();
            handleChangePassword();
          }}
        >
          <TextField
            fullWidth
            label="Current Password"
            type={showCurrentPassword ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            margin="normal"
            autoComplete="current-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    edge="end"
                    size="small"
                  >
                    {showCurrentPassword ? (
                      <VisibilityOffIcon />
                    ) : (
                      <VisibilityIcon />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="New Password"
            type={showNewPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            margin="normal"
            autoComplete="new-password"
            helperText="Password must be at least 6 characters"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    edge="end"
                    size="small"
                  >
                    {showNewPassword ? (
                      <VisibilityOffIcon />
                    ) : (
                      <VisibilityIcon />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Confirm New Password"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            margin="normal"
            autoComplete="new-password"
            error={confirmPassword !== "" && newPassword !== confirmPassword}
            helperText={
              confirmPassword !== "" && newPassword !== confirmPassword
                ? "Passwords do not match"
                : ""
            }
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                    size="small"
                  >
                    {showConfirmPassword ? (
                      <VisibilityOffIcon />
                    ) : (
                      <VisibilityIcon />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Box display="flex" gap={2} mt={3}>
            <Button
              variant="contained"
              onClick={handleChangePassword}
              disabled={
                changingPassword ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword
              }
            >
              {changingPassword ? (
                <CircularProgress size={24} sx={{ color: "white" }} />
              ) : (
                "Update Password"
              )}
            </Button>

            <Button
              variant="outlined"
              onClick={handleClearForm}
              disabled={changingPassword}
            >
              Clear
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default ProfileTab;
