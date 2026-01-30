import {
  Dialog,
  DialogTitle,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Box,
  DialogContent,
} from "@mui/material";
import { useState, useMemo } from "react";

export default function AddToGroupDialog({
  open,
  onClose,
  subject,
  groups,
  onSelectGroup,
}) {
  const [search, setSearch] = useState("");

  const filteredGroups = useMemo(() => {
    return groups.filter((group) =>
      group.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [groups, search]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        Select a group to add <strong>{subject?.name}</strong>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{ height: 300, display: "flex", flexDirection: "column" }}
      >
        <TextField
          autoFocus
          fullWidth
          placeholder="Search groups..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          variant="outlined"
          size="small"
          sx={{ mb: 2 }}
        />

        <Box sx={{ flexGrow: 1, overflowY: "auto", borderRadius: 1 }}>
          <List dense>
            {filteredGroups.map((group) => (
              <ListItemButton
                key={group.id}
                onClick={() => {
                  onSelectGroup(group.id);
                  setSearch("");
                }}
              >
                <ListItemText primary={group.name} />
              </ListItemButton>
            ))}

            {filteredGroups.length === 0 && (
              <ListItemText
                sx={{ px: 2, py: 1 }}
                primary="No matching groups."
              />
            )}
          </List>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
