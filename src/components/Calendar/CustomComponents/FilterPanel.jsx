import React from "react";
import { Box, TextField, Autocomplete, Chip } from "@mui/material";

const FilterPanel = ({ filters, setFilters, options }) => {
  const handleChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 2,
        mb: 2,
      }}
    >
      <Autocomplete
        multiple
        options={options.tutors}
        value={filters.tutors}
        onChange={(e, value) => handleChange("tutors", value)}
        renderInput={(params) => <TextField {...params} label="Tutors" />}
        renderTags={(value) =>
          value.length > 0 ? <Chip label={`${value.length} selected`} /> : null
        }
      />

      <Autocomplete
        multiple
        options={options.students}
        value={filters.students}
        onChange={(e, value) => handleChange("students", value)}
        renderInput={(params) => <TextField {...params} label="Students" />}
        renderTags={(value) =>
          value.length > 0 ? <Chip label={`${value.length} selected`} /> : null
        }
      />

      <Autocomplete
        multiple
        options={options.subjectGroups}
        value={filters.subjectGroups}
        onChange={(e, value) => handleChange("subjectGroups", value)}
        renderInput={(params) => (
          <TextField {...params} label="Subject Groups" />
        )}
        renderTags={(value) =>
          value.length > 0 ? <Chip label={`${value.length} selected`} /> : null
        }
      />

      <Autocomplete
        multiple
        options={options.locations}
        value={filters.locations}
        onChange={(e, value) => handleChange("locations", value)}
        renderInput={(params) => <TextField {...params} label="Locations" />}
        renderTags={(value) =>
          value.length > 0 ? <Chip label={`${value.length} selected`} /> : null
        }
      />

      <Autocomplete
        multiple
        options={["Weekly", "Fortnightly", "Single"]}
        value={filters.frequencies}
        onChange={(e, value) => handleChange("frequencies", value)}
        renderInput={(params) => <TextField {...params} label="Frequencies" />}
        renderTags={(value) =>
          value.length > 0 ? <Chip label={`${value.length} selected`} /> : null
        }
      />

      <Autocomplete
        multiple
        options={["Normal", "Student Trial", "Tutor Trial", "Unconfirmed", "Cancelled", "Postponed"]}
        value={filters.types}
        onChange={(e, value) => handleChange("types", value)}
        renderInput={(params) => <TextField {...params} label="Types" />}
        renderTags={(value) =>
          value.length > 0 ? <Chip label={`${value.length} selected`} /> : null
        }
      />
    </Box>
  );
};

export default FilterPanel;
