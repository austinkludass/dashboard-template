import { Box, Button, ButtonGroup, Typography } from "@mui/material";

function Toolbar({ label, onNavigate, onView, views, view }) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "8px",
      }}
    >
      <ButtonGroup variant="outlined" size="small">
        <Button onClick={() => onNavigate("PREV")}>Prev</Button>
        <Button onClick={() => onNavigate("TODAY")}>Today</Button>
        <Button onClick={() => onNavigate("NEXT")}>Next</Button>
      </ButtonGroup>

      <Typography variant="h4">{label}</Typography>

      <ButtonGroup variant="outlined" size="small">
        {views.map((name) => (
          <Button
            key={name}
            onClick={() => onView(name)}
            variant={view === name ? "contained" : "outlined"}
          >
            {name}
          </Button>
        ))}
      </ButtonGroup>
    </Box>
  );
}

export default Toolbar;
