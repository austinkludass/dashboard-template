import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Stack,
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tooltip,
} from "@mui/material";
import { useState, useEffect } from "react";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";

const EditInvoiceDialog = ({ open, invoice, onClose, onSave }) => {
  const [form, setForm] = useState(null);
  const [editingCell, setEditingCell] = useState(null);

  useEffect(() => {
    if (invoice) {
      setForm({
        familyName: invoice.familyName,
        familyEmail: invoice.parentEmail,
        lineItems: invoice.lineItems.map((li) => ({
          ...li,
          date: li.date ? dayjs(li.date) : null,
        })),
      });
    }
  }, [invoice]);

  if (!form) return null;

  const invoiceTotal = form.lineItems.reduce(
    (sum, li) => sum + Number(li.price || 0),
    0
  );

  const invoiceSubtotal = form.lineItems.reduce(
    (sum, li) => sum + Number(li.originalPrice || li.price || 0),
    0
  );

  const totalDiscount = form.lineItems.reduce(
    (sum, li) => sum + Number(li.discountAmount || 0),
    0
  );

  const totalCredit = form.lineItems.reduce(
    (sum, li) => sum + Number(li.creditApplied || 0),
    0
  );

  const updateLineItem = (index, field, value) => {
    const updated = [...form.lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setForm((f) => ({ ...f, lineItems: updated }));
  };

  const handleSave = () => {
    onSave({
      ...invoice,
      ...form,
      total: invoiceTotal,
      subtotal: invoiceSubtotal,
      totalDiscount: totalDiscount,
      totalCredit: totalCredit,
      editedSinceGeneration: true,
      lineItems: form.lineItems.map((li) => ({
        ...li,
        date: li.date?.toISOString() ?? null,
      })),
    });
  };

  const renderCell = (rowIndex, field, value) => {
    const isEditing =
      editingCell &&
      editingCell.rowIndex === rowIndex &&
      editingCell.field === field;

    if (field === "date") {
      if (!isEditing) {
        return (
          <Typography
            sx={{ cursor: "pointer" }}
            onClick={() => setEditingCell({ rowIndex, field })}
          >
            {value ? value.format("MMM D, YYYY") : ""}
          </Typography>
        );
      }

      return (
        <DatePicker
          autoFocus
          value={value}
          onChange={(newVal) => updateLineItem(rowIndex, "date", newVal)}
          onClose={() => setEditingCell(null)}
          slotProps={{
            textField: {
              variant: "standard",
              size: "small",
              sx: { width: "120px" },
            },
          }}
        />
      );
    }

    if (field === "duration" && isEditing) {
      return (
        <TextField
          variant="standard"
          size="small"
          autoFocus
          value={value}
          onChange={(e) =>
            updateLineItem(rowIndex, "duration", Number(e.target.value))
          }
          onBlur={() => setEditingCell(null)}
          sx={{ width: 80 }}
          slotProps={{
            htmlInput: {
              type: "number",
              step: 0.5,
              min: 1,
            },
          }}
        />
      );
    }

    if (field === "price") {
      const lineItem = form.lineItems[rowIndex];
      const hasDiscount = lineItem.discountAmount > 0;
      const hasCredit = lineItem.creditApplied > 0;

      if (!isEditing) {
        return (
          <Box
            sx={{ cursor: "pointer" }}
            onClick={() => setEditingCell({ rowIndex, field })}
          >
            {(hasDiscount || hasCredit) &&
              lineItem.originalPrice &&
              lineItem.originalPrice !== value && (
                <Typography
                  variant="body2"
                  sx={{
                    textDecoration: "line-through",
                    color: "text.secondary",
                    fontSize: "0.75rem",
                  }}
                >
                  ${Number(lineItem.originalPrice).toFixed(2)}
                </Typography>
              )}
            <Typography
              color={hasDiscount || hasCredit ? "success.main" : "inherit"}
              fontWeight={hasDiscount || hasCredit ? "bold" : "normal"}
            >
              ${Number(value).toFixed(2)}
            </Typography>
          </Box>
        );
      }

      return (
        <TextField
          variant="standard"
          size="small"
          autoFocus
          value={value}
          onChange={(e) =>
            updateLineItem(rowIndex, "price", Number(e.target.value))
          }
          onBlur={() => setEditingCell(null)}
          sx={{ width: 80 }}
          slotProps={{
            htmlInput: {
              type: "number",
              step: 0.5,
              min: 0,
            },
          }}
        />
      );
    }

    if (isEditing) {
      return (
        <TextField
          autoFocus
          variant="standard"
          size="small"
          value={value}
          onChange={(e) => updateLineItem(rowIndex, field, e.target.value)}
          onBlur={() => setEditingCell(null)}
        />
      );
    }

    return (
      <Typography
        sx={{ cursor: "pointer" }}
        onClick={() => setEditingCell({ rowIndex, field })}
      >
        {value}
      </Typography>
    );
  };

  const renderDiscountChips = (lineItem) => {
    const chips = [];

    if (lineItem.discountAmount > 0) {
      chips.push(
        <Tooltip
          key="discount"
          title={lineItem.discountDescription || "Discount applied"}
          arrow
        >
          <Chip
            size="small"
            label={`-$${Number(lineItem.discountAmount).toFixed(2)}`}
            color="success"
            variant="outlined"
            sx={{ fontSize: "0.7rem", height: 20 }}
          />
        </Tooltip>
      );
    }

    if (lineItem.creditApplied > 0) {
      chips.push(
        <Tooltip
          key="credit"
          title={lineItem.creditDescription || "Credit applied"}
          arrow
        >
          <Chip
            size="small"
            label={`-$${Number(lineItem.creditApplied).toFixed(2)}`}
            color="primary"
            variant="outlined"
            sx={{ fontSize: "0.7rem", height: 20, ml: 0.5 }}
          />
        </Tooltip>
      );
    }

    return chips.length > 0 ? (
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
        {chips}
      </Box>
    ) : null;
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Edit Invoice</DialogTitle>

      <DialogContent dividers>
        <Stack direction="row" spacing={4} sx={{ mb: 3 }}>
          <Box flex={1}>
            <Typography variant="caption" color="text.secondary">
              Family Name
            </Typography>
            <Typography variant="h4">{form.familyName}</Typography>
          </Box>

          <Box flex={1}>
            <Typography variant="caption" color="text.secondary">
              Email
            </Typography>
            <Typography variant="h4">{form.familyEmail}</Typography>
          </Box>
        </Stack>

        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Stack direction="row" spacing={4} justifyContent="space-between">
            <Box>
              <Typography variant="caption" color="text.secondary">
                Subtotal
              </Typography>
              <Typography variant="h5">
                ${invoiceSubtotal.toFixed(2)}
              </Typography>
            </Box>

            {totalDiscount > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Discounts
                </Typography>
                <Typography variant="h5" color="success.main">
                  -${totalDiscount.toFixed(2)}
                </Typography>
              </Box>
            )}

            {totalCredit > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Credits Applied
                </Typography>
                <Typography variant="h5" color="primary.main">
                  -${totalCredit.toFixed(2)}
                </Typography>
              </Box>
            )}

            <Box>
              <Typography variant="caption" color="text.secondary">
                Total Due
              </Typography>
              <Typography variant="h4" color="primary">
                ${invoiceTotal.toFixed(2)}
              </Typography>
            </Box>
          </Stack>
        </Paper>

        <Paper variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Duration (hrs)</TableCell>
                <TableCell>Tutor</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell align="right">Total ($)</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {form.lineItems.map((li, idx) => (
                <TableRow key={idx} sx={{ height: "50px" }}>
                  <TableCell>
                    <Typography>{li.studentName}</Typography>
                    {renderDiscountChips(li)}
                  </TableCell>

                  <TableCell>
                    {renderCell(idx, "duration", li.duration)}
                  </TableCell>

                  <TableCell>
                    {renderCell(idx, "tutorName", li.tutorName)}
                  </TableCell>

                  <TableCell>{renderCell(idx, "date", li.date)}</TableCell>

                  <TableCell>
                    {renderCell(idx, "subject", li.subject)}
                  </TableCell>

                  <TableCell align="right">
                    {renderCell(idx, "price", li.price)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditInvoiceDialog;
