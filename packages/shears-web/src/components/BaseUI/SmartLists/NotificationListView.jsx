// NotificationsView.jsx
import React, { useState, useMemo, useContext } from "react";
import {
  Box,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemText,
  Typography,
  InputAdornment,
  Button,
  IconButton,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Backdrop,
} from "@mui/material";
import {
  Search as SearchIcon,
  Delete as DeleteIcon,
  Circle as CircleIcon,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { DateTime } from "luxon";

import ListItemDetail from "../ListItemDetail";
import { deleteRecord, updateRecord } from "shears-shared/src/Services/Authentication";
import { AuthContext } from "../../../context/AuthContext";

/* ============================================================
   Styled Components
============================================================ */
const NotificationsContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
  flex: 1,
  display: "flex",
  flexDirection: "column",
  height: "100%",
}));

const SearchContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2),
  alignItems: "center",
}));

const SearchField = styled(TextField)(({ theme }) => ({
  flex: 1,
}));

const NotificationListItem = styled(ListItem)(({ theme, isDeleting }) => ({
  cursor: isDeleting ? "default" : "pointer",
  opacity: isDeleting ? 0.6 : 1,
  transition: "background-color 0.2s",
  position: "relative",
  "&:hover": {
    backgroundColor: isDeleting ? "transparent" : theme.palette.action.hover,
  },
}));

const UnreadDot = styled(CircleIcon)(({ theme }) => ({
  width: 8,
  height: 8,
  marginRight: theme.spacing(1.5),
  color: theme.palette.primary.main,
}));

const LoadingOverlay = styled(Backdrop)(({ theme }) => ({
  zIndex: theme.zIndex.modal + 1,
  position: "absolute",
}));

const LoadingBox = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(2),
}));

/* ============================================================
   Date Resolver (returns Luxon DateTime)
============================================================ */
function resolveDateObject(item) {
  const raw = item.date || item.createdAt || item.updatedAt;

  if (!raw) return null;

  // Luxon: treat YYYY-MM-DD as local date (no UTC shift)
  if (typeof raw === "string") {
    // Case 1: "2025-01-17" → local midnight
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      return DateTime.fromFormat(raw, "yyyy-MM-dd", { zone: "local" });
    }

    // Case 2: Full ISO (may be UTC) → force to local date only
    try {
      const dt = DateTime.fromISO(raw, { zone: "utc" }).toLocal();
      return dt;
    } catch {}
  }

  // Fallback: native Date → convert to Luxon local
  const native = new Date(raw);
  if (!isNaN(native.getTime())) {
    return DateTime.fromJSDate(native);
  }

  return null;
}

/* ============================================================
   Format Relative Time
============================================================ */
function formatRelativeTime(date) {
  if (!date) return "";

  const now = DateTime.now();
  const diff = now.diff(date, ["days", "hours", "minutes"]);

  if (diff.days >= 1) {
    return date.toLocaleString(DateTime.DATE_MED); // "Jan 17, 2026"
  } else if (diff.hours >= 1) {
    const hours = Math.floor(diff.hours);
    return `${hours}h ago`;
  } else if (diff.minutes >= 1) {
    const minutes = Math.floor(diff.minutes);
    return `${minutes}m ago`;
  } else {
    return "Just now";
  }
}

