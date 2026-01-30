import { Autocomplete, TextField } from "@mui/material";

const StudentSelector = ({ students, selected, setSelected, assignedIds }) => {
  const options = students.map((s) => ({
    id: s.id,
    name: `${s.firstName} ${s.lastName}`,
  }));

  return (
    <Autocomplete
      multiple
      options={options}
      value={selected}
      getOptionLabel={(opt) => opt.name}
      getOptionDisabled={(opt) =>
        assignedIds.includes(opt.id) || selected.some((s) => s.id === opt.id)
      }
      onChange={(e, value) => setSelected(value)}
      renderInput={(params) => (
        <TextField {...params} label="Select Students" />
      )}
    />
  );
};

export default StudentSelector;
