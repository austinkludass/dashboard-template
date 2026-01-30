import { useState } from "react";
import {
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Box,
  Typography,
  useTheme,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { DesktopDatePicker } from "@mui/x-date-pickers/DesktopDatePicker";
import { tokens } from "../../theme";
import dayjs from "dayjs";

const formatDate = (date) => {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
};

const UnavailabilitySelector = ({ unavailability, onChange, isEdit }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [selectedDate, setSelectedDate] = useState(null);
  const [reason, setReason] = useState("");

  const handleAdd = () => {
    if (!selectedDate || !reason) return;

    const newEntry = {
      date: dayjs(selectedDate).format("YYYY-MM-DD"),
      reason,
    };

    onChange([...unavailability, newEntry]);
    setSelectedDate(null);
    setReason("");
  };

  const handleRemove = (index) => {
    const updated = unavailability.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <Box>
      {isEdit && (
        <Box sx={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
          <DesktopDatePicker
            label="Select Date"
            value={selectedDate}
            onChange={(newDate) => setSelectedDate(newDate)}
            slotProps={{
              textField: {
                label: "Select Date",
              },
            }}
          />
          <TextField
            label="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <Button
            variant="contained"
            onClick={handleAdd}
            disabled={!selectedDate || !reason}
          >
            Add
          </Button>
        </Box>
      )}

      <List sx={{ overflow: "auto", maxHeight: "500px" }}>
        {[...unavailability]
          .sort((a, b) => dayjs(a.date).unix() - dayjs(b.date).unix())
          .map((entry, index) => (
            <ListItem
              key={index}
              secondaryAction={
                isEdit && (
                  <IconButton
                    color="error"
                    edge="end"
                    onClick={() => handleRemove(index)}
                  >
                    <DeleteIcon />
                  </IconButton>
                )
              }
            >
              <ListItemText>
                <div style={{ display: "flex", gap: "10px" }}>
                  <Typography
                    variant="h5"
                    color={colors.orangeAccent[400]}
                    fontWeight="bold"
                    sx={{ mb: "5px" }}
                  >
                    {formatDate(entry.date)}
                  </Typography>
                  <Typography variant="h6" color={colors.grey[100]}>
                    {entry.reason}
                  </Typography>
                </div>
              </ListItemText>
            </ListItem>
          ))}
      </List>
    </Box>
  );
};

export default UnavailabilitySelector;
