import { Typography, Box, useTheme } from "@mui/material";
import { tokens } from "../../../theme";
import dayjs from "dayjs";
import React from "react";

const WeekHeader = React.memo(({ date }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isToday = dayjs(date).isSame(dayjs(), "day");

  return (
    <Box textAlign="center">
      <Box
        sx={{
          width: 45,
          height: 45,
          bgcolor: isToday ? colors.orangeAccent[700] : "transparent",
          color: isToday ? colors.primary[900] : colors.primary[100],
          borderRadius: "50%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          mx: "auto",
          m: "6px",
        }}
      >
        <Typography variant="body2" sx={{ textTransform: "uppercase" }}>
          {dayjs(date).format("ddd")}
        </Typography>
        <Typography variant="h5" fontWeight="bold">
          {dayjs(date).format("D")}
        </Typography>
      </Box>
    </Box>
  );
});

export default WeekHeader;
