import React from "react";
import { Paper, Stack, Typography, Box } from "@mui/material";

const Section = ({ title, children, actions, sx = {} }) => {
  return (
    <Paper sx={{ p: 3, maxWidth: 1000, minWidth: 600, m: 4, ...sx }}>
      <Stack spacing={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4">{title}</Typography>
          {actions && <Box>{actions}</Box>}
        </Box>
        {children}
      </Stack>
    </Paper>
  );
};

export default Section;
