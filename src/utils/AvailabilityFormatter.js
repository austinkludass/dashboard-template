const AvailabilityFormatter = (availabilityObj) => {
  return Object.fromEntries(
    Object.entries(availabilityObj).map(([day, slots]) => [
      day,
      slots.map((slot) => ({
        start: new Date(slot.start).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        end: new Date(slot.end).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      })),
    ])
  );
};

export default AvailabilityFormatter;