/* ============================================================
   MAIN COMPONENT
============================================================ */
export default function NotificationListView({
  data = [],
  onRefresh,
  refreshing = false,
  name = "Notifications",
  appConfig,
  recordType = "notifications",
  fields = [],
  modes = [],
  actionsMenu = [],
}) {
  const [localData, setLocalData] = useState(data);
  const [isClearing, setIsClearing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const { token } = useContext(AuthContext);

// React Web - NotificationsView.jsx
const handleItemClick = async (item) => {
  if (deletingId === item._id) return;

  console.log("Notification clicked:", item);

  // Extract fieldsData: everything except _id and recordType
  const { _id, recordType, ...fieldsOnly } = item;

  // Only proceed if unread
  if (fieldsOnly.read !== true) {
    // Optimistic UI update
    setLocalData((prev) =>
      prev.map((notification) =>
        notification._id === item._id
          ? { ...notification, fieldsData: { ...fieldsOnly, read: true } }
          : notification
      )
    );

    try {
      // Send only fieldsData to backend
      await updateRecord(item._id, { ...fieldsOnly, read: true }, token);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);

      // Rollback optimistic update on failure
      setLocalData((prev) =>
        prev.map((notification) =>
          notification._id === item._id
            ? { ...notification, fieldsData: { ...fieldsOnly, read: false } }
            : notification
        )
      );
    }
  }

  setSelectedItem(item);
  setDrawerOpen(true);
};


  

  // Sync localData with incoming data prop
  React.useEffect(() => {
    setLocalData(data);
  }, [data]);

  // Normalize data
  const normalizedData = useMemo(
    () =>
      localData.map((item) => {
        const normalized = item.fieldsData
          ? { ...item.fieldsData, _id: item._id, recordType: item.recordType }
          : item;

        // Preserve the date field from fieldsData
        if (item.fieldsData?.date) {
          normalized.date = item.fieldsData.date;
        }
        if (item.fieldsData?.createdAt) {
          normalized.createdAt = item.fieldsData.createdAt;
        }

        return normalized;
      }),
    [localData]
  );

  // Filter by search
  const filteredData = useMemo(() => {
    if (!search) return normalizedData;

    const q = search.toLowerCase();
    return normalizedData.filter((item) => {
      const title = item.notificationName || item.title || "";
      const message = item.message || "";
      return (
        title.toLowerCase().includes(q) || message.toLowerCase().includes(q)
      );
    });
  }, [normalizedData, search]);

  // Sort by date (newest first)
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const dtA = resolveDateObject(a);
      const dtB = resolveDateObject(b);

      if (!dtA && !dtB) return 0;
      if (!dtA) return 1;
      if (!dtB) return -1;

      return dtB - dtA; // Newest first
    });
  }, [filteredData]);

  /* ------------------------------------------------------------------------ */
  /* Delete Handler                                                           */
  /* ------------------------------------------------------------------------ */
  const handleDeleteClick = (item, event) => {
    event.stopPropagation();
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    setDeleteDialogOpen(false);
    setDeletingId(itemToDelete._id);

    try {
      // Import deleteRecord from your authentication service
      await deleteRecord(itemToDelete._id, token);

      // Trigger refresh to reload data from server
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
      alert("Failed to delete notification. Please try again.");
    } finally {
      setDeletingId(null);
      setItemToDelete(null);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Clear All Handler                                                        */
  /* ------------------------------------------------------------------------ */
  const handleClearAllClick = () => {
    if (sortedData.length === 0) return;
    setClearAllDialogOpen(true);
  };

  const handleClearAllConfirm = async () => {
    setClearAllDialogOpen(false);
    setIsClearing(true);

    try {
      
      // Delete all notifications concurrently
      const deletePromises = sortedData.map((item) =>
        deleteRecord(item._id, token)
      );

      await Promise.all(deletePromises);

      // Trigger refresh to reload data from server
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Failed to clear notifications:", error);
      alert("Some notifications could not be deleted. Please try again.");
    } finally {
      setIsClearing(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Item Click Handler                                                       */
  /* ------------------------------------------------------------------------ */
 

  return (
    <NotificationsContainer>
      {/* Search Bar with Clear All Button */}
      <SearchContainer>
        <SearchField
          size="small"
          placeholder="Search notifications..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        {sortedData.length > 0 && (
          <Button
            variant="text"
            color="error"
            onClick={handleClearAllClick}
            disabled={isClearing}
          >
            Clear All
          </Button>
        )}
      </SearchContainer>

      {/* Notifications List */}
      <Box sx={{ flex: 1, overflowY: "auto" }}>
        {sortedData.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 200,
            }}
          >
            <Typography variant="body1" color="text.secondary">
              No notifications yet
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {sortedData.map((item, index) => {
              const title = item.notificationName || item.title || "Notification";
              const message = item.message || "";
              const date = resolveDateObject(item);
              const timeLabel = formatRelativeTime(date);
              const isUnread = item.read === false || item.isRead === false;
              const isDeleting = deletingId === item._id;

              return (
                <React.Fragment key={item._id || index}>
                  <NotificationListItem
  isDeleting={isDeleting}
  onClick={() => handleItemClick(item)}
  secondaryAction={
    <IconButton
      edge="end"
      aria-label="delete"
      onClick={(e) => handleDeleteClick(item, e)}
      disabled={isDeleting}
    >
      {isDeleting ? <CircularProgress size={20} /> : <DeleteIcon />}
    </IconButton>
  }
>
  {/* Change alignItems from "flex-start" to "center" */}
  <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
    {isUnread && <UnreadDot />}

    <ListItemText
      primary={
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 0.5,
          }}
        >
          <Typography
            variant="body1"
            sx={{
              fontWeight: isUnread ? 700 : 600,
              flex: 1,
              mr: 1,
            }}
          >
            {title}
          </Typography>
          {timeLabel && (
            <Typography variant="caption" color="text.secondary">
              {timeLabel}
            </Typography>
          )}
        </Box>
      }
      secondary={
        message && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {message}
          </Typography>
        )
      }
    />

    {isDeleting && <CircularProgress size={20} sx={{ ml: 2, mt: 1 }} />}
  </Box>
</NotificationListItem>

                  {index < sortedData.length - 1 && (
                    <Divider variant="inset" component="li" />
                  )}
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Notification</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this notification?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clear All Confirmation Dialog */}
      <Dialog
        open={clearAllDialogOpen}
        onClose={() => setClearAllDialogOpen(false)}
      >
        <DialogTitle>Clear All Notifications</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete all {sortedData.length} notification
            {sortedData.length === 1 ? "" : "s"}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearAllDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleClearAllConfirm} color="error" autoFocus>
            Clear All
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading Overlay for Clear All */}
      {isClearing && (
        <LoadingOverlay open={isClearing}>
          <LoadingBox>
            <CircularProgress size={48} />
            <Typography variant="h6">
              Clearing all notifications...
            </Typography>
          </LoadingBox>
        </LoadingOverlay>
      )}

      {/* Detail Drawer */}
      {drawerOpen && (
        <ListItemDetail
          open={drawerOpen}
          recordType={recordType}
          onClose={() => {
            setDrawerOpen(false);
            if (onRefresh) {
              onRefresh();
            }
          }}
          item={selectedItem}
          appConfig={appConfig}
          fields={fields}
          mode="read"
          name={name}
          modes={modes}
          actionsMenu={actionsMenu}
        />
      )}
    </NotificationsContainer>
  );
}