import { Box, Paper } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import Header from "../../components/Global/Header";
import BigCalendar from "../../components/Calendar/Calendar";

const CalendarPage = () => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
      <Box display="flex" m="20px">
        <Header title="Calendar" subtitle="Lessons Calendar" />
      </Box>

      <Paper sx={{ p: 3, minWidth: 600, m: 4 }}>
        <BigCalendar />
      </Paper>
    </LocalizationProvider>
  );
};

export default CalendarPage;
