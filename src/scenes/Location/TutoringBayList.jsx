import {
  Box,
  Grid2 as Grid,
  Typography,
  Button,
  Paper,
  TextField,
  IconButton,
  Divider,
  Chip,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
} from "@mui/material";
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationOnIcon,
  Lock as LockIcon,
} from "@mui/icons-material";
import { tokens } from "../../theme";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { GoogleMap } from "../../components/Global/GoogleMap";
import Header from "../../components/Global/Header";
import usePermissions from "../../hooks/usePermissions";
import { db } from "../../data/firebase";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  getDoc,
  getDocs,
} from "firebase/firestore";

const locationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
});

const tutorBaySchema = z.object({
  name: z.string().min(1, "Bay name is required"),
});

const TutoringBayList = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { canEditLocations } = usePermissions();

  const [locations, setLocations] = useState([]);
  const [editingLocation, setEditingLocation] = useState(null);
  const [showAddLocationForm, setShowAddLocationForm] = useState(false);
  const [editingBay, setEditingBay] = useState({ locationId: "", bay: null });
  const [showAddBayForm, setShowAddBayForm] = useState(null);
  const [locationToDelete, setLocationToDelete] = useState(null);

  useEffect(() => {
    const fetchLocations = async () => {
      const snapshot = await getDocs(collection(db, "locations"));
      const fetched = snapshot.docs.map((doc) => doc.data());
      setLocations(fetched);
    };

    fetchLocations();
  }, []);

  const locationForm = useForm({
    resolver: zodResolver(locationSchema),
    defaultValues: { name: "", address: "" },
  });

  const bayForm = useForm({
    resolver: zodResolver(tutorBaySchema),
    defaultValues: { name: "" },
  });

  const addLocation = async (data) => {
    if (!canEditLocations) return;

    const id = crypto.randomUUID();
    const newLocation = {
      id,
      name: data.name,
      address: data.address,
      tutorBays: [],
    };

    await setDoc(doc(db, "locations", id), newLocation);

    setLocations((prev) => [...prev, newLocation]);
    locationForm.reset();
    setShowAddLocationForm(false);
  };

  const updateLocation = async (data) => {
    if (!editingLocation || !canEditLocations) return;

    const updated = {
      ...editingLocation,
      name: data.name,
      address: data.address,
    };

    await setDoc(doc(db, "locations", editingLocation.id), updated);

    setLocations((prev) =>
      prev.map((loc) => (loc.id === editingLocation.id ? updated : loc))
    );

    setEditingLocation(null);
    locationForm.reset();
  };

  const deleteLocation = async (locationId) => {
    if (!canEditLocations) return;

    setLocations((prev) => prev.filter((loc) => loc.id !== locationId));
    await deleteDoc(doc(db, "locations", locationId));
  };

  const startEditingLocation = (location) => {
    if (!canEditLocations) return;

    setEditingLocation(location);
    locationForm.setValue("name", location.name);
    locationForm.setValue("address", location.address);
  };

  const cancelEditingLocation = () => {
    setEditingLocation(null);
    locationForm.reset();
  };

  const addTutorBay = async (locationId, data) => {
    if (!canEditLocations) return;

    const newBay = { id: crypto.randomUUID(), name: data.name };
    setLocations((prev) =>
      prev.map((loc) =>
        loc.id === locationId
          ? { ...loc, tutorBays: [...loc.tutorBays, newBay] }
          : loc
      )
    );

    const locationDoc = doc(db, "locations", locationId);
    const locationSnap = await getDoc(locationDoc);
    if (locationSnap.exists()) {
      const updatedTutorBays = [...locationSnap.data().tutorBays, newBay];
      await updateDoc(locationDoc, { tutorBays: updatedTutorBays });
    }

    setShowAddBayForm(null);
    bayForm.reset();
  };

  const updateTutorBay = async (locationId, data) => {
    if (!canEditLocations) return;

    setLocations((prev) =>
      prev.map((loc) =>
        loc.id === locationId
          ? {
              ...loc,
              tutorBays: loc.tutorBays.map((bay) =>
                bay.id === editingBay.bay.id ? { ...bay, name: data.name } : bay
              ),
            }
          : loc
      )
    );

    const locationDoc = doc(db, "locations", locationId);
    const locationSnap = await getDoc(locationDoc);
    if (locationSnap.exists()) {
      const updatedTutorBays = locationSnap
        .data()
        .tutorBays.map((bay) =>
          bay.id === editingBay.bay.id ? { ...bay, name: data.name } : bay
        );
      await updateDoc(locationDoc, { tutorBays: updatedTutorBays });
    }

    setEditingBay({ locationId: "", bay: null });
    bayForm.reset();
  };

  const deleteTutorBay = async (locationId, bayId) => {
    if (!canEditLocations) return;

    setLocations((prev) =>
      prev.map((loc) =>
        loc.id === locationId
          ? {
              ...loc,
              tutorBays: loc.tutorBays.filter((bay) => bay.id !== bayId),
            }
          : loc
      )
    );

    const locationDoc = doc(db, "locations", locationId);
    const locationSnap = await getDoc(locationDoc);
    if (locationSnap.exists()) {
      const updatedTutorBays = locationSnap
        .data()
        .tutorBays.filter((bay) => bay.id !== bayId);
      await updateDoc(locationDoc, { tutorBays: updatedTutorBays });
    }
  };

  const startEditingBay = (locationId, bay) => {
    if (!canEditLocations) return;

    setEditingBay({ locationId, bay });
    bayForm.setValue("name", bay.name);
  };

  const cancelEditingBay = () => {
    setEditingBay({ locationId: "", bay: null });
    bayForm.reset();
  };

  return (
    <Box p={4}>
      <Box
        sx={{
          mx: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Header
            title="LOCATIONS & TUTOR BAYS"
            subtitle="Manage locations and tutor bays"
          />
          {canEditLocations && (
            <Button
              variant="contained"
              onClick={() => setShowAddLocationForm(true)}
            >
              Add Location
            </Button>
          )}
        </Box>

        {!canEditLocations && (
          <Alert severity="info" icon={<LockIcon />}>
            Only Admins can edit locations and tutor bays. Contact an Admin if
            you need to make changes.
          </Alert>
        )}

        {showAddLocationForm && canEditLocations && (
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Add New Location
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Enter details for the new location
            </Typography>
            <form onSubmit={locationForm.handleSubmit(addLocation)}>
              <Grid container spacing={2} sx={{ paddingTop: "10px" }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Location Name"
                    {...locationForm.register("name")}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Address"
                    {...locationForm.register("address")}
                  />
                </Grid>
              </Grid>
              <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
                <Button type="submit" variant="contained">
                  Add
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    setShowAddLocationForm(false);
                    locationForm.reset();
                  }}
                >
                  Cancel
                </Button>
              </Box>
            </form>
          </Paper>
        )}

        {locations.map((location) => (
          <Paper key={location.id} elevation={2} sx={{ p: 3 }}>
            {editingLocation?.id === location.id ? (
              <form onSubmit={locationForm.handleSubmit(updateLocation)}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Location Name"
                      {...locationForm.register("name")}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Address"
                      {...locationForm.register("address")}
                    />
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
                  <Button type="submit" variant="contained" size="small">
                    Update
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={cancelEditingLocation}
                    size="small"
                  >
                    Cancel
                  </Button>
                </Box>
              </form>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <LocationOnIcon fontSize="medium" />
                    <Typography variant="h4">{location.name}</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {location.address}
                  </Typography>
                </Box>
                {canEditLocations && (
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <IconButton onClick={() => startEditingLocation(location)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => setLocationToDelete(location)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                )}
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography variant="h5">Tutor Bays</Typography>
                  {canEditLocations && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setShowAddBayForm(location.id)}
                    >
                      Add Bay
                    </Button>
                  )}
                </Box>

                {showAddBayForm === location.id && canEditLocations && (
                  <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <form
                      onSubmit={bayForm.handleSubmit((data) =>
                        addTutorBay(location.id, data)
                      )}
                    >
                      <TextField
                        fullWidth
                        label="Bay Name"
                        sx={{ mb: 2 }}
                        {...bayForm.register("name")}
                      />
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button type="submit" variant="contained" size="small">
                          Add
                        </Button>
                        <Button
                          type="button"
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => {
                            setShowAddBayForm(null);
                            bayForm.reset();
                          }}
                        >
                          Cancel
                        </Button>
                      </Box>
                    </form>
                  </Paper>
                )}

                {location.tutorBays.length === 0 ? (
                  <Typography color="text.secondary" variant="body2">
                    No tutor bays yet
                  </Typography>
                ) : (
                  location.tutorBays.map((bay) =>
                    editingBay.bay?.id === bay.id &&
                    editingBay.locationId === location.id ? (
                      <Paper
                        key={bay.id}
                        variant="outlined"
                        sx={{ p: 1, mb: 1 }}
                      >
                        <form
                          onSubmit={bayForm.handleSubmit((data) =>
                            updateTutorBay(location.id, data)
                          )}
                        >
                          <TextField
                            fullWidth
                            label="Bay Name"
                            sx={{ mb: 1 }}
                            {...bayForm.register("name")}
                          />
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <Button
                              type="submit"
                              size="small"
                              variant="contained"
                            >
                              <CheckIcon fontSize="small" />
                            </Button>
                            <Button
                              onClick={cancelEditingBay}
                              size="small"
                              color="error"
                              variant="outlined"
                            >
                              <CloseIcon fontSize="small" />
                            </Button>
                          </Box>
                        </form>
                      </Paper>
                    ) : (
                      <Paper
                        key={bay.id}
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          mb: 1,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography>{bay.name}</Typography>
                        {canEditLocations && (
                          <Box>
                            <IconButton
                              size="small"
                              onClick={() => startEditingBay(location.id, bay)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() =>
                                deleteTutorBay(location.id, bay.id)
                              }
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                      </Paper>
                    )
                  )
                )}
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ height: "256px" }}>
                  <GoogleMap
                    address={location.address}
                    color={colors.orangeAccent[700]}
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>
        ))}

        {locations.length === 0 && (
          <Paper elevation={2} sx={{ textAlign: "center", py: 6 }}>
            <LocationOnIcon
              sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
            />
            <Typography variant="h6" gutterBottom>
              No locations added yet
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {canEditLocations
                ? "Start by adding your first location"
                : "No locations have been configured yet"}
            </Typography>
            {canEditLocations && (
              <Button
                variant="contained"
                onClick={() => setShowAddLocationForm(true)}
              >
                Add Your First Location
              </Button>
            )}
          </Paper>
        )}
      </Box>

      <Dialog
        open={Boolean(locationToDelete)}
        onClose={() => setLocationToDelete(null)}
      >
        <DialogTitle>Are you sure?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will delete the location{" "}
            <strong>{locationToDelete?.name}</strong>. This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            variant="text"
            color="error"
            onClick={() => setLocationToDelete(null)}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              deleteLocation(locationToDelete.id);
              setLocationToDelete(null);
            }}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TutoringBayList;
