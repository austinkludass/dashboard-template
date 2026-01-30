import { tokens } from "../../theme";
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../data/firebase";
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Stack,
  Typography,
  Tooltip,
  useTheme,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";

function PriorityChip({ p }) {
  const label = p === "high" ? "High" : p === "medium" ? "Medium" : "Low";
  return (
    <Chip
      size="small"
      label={label}
      color={p === "high" ? "error" : p === "medium" ? "warning" : "default"}
    />
  );
}

const Notifications = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [items, setItems] = useState([]);
  const [tutorId, setTutorId] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser?.uid) {
      setTutorId(storedUser.uid);
    }
  }, []);

  useEffect(() => {
    if (!tutorId) return;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", tutorId),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, [tutorId]);

  const unread = useMemo(() => items.filter((n) => !n.read), [items]);

  const markAsRead = async (id) => {
    const ref = doc(db, "notifications", id);
    await updateDoc(ref, { read: true, readAt: serverTimestamp() });
  };

  return (
    <Box
      width="100%"
      height="100%"
      p="20px"
      bgcolor={colors.primary[400]}
      borderRadius="8px"
      overflow="auto"
    >
      <Typography variant="h3" mb="16px" color={colors.orangeAccent[400]}>
        Notifications
      </Typography>
      {!tutorId ? (
        <Typography variant="body2" color="text.secondary">
          Please log in to see notifications.
        </Typography>
      ) : items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No notifications
        </Typography>
      ) : (
        <List dense>
          {items.map((n) => (
            <ListItem
              key={n.id}
              secondaryAction={
                !n.read && (
                  <Tooltip title="Mark as read">
                    <IconButton edge="end" onClick={() => markAsRead(n.id)}>
                      <CheckIcon />
                    </IconButton>
                  </Tooltip>
                )
              }
            >
              <ListItemText
                primary={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {n.priority === "high" && (
                      <PriorityHighIcon fontSize="small" color="error" />
                    )}
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: n.read ? 400 : 600 }}
                    >
                      {n.title}
                    </Typography>
                    <PriorityChip p={n.priority} />
                  </Stack>
                }
                secondary={n.message}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default Notifications;
