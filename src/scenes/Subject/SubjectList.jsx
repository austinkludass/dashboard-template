import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FixedSizeList as List } from "react-window";
import { VirtualizedAutoComplete } from "../../components/Global/VirtualizedAutoComplete";
import usePermissions from "../../hooks/usePermissions";
import {
  Box,
  Tabs,
  Tab,
  Card,
  Typography,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Chip,
  Autocomplete,
  Collapse,
  Tooltip,
  Alert,
  Checkbox,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  CollectionsBookmark as GroupIcon,
  LibraryBooks as BookIcon,
  Add as AddIcon,
  Lock as LockIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from "@mui/icons-material";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../data/firebase";
import Header from "../../components/Global/Header";
import AddToGroupDialog from "../../components/subject/AddToGroupDialog";

const SubjectList = () => {
  const { canEditSubjects } = usePermissions();

  const [tab, setTab] = useState(0);
  const [curriculums, setCurriculums] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [groups, setGroups] = useState([]);
  const [subjectInput, setSubjectInput] = useState({});
  const [subjectIsCommon, setSubjectIsCommon] = useState({});
  const [groupSubjectSelect, setGroupSubjectSelect] = useState({});
  const [newCurriculum, setNewCurriculum] = useState("");
  const [newGroup, setNewGroup] = useState("");
  const [editCurriculumId, setEditCurriculumId] = useState(null);
  const [editGroupId, setEditGroupId] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteType, setDeleteType] = useState("");
  const [showSubjectsMap, setShowSubjectsMap] = useState({});
  const [showGroupSubjectsMap, setShowGroupSubjectsMap] = useState({});
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showAddCurriculum, setShowAddCurriculum] = useState(false);
  const [curriculumSearch, setCurriculumSearch] = useState("");
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [groupSearch, setGroupSearch] = useState("");
  const [curriculumSubjectSearch, setCurriculumSubjectSearch] = useState({});
  const [subjectGrpSubjectSearch, setSubjectGrpSubjectSearch] = useState({});

  const tabMap = {
    0: "curriculums",
    1: "groups",
    2: "ungrouped",
  };

  const reverseTabMap = {
    curriculums: 0,
    groups: 1,
    ungrouped: 2,
  };

  useEffect(() => {
    const tabKey = searchParams.get("tab");
    if (tabKey && reverseTabMap[tabKey] !== undefined) {
      setTab(reverseTabMap[tabKey]);
    }
  }, [searchParams]);

  const fetchData = async () => {
    const [curSnap, subSnap, grpSnap] = await Promise.all([
      getDocs(collection(db, "curriculums")),
      getDocs(collection(db, "subjects")),
      getDocs(collection(db, "subjectGroups")),
    ]);
    setCurriculums(curSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setSubjects(subSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setGroups(grpSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleShowSubjects = (id) => {
    setShowSubjectsMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleShowGroupSubjects = (id) => {
    setShowGroupSubjectsMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleTabChange = (_, val) => {
    setTab(val);
    setSearchParams({ tab: tabMap[val] });
  };

  const handleAddCurriculum = async () => {
    if (!newCurriculum.trim() || !canEditSubjects) return;

    const docRef = await addDoc(collection(db, "curriculums"), {
      name: newCurriculum,
    });

    setCurriculums((prev) => [...prev, { id: docRef.id, name: newCurriculum }]);
    setNewCurriculum("");
  };

  const handleDeleteCurriculum = async (curriculumId) => {
    if (!canEditSubjects) return;

    const toDelete = subjects.filter((s) => s.curriculumId === curriculumId);

    for (let s of toDelete) {
      await deleteDoc(doc(db, "subjects", s.id));
    }

    await deleteDoc(doc(db, "curriculums", curriculumId));

    setSubjects((prev) => prev.filter((s) => s.curriculumId !== curriculumId));
    setCurriculums((prev) => prev.filter((c) => c.id !== curriculumId));
  };

  const handleAddSubject = async (curriculumId) => {
    if (!canEditSubjects) return;

    const name = subjectInput[curriculumId];
    if (!name) return;

    const isCommon = subjectIsCommon[curriculumId] || false;

    const docRef = await addDoc(collection(db, "subjects"), {
      name,
      curriculumId,
      isCommon,
    });

    setSubjects((prev) => [
      ...prev,
      { id: docRef.id, name, curriculumId, isCommon },
    ]);

    setSubjectInput((prev) => ({ ...prev, [curriculumId]: "" }));
    setSubjectIsCommon((prev) => ({ ...prev, [curriculumId]: false }));
  };

  const handleToggleCommon = async (subjectId) => {
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return;

    const newIsCommon = !subject.isCommon;

    await updateDoc(doc(db, "subjects", subjectId), {
      isCommon: newIsCommon,
    });

    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId ? { ...s, isCommon: newIsCommon } : s
      )
    );
  };

  const handleDeleteSubject = async (subjectId) => {
    if (!canEditSubjects) return;

    await deleteDoc(doc(db, "subjects", subjectId));
    setSubjects((prev) => prev.filter((s) => s.id !== subjectId));
  };

  const handleAddGroup = async () => {
    if (!newGroup.trim() || !canEditSubjects) return;

    const docRef = await addDoc(collection(db, "subjectGroups"), {
      name: newGroup,
      subjectIds: [],
    });

    setGroups((prev) => [
      ...prev,
      { id: docRef.id, name: newGroup, subjectIds: [] },
    ]);
    setNewGroup("");
  };

  const handleDeleteGroup = async (groupId) => {
    if (!canEditSubjects) return;

    await deleteDoc(doc(db, "subjectGroups", groupId));
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
  };

  const handleAddSubjectToGroup = async (groupId) => {
    if (!canEditSubjects) return;

    const subjectId = groupSubjectSelect[groupId];
    if (!subjectId) return;

    const group = groups.find((g) => g.id === groupId);
    const updated = [...new Set([...(group.subjectIds || []), subjectId])];

    await updateDoc(doc(db, "subjectGroups", groupId), {
      subjectIds: updated,
    });

    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, subjectIds: updated } : g))
    );
  };

  const handleRemoveSubjectFromGroup = async (groupId, subjectId) => {
    if (!canEditSubjects) return;

    const group = groups.find((g) => g.id === groupId);
    const updated = group.subjectIds.filter((id) => id !== subjectId);

    await updateDoc(doc(db, "subjectGroups", groupId), {
      subjectIds: updated,
    });

    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, subjectIds: updated } : g))
    );
  };

  const startEdit = (id, type, name) => {
    if (!canEditSubjects) return;

    setEditedName(name);
    if (type === "curriculum") setEditCurriculumId(id);
    if (type === "group") setEditGroupId(id);
  };

  const saveEdit = async (id, type) => {
    if (!canEditSubjects) return;

    const ref = doc(
      db,
      type === "curriculum" ? "curriculums" : "subjectGroups",
      id
    );
    await updateDoc(ref, { name: editedName });

    if (type === "curriculum") {
      setCurriculums((prev) =>
        prev.map((c) => (c.id === id ? { ...c, name: editedName } : c))
      );
      setEditCurriculumId(null);
    }

    if (type === "group") {
      setGroups((prev) =>
        prev.map((g) => (g.id === id ? { ...g, name: editedName } : g))
      );
      setEditGroupId(null);
    }

    setEditedName("");
  };

  const openDeleteDialog = (type, item) => {
    if (!canEditSubjects) return;

    setDeleteType(type);
    setDeleteTarget(item);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !canEditSubjects) return;
    if (deleteType === "curriculum")
      await handleDeleteCurriculum(deleteTarget.id);
    if (deleteType === "group") await handleDeleteGroup(deleteTarget.id);
    setDeleteTarget(null);
    setDeleteType("");
  };

  const groupedSubjectIds = new Set(groups.flatMap((g) => g.subjectIds || []));

  const ungroupedSubjects = subjects
    .filter((s) => !groupedSubjectIds.has(s.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleOpenAddDialog = (subject) => {
    if (!canEditSubjects) return;
    setSelectedSubject(subject);
    setAddDialogOpen(true);
  };

  const handleAddToGroup = async (groupId) => {
    if (!canEditSubjects) return;

    const group = groups.find((g) => g.id === groupId);
    const updated = [
      ...new Set([...(group.subjectIds || []), selectedSubject.id]),
    ];

    await updateDoc(doc(db, "subjectGroups", groupId), {
      subjectIds: updated,
    });

    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, subjectIds: updated } : g))
    );

    setAddDialogOpen(false);
    setSelectedSubject(null);
  };

  return (
    <Box p={4}>
      <Header
        title="SUBJECTS"
        subtitle="Manage subjects, groups and curricula"
      />

      {!canEditSubjects && (
        <Alert severity="info" icon={<LockIcon />} sx={{ mb: 3 }}>
          Only Admins can edit curriculums, subject groups, and subjects.
          Contact an Admin if you need to make changes.
        </Alert>
      )}

      <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Curriculums" />
        <Tab label="Subject Groups" />
        <Tab label="Ungrouped Subjects" />
      </Tabs>

      {tab === 0 && (
        <Box>
          <Card
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "16px",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                gap: 2,
              }}
            >
              <TextField
                label="Search curriculums..."
                value={curriculumSearch}
                onChange={(e) => setCurriculumSearch(e.target.value)}
                fullWidth
              />

              {canEditSubjects && (
                <Tooltip title="Add new Curriculum">
                  <IconButton
                    color={showAddCurriculum ? "primary" : "default"}
                    onClick={() => setShowAddCurriculum((prev) => !prev)}
                  >
                    <AddIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            <Collapse
              sx={{ width: "100%" }}
              in={showAddCurriculum}
              timeout="auto"
              unmountOnExit
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  gap: 1,
                }}
              >
                <TextField
                  label="Enter curriculum name..."
                  value={newCurriculum}
                  onChange={(e) => setNewCurriculum(e.target.value)}
                  fullWidth
                  sx={{ mr: 2 }}
                />
                <Button variant="contained" onClick={handleAddCurriculum}>
                  Add
                </Button>
              </Box>
            </Collapse>
          </Card>

          <Box display="flex" flexWrap="wrap" gap={2} mt={2}>
            {curriculums
              .filter((cur) =>
                cur.name
                  .toLowerCase()
                  .includes(curriculumSearch.trim().toLowerCase())
              )
              .map((cur) => (
                <Card
                  key={cur.id}
                  sx={{
                    width: "100%",
                    maxWidth: "480px",
                    padding: "16px",
                    borderRadius: "12px",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={1}>
                      <BookIcon />
                      {editCurriculumId === cur.id ? (
                        <TextField
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                        />
                      ) : (
                        <Typography variant="h6">{cur.name}</Typography>
                      )}
                      <Chip
                        label={`${
                          subjects.filter((s) => s.curriculumId === cur.id)
                            .length
                        } subjects`}
                      />
                    </Box>
                    {canEditSubjects && (
                      <Box
                        sx={{
                          display: "flex",
                          flex: "0",
                          alignItems: "center",
                          justifyContent: "center",
                          marginLeft: "10px",
                        }}
                      >
                        {editCurriculumId === cur.id ? (
                          <IconButton
                            onClick={() => saveEdit(cur.id, "curriculum")}
                          >
                            <SaveIcon />
                          </IconButton>
                        ) : (
                          <IconButton
                            onClick={() =>
                              startEdit(cur.id, "curriculum", cur.name)
                            }
                          >
                            <EditIcon />
                          </IconButton>
                        )}
                        <IconButton
                          onClick={() => openDeleteDialog("curriculum", cur)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    )}
                  </Box>

                  {canEditSubjects && (
                    <Stack
                      direction="row"
                      mt={2}
                      spacing={2}
                      alignItems="center"
                    >
                      <TextField
                        fullWidth
                        placeholder="Add new subject..."
                        value={subjectInput[cur.id] || ""}
                        onChange={(e) =>
                          setSubjectInput((prev) => ({
                            ...prev,
                            [cur.id]: e.target.value,
                          }))
                        }
                      />
                      <Tooltip title="Mark as common subject">
                        <Checkbox
                          checked={subjectIsCommon[cur.id] || false}
                          onChange={(e) =>
                            setSubjectIsCommon((prev) => ({
                              ...prev,
                              [cur.id]: e.target.checked,
                            }))
                          }
                          icon={<StarBorderIcon />}
                          checkedIcon={<StarIcon />}
                          color="warning"
                        />
                      </Tooltip>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Button
                          variant="contained"
                          onClick={() => handleAddSubject(cur.id)}
                        >
                          Add
                        </Button>
                      </Box>
                    </Stack>
                  )}

                  <Button
                    size="small"
                    sx={{ mt: "10px" }}
                    variant="outlined"
                    onClick={() => toggleShowSubjects(cur.id)}
                  >
                    {showSubjectsMap[cur.id]
                      ? "Hide Subjects"
                      : "Show Subjects"}
                  </Button>

                  {showSubjectsMap[cur.id] && (
                    <>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Search subjects..."
                        value={curriculumSubjectSearch[cur.id] || ""}
                        onChange={(e) =>
                          setCurriculumSubjectSearch((prev) => ({
                            ...prev,
                            [cur.id]: e.target.value,
                          }))
                        }
                        sx={{ mb: 2, mt: 1 }}
                      />

                      <List
                        height={400}
                        itemCount={
                          subjects.filter(
                            (s) =>
                              s.curriculumId === cur.id &&
                              s.name
                                .toLowerCase()
                                .includes(
                                  (
                                    curriculumSubjectSearch[cur.id] || ""
                                  ).toLowerCase()
                                )
                          ).length
                        }
                        itemSize={50}
                        width="100%"
                      >
                        {({ index, style }) => {
                          const filtered = subjects
                            .filter(
                              (s) =>
                                s.curriculumId === cur.id &&
                                s.name
                                  .toLowerCase()
                                  .includes(
                                    (
                                      curriculumSubjectSearch[cur.id] || ""
                                    ).toLowerCase()
                                  )
                            )
                            .sort((a, b) => a.name.localeCompare(b.name));
                          const subject = filtered[index];

                          return (
                            <Box
                              key={subject.id}
                              style={style}
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                px: 2,
                                py: 1,
                              }}
                            >
                              <Box
                                display="flex"
                                alignItems="center"
                                gap={1}
                                flex={1}
                              >
                                <Typography>{subject.name}</Typography>
                                {subject.isCommon && (
                                  <Chip
                                    size="small"
                                    label="Common"
                                    color="warning"
                                    icon={<StarIcon />}
                                  />
                                )}
                              </Box>
                              {canEditSubjects && (
                                <Box>
                                  <Tooltip
                                    title={
                                      subject.isCommon
                                        ? "Remove common status"
                                        : "Mark as common"
                                    }
                                  >
                                    <IconButton
                                      onClick={() =>
                                        handleToggleCommon(subject.id)
                                      }
                                      color={
                                        subject.isCommon ? "warning" : "default"
                                      }
                                    >
                                      {subject.isCommon ? (
                                        <StarIcon />
                                      ) : (
                                        <StarBorderIcon />
                                      )}
                                    </IconButton>
                                  </Tooltip>
                                  <IconButton
                                    onClick={() =>
                                      handleDeleteSubject(subject.id)
                                    }
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Box>
                              )}
                            </Box>
                          );
                        }}
                      </List>
                    </>
                  )}
                </Card>
              ))}
          </Box>
        </Box>
      )}

      {tab === 1 && (
        <Box>
          <Card
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "16px",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                gap: 2,
              }}
            >
              <TextField
                label="Search groups..."
                value={groupSearch}
                onChange={(e) => setGroupSearch(e.target.value)}
                fullWidth
              />

              {canEditSubjects && (
                <Tooltip title="Add new Subject Group">
                  <IconButton
                    color={showAddGroup ? "primary" : "default"}
                    onClick={() => setShowAddGroup((prev) => !prev)}
                  >
                    <AddIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            <Collapse
              sx={{ width: "100%" }}
              in={showAddGroup}
              timeout="auto"
              unmountOnExit
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  gap: 1,
                }}
              >
                <TextField
                  label="Enter group name..."
                  value={newGroup}
                  onChange={(e) => setNewGroup(e.target.value)}
                  fullWidth
                  sx={{ mr: 2 }}
                />
                <Button variant="contained" onClick={handleAddGroup}>
                  Add
                </Button>
              </Box>
            </Collapse>
          </Card>

          <Box display="flex" flexWrap="wrap" gap={2} mt={2}>
            {groups
              .filter((g) =>
                g.name.toLowerCase().includes(groupSearch.trim().toLowerCase())
              )
              .map((g) => (
                <Card
                  key={g.id}
                  sx={{
                    width: "100%",
                    maxWidth: "480px",
                    padding: "16px",
                    borderRadius: "12px",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={1}>
                      <GroupIcon />
                      {editGroupId === g.id ? (
                        <TextField
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                        />
                      ) : (
                        <Typography variant="h6">{g.name}</Typography>
                      )}
                      <Chip
                        label={`${g.subjectIds.length} subjects`}
                        color="success"
                      />
                    </Box>

                    {canEditSubjects && (
                      <Box
                        sx={{
                          display: "flex",
                          flex: "0",
                          alignItems: "center",
                          justifyContent: "center",
                          marginLeft: "10px",
                        }}
                      >
                        {editGroupId === g.id ? (
                          <IconButton onClick={() => saveEdit(g.id, "group")}>
                            <SaveIcon />
                          </IconButton>
                        ) : (
                          <IconButton
                            onClick={() => startEdit(g.id, "group", g.name)}
                          >
                            <EditIcon />
                          </IconButton>
                        )}
                        <IconButton
                          onClick={() => openDeleteDialog("group", g)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    )}
                  </Box>

                  {canEditSubjects && (
                    <Stack direction="row" mt={2} spacing={2}>
                      <Autocomplete
                        fullWidth
                        disableListWrap
                        value={
                          subjects.find(
                            (s) => s.id === groupSubjectSelect[g.id]
                          ) || null
                        }
                        options={subjects
                          .filter((s) => !g.subjectIds.includes(s.id))
                          .sort((a, b) => a.name.localeCompare(b.name))}
                        getOptionLabel={(option) =>
                          `${option.name}${option.isCommon ? " ★" : ""} (${
                            curriculums.find(
                              (c) => c.id === option.curriculumId
                            )?.name || "Unknown"
                          })`
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Select subject..."
                            variant="outlined"
                          />
                        )}
                        onChange={(_, value) => {
                          setGroupSubjectSelect((prev) => ({
                            ...prev,
                            [g.id]: value?.id || "",
                          }));
                        }}
                        isOptionEqualToValue={(option, value) =>
                          option.id === value.id
                        }
                        slotProps={{
                          listbox: {
                            component: VirtualizedAutoComplete,
                          },
                        }}
                      />
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Button
                          disabled={!groupSubjectSelect[g.id]}
                          variant="contained"
                          onClick={() => {
                            handleAddSubjectToGroup(g.id);
                            setGroupSubjectSelect((prev) => ({
                              ...prev,
                              [g.id]: "",
                            }));
                          }}
                        >
                          Add
                        </Button>
                      </Box>
                    </Stack>
                  )}

                  <Button
                    size="small"
                    sx={{ mt: "10px" }}
                    variant="outlined"
                    onClick={() => toggleShowGroupSubjects(g.id)}
                  >
                    {showGroupSubjectsMap[g.id]
                      ? "Hide Subjects"
                      : "Show Subjects"}
                  </Button>

                  {showGroupSubjectsMap[g.id] && (
                    <>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Search subjects..."
                        value={subjectGrpSubjectSearch[g.id] || ""}
                        onChange={(e) =>
                          setSubjectGrpSubjectSearch((prev) => ({
                            ...prev,
                            [g.id]: e.target.value,
                          }))
                        }
                        sx={{ mb: 2, mt: 1 }}
                      />

                      <List
                        height={400}
                        itemCount={
                          g.subjectIds.filter((id) => {
                            const sub = subjects.find((s) => s.id === id);
                            return (
                              sub &&
                              sub.name
                                .toLowerCase()
                                .includes(
                                  (
                                    subjectGrpSubjectSearch[g.id] || ""
                                  ).toLowerCase()
                                )
                            );
                          }).length
                        }
                        itemSize={50}
                        width="100%"
                      >
                        {({ index, style }) => {
                          const sortedSubjectIds = [...g.subjectIds]
                            .map((id) => subjects.find((s) => s.id === id))
                            .filter(
                              (s) =>
                                s &&
                                s.name
                                  .toLowerCase()
                                  .includes(
                                    (
                                      subjectGrpSubjectSearch[g.id] || ""
                                    ).toLowerCase()
                                  )
                            )
                            .sort((a, b) => a.name.localeCompare(b.name));
                          const sub = sortedSubjectIds[index];
                          const cur = curriculums.find(
                            (c) => c.id === sub?.curriculumId
                          );

                          return (
                            <Box
                              key={sub.id}
                              style={style}
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                px: 2,
                                py: 1,
                              }}
                            >
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography>
                                  {sub?.name}{" "}
                                  <Chip size="small" label={cur?.name} />
                                </Typography>
                                {sub?.isCommon && (
                                  <Chip
                                    size="small"
                                    label="Common"
                                    color="warning"
                                    icon={<StarIcon />}
                                  />
                                )}
                              </Box>

                              {canEditSubjects && (
                                <IconButton
                                  onClick={() =>
                                    handleRemoveSubjectFromGroup(g.id, sub.id)
                                  }
                                >
                                  <DeleteIcon />
                                </IconButton>
                              )}
                            </Box>
                          );
                        }}
                      </List>
                    </>
                  )}
                </Card>
              ))}
          </Box>
        </Box>
      )}

      {tab === 2 && (
        <Box>
          {ungroupedSubjects.length === 0 ? (
            <Typography>All Subjects are grouped.</Typography>
          ) : (
            <List
              height={600}
              itemCount={ungroupedSubjects.length}
              itemSize={50}
              width="100%"
            >
              {({ index, style }) => {
                const subject = ungroupedSubjects[index];
                const curriculum = curriculums.find(
                  (c) => c.id === subject.curriculumId
                );

                return (
                  <Box
                    key={subject.id}
                    style={style}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      px: 2,
                      py: 1,
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography>{subject.name}</Typography>
                      {curriculum && (
                        <Chip
                          size="small"
                          label={curriculum.name}
                          sx={{ ml: 1 }}
                        />
                      )}
                      {subject.isCommon && (
                        <Chip
                          size="small"
                          label="Common"
                          color="warning"
                          icon={<StarIcon />}
                        />
                      )}
                    </Box>

                    {canEditSubjects && (
                      <Box>
                        <Tooltip
                          title={
                            subject.isCommon
                              ? "Remove common status"
                              : "Mark as common"
                          }
                        >
                          <IconButton
                            onClick={() => handleToggleCommon(subject.id)}
                            color={subject.isCommon ? "warning" : "default"}
                          >
                            {subject.isCommon ? (
                              <StarIcon />
                            ) : (
                              <StarBorderIcon />
                            )}
                          </IconButton>
                        </Tooltip>
                        <IconButton
                          onClick={() => handleOpenAddDialog(subject)}
                        >
                          <AddIcon />
                        </IconButton>
                      </Box>
                    )}
                  </Box>
                );
              }}
            </List>
          )}
        </Box>
      )}

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Are you sure?</DialogTitle>
        <DialogContent>
          This will permanently delete <strong>{deleteTarget?.name}</strong>
          {deleteType === "curriculum" && " and all its subjects."}
        </DialogContent>
        <DialogActions>
          <Button
            variant="text"
            color="error"
            onClick={() => setDeleteTarget(null)}
          >
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <AddToGroupDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        subject={selectedSubject}
        groups={groups}
        onSelectGroup={handleAddToGroup}
      />
    </Box>
  );
};

export default SubjectList;
