import { useEffect, useRef, useState } from "react";
import { Box, Typography, TextField, Button, useTheme } from "@mui/material";
import { tokens } from "../../theme";
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../../data/firebase";
import { format } from "date-fns";

const Noticeboard = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [senderName, setSenderName] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    const fetchTutorName = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const tutorRef = doc(db, "tutors", user.uid);
      const tutorSnap = await getDoc(tutorRef);

      if (tutorSnap.exists()) {
        const t = tutorSnap.data();
        setSenderName(`${t.firstName} ${t.lastName}`);
      } else {
        setSenderName(user.email);
      }
    };

    fetchTutorName();
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "chatMessages"),
      orderBy("timestamp", "desc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages([...msgs].reverse());
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    const user = auth.currentUser;
    if (!user) return;

    let nameToUse = senderName;
    if (!nameToUse) {
      const tutorRef = doc(db, "tutors", user.uid);
      const tutorSnap = await getDoc(tutorRef);

      if (tutorSnap.exists()) {
        const t = tutorSnap.data();
        nameToUse = `${t.firstName} ${t.lastName}`;
        setSenderName(nameToUse);
      } else {
        nameToUse = user.email;
        setSenderName(nameToUse);
      }
    }

    await addDoc(collection(db, "chatMessages"), {
      senderId: user.uid,
      senderName: nameToUse,
      message: newMessage.trim(),
      timestamp: serverTimestamp(),
      replyTo: replyTo
        ? {
            messageId: replyTo.messageId,
            senderName: replyTo.senderName,
            message: replyTo.message,
          }
        : null,
    });

    setNewMessage("");
    setReplyTo(null);
  };

  return (
    <Box
      width="100%"
      height="100%"
      display="flex"
      flexDirection="column"
      p="20px"
      bgcolor={colors.primary[400]}
      borderRadius="8px"
      overflow="hidden"
    >
      <Typography variant="h3" mb="16px" color={colors.orangeAccent[400]}>
        Message Board
      </Typography>

      <Box
        ref={messagesContainerRef}
        flex="1"
        overflow="auto"
        mb={2}
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          paddingRight: "8px",
        }}
      >
        {messages.map((msg) => (
          <Box
            key={msg.id}
            p="10px"
            bgcolor={colors.primary[500]}
            borderRadius="6px"
          >
            <Typography
              variant="body2"
              color={colors.orangeAccent[400]}
              sx={{ fontWeight: "bold" }}
            >
              {msg.senderName}
            </Typography>

            {msg.replyTo && (
              <Box
                sx={{
                  borderLeft: `3px solid ${colors.orangeAccent[400]}`,
                  pl: 1,
                  mb: 0.5,
                  opacity: 0.8,
                }}
              >
                <Typography variant="caption">
                  Replying to <b>{msg.replyTo.senderName}</b>{" "}
                </Typography>
                <Typography variant="caption" noWrap>
                  "{msg.replyTo.message}"
                </Typography>
              </Box>
            )}

            <Typography variant="body1">{msg.message}</Typography>

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "end",
              }}
            >
              <Typography fontSize={10} color="text.secondary">
                {msg.timestamp?.toDate
                  ? format(msg.timestamp.toDate(), "dd MMM yyyy, h:mm a")
                  : "Sending..."}
              </Typography>

              <Button
                size="small"
                onClick={() =>
                  setReplyTo({
                    messageId: msg.id,
                    senderName: msg.senderName,
                    message: msg.message,
                  })
                }
              >
                Reply
              </Button>
            </Box>
          </Box>
        ))}
      </Box>

      {replyTo && (
        <Box
          mb={1}
          p={1}
          bgcolor={colors.primary[500]}
          borderRadius="6px"
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box>
            <Typography variant="caption">
              Replying to <b>{replyTo.senderName}</b>{" "}
            </Typography>
            <Typography variant="caption">“{replyTo.message}”</Typography>
          </Box>

          <Button size="small" color="error" onClick={() => setReplyTo(null)}>
            Cancel
          </Button>
        </Box>
      )}

      <Box display="flex" gap="8px">
        <TextField
          variant="outlined"
          size="small"
          fullWidth
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button variant="contained" onClick={handleSend}>
          Send
        </Button>
      </Box>
    </Box>
  );
};

export default Noticeboard;
