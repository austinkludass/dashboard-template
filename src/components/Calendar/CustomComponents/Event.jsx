import React, { useState, useRef } from "react";
import { Box, Menu, MenuItem, Typography } from "@mui/material";
import StudentRow from "./StudentRow";
import ConfirmDialog from "../../Global/ConfirmDialog";

const EventCard = React.memo(
  ({ event, onView, onEdit, onReport, onDelete, onCancel }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [reportAnchor, setReportAnchor] = useState(null);
    const [cancelAnchor, setCancelAnchor] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const cardRef = useRef(null);

    const menuOpen = Boolean(anchorEl);
    const reportMenuOpen = Boolean(reportAnchor);
    const cancelMenuOpen = Boolean(cancelAnchor);

    const handleMouseDown = (e) => {
      if (e.button === 2) {
        e.stopPropagation();
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setAnchorEl(e.currentTarget);
    };

    const handleClick = (e) => {
      if (menuOpen) {
        e.stopPropagation();
        return;
      }
    };

    const handleCloseMenu = () => {
      setAnchorEl(null);
      setReportAnchor(null);
      setCancelAnchor(null);
    };

    const handleDeleteClick = () => {
      setConfirmOpen(true);
      handleCloseMenu();
    };

    const handleConfirmDelete = () => {
      setConfirmOpen(false);
      onDelete?.(event);
    };

    const handleCancelConfirm = () => {
      setConfirmOpen(false);
    };

    return (
      <>
        <Box
          ref={cardRef}
          onMouseDown={handleMouseDown}
          onContextMenu={handleContextMenu}
          onClick={handleClick}
          role="button"
          tabIndex={0}
          height="100%"
          sx={{
            background:
              event.type !== "Cancelled"
                ? event.tutorColor
                : "repeating-linear-gradient(45deg, #424242, #424242 15px, #990000 20px)",
          }}
        >
          <Typography variant="subtitle2" noWrap>
            {event.subjectGroupName}
          </Typography>
          <Typography variant="caption" noWrap sx={{ opacity: 0.8 }}>
            {event.tutorName}
          </Typography>
          {event.reports?.map((report) => (
            <StudentRow key={report.studentId} report={report} />
          ))}

          <Menu
            anchorEl={anchorEl}
            open={menuOpen}
            onClose={handleCloseMenu}
            onClick={(e) => e.stopPropagation()}
          >
            <MenuItem
              onClick={() => {
                onView?.(event);
                handleCloseMenu();
              }}
            >
              View
            </MenuItem>
            <MenuItem
              onClick={() => {
                onEdit?.(event);
                handleCloseMenu();
              }}
            >
              Edit
            </MenuItem>
            <MenuItem onClick={handleDeleteClick}>Delete</MenuItem>

            <MenuItem onClick={(e) => setReportAnchor(e.currentTarget)}>
              Report
            </MenuItem>
            <Menu
              anchorEl={reportAnchor}
              open={reportMenuOpen}
              onClose={() => setReportAnchor(null)}
              anchorOrigin={{ vertical: "top", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "left" }}
            >
              {event.reports?.map((report) => (
                <MenuItem
                  key={report.studentId}
                  onClick={() => {
                    onReport?.(event, report);
                    handleCloseMenu();
                  }}
                >
                  {report.studentName}
                </MenuItem>
              ))}
            </Menu>

            <MenuItem onClick={(e) => setCancelAnchor(e.currentTarget)}>
              Cancel
            </MenuItem>
            <Menu
              anchorEl={cancelAnchor}
              open={cancelMenuOpen}
              onClose={() => setCancelAnchor(null)}
              anchorOrigin={{ vertical: "top", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "left" }}
            >
              {event.reports?.map((report) => (
                <MenuItem
                  key={report.studentId}
                  onClick={() => {
                    onCancel?.(event, report);
                    handleCloseMenu();
                  }}
                >
                  {report.studentName}
                </MenuItem>
              ))}
            </Menu>
          </Menu>
        </Box>

        <Box onClick={(e) => e.stopPropagation()}>
          <ConfirmDialog
            open={confirmOpen}
            title="Confirm Deletion"
            description="Are you sure you want to delete this lesson? This action cannot be undone."
            confirmText="Delete"
            cancelText="Cancel"
            confirmColor="error"
            onConfirm={handleConfirmDelete}
            onCancel={handleCancelConfirm}
          />
        </Box>
      </>
    );
  }
);

export default EventCard;
