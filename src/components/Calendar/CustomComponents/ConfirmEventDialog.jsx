import { Dialog, DialogTitle, DialogActions, Button } from "@mui/material";

const ConfirmEventDialog = ({
  open,
  onClose,
  onConfirmOnly,
  onConfirmFuture,
  title,
  onlyLabel,
  futureLabel,
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogActions>
        <Button
          variant="contained"
          onClick={() => {
            onConfirmOnly?.();
            onClose?.();
          }}
        >
          {onlyLabel}
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            onConfirmFuture?.();
            onClose?.();
          }}
        >
          {futureLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmEventDialog;
