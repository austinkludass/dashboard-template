import { useEffect, useState } from "react";
import {
  Box,
  TextField,
  Chip,
  Stack,
  Typography,
  CircularProgress,
  Autocomplete,
} from "@mui/material";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../data/firebase";

const TutorCapabilities = ({
  capabilityIds = [],
  setCapabilityIds,
  isEdit,
}) => {
  const [subjectGroups, setSubjectGroups] = useState([]);
  const [autocompleteValue, setAutocompleteValue] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const snapshot = await getDocs(collection(db, "subjectGroups"));
        const groups = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSubjectGroups(groups);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching subject groups:", err);
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  const getGroupById = (id) => subjectGroups.find((g) => g.id === id);
  const selectedGroups = capabilityIds.map(getGroupById).filter(Boolean);
  const availableGroups = subjectGroups.filter(
    (group) => !capabilityIds.includes(group.id)
  );

  const handleAddGroup = (event, newValue) => {
    if (newValue && !capabilityIds.includes(newValue.id)) {
      setCapabilityIds([...capabilityIds, newValue.id]);
    }
    setAutocompleteValue(null);
    setInputValue("");
  };

  const handleRemoveGroup = (id) => {
    setCapabilityIds(capabilityIds.filter((groupId) => groupId !== id));
  };

  return (
    <Box sx={{ mb: 4 }}>
      {loading ? (
        <CircularProgress />
      ) : (
        <>
          {isEdit && (
            <Autocomplete
              options={availableGroups}
              getOptionLabel={(option) => option.name}
              value={autocompleteValue}
              inputValue={inputValue}
              onChange={handleAddGroup}
              onInputChange={(event, newInputValue) =>
                setInputValue(newInputValue)
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search Subject Groups"
                  placeholder="Type to search..."
                />
              )}
              isOptionEqualToValue={(option, value) => option.id === value?.id}
              clearOnBlur
            />
          )}

          {selectedGroups.length > 0 && (
            <Box mt={isEdit ? 2 : 0}>
              {isEdit && <Typography variant="h6">Selected Groups</Typography>}
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {selectedGroups.map((group) => (
                  <Chip
                    key={group.id}
                    label={group.name}
                    onDelete={
                      isEdit ? () => handleRemoveGroup(group.id) : undefined
                    }
                    variant={isEdit ? "filled" : "outlined"}
                  />
                ))}
              </Stack>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default TutorCapabilities;
