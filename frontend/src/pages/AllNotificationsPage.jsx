import React, { useEffect, useState } from "react";
import {
  Container, Typography, Box, Select, MenuItem,
  FormControl, InputLabel, CircularProgress, Alert, Button, Chip
} from "@mui/material";
import NotificationCard from "../components/NotificationCard";
import { fetchNotifications } from "../api/notificationApi";
import Log from "../utils/logger";

const AllNotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [readIds, setReadIds] = useState(() => {
    const saved = localStorage.getItem("readIds");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const load = async () => {
      await Log("frontend", "info", "page", "AllNotificationsPage loaded");
      try {
        const data = await fetchNotifications();
        setNotifications(data);
      } catch (err) {
        setError("Failed to load notifications");
        await Log("frontend", "error", "page", `Failed to load: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleClick = async (id) => {
    if (!readIds.includes(id)) {
      const updated = [...readIds, id];
      setReadIds(updated);
      localStorage.setItem("readIds", JSON.stringify(updated));
      await Log("frontend", "info", "page", `Notification ${id} marked as read`);
    }
  };

  const handleMarkAll = async () => {
    const allIds = notifications.map((n) => n.ID);
    setReadIds(allIds);
    localStorage.setItem("readIds", JSON.stringify(allIds));
    await Log("frontend", "info", "page", "All notifications marked as read");
  };

  const filtered = filter === "All"
    ? notifications
    : notifications.filter((n) => n.Type === filter);

  const unreadCount = notifications.filter(
    (n) => !readIds.includes(n.ID)
  ).length;

  if (loading) return <Container sx={{ py: 4, textAlign: "center" }}><CircularProgress /></Container>;
  if (error) return <Container sx={{ py: 4 }}><Alert severity="error">{error}</Alert></Container>;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          All Notifications
          {unreadCount > 0 && (
            <Chip label={`${unreadCount} unread`} color="primary" size="small" sx={{ ml: 1 }} />
          )}
        </Typography>
        <Button variant="outlined" size="small" onClick={handleMarkAll}>
          Mark all as read
        </Button>
      </Box>

      <FormControl sx={{ mb: 3, minWidth: 200 }}>
        <InputLabel>Filter by Type</InputLabel>
        <Select
          value={filter}
          label="Filter by Type"
          onChange={(e) => setFilter(e.target.value)}
        >
          <MenuItem value="All">All</MenuItem>
          <MenuItem value="Placement">Placement</MenuItem>
          <MenuItem value="Result">Result</MenuItem>
          <MenuItem value="Event">Event</MenuItem>
        </Select>
      </FormControl>

      {filtered.map((notif) => (
        <NotificationCard
          key={notif.ID}
          notification={notif}
          isRead={readIds.includes(notif.ID)}
          onClick={() => handleClick(notif.ID)}
        />
      ))}
    </Container>
  );
};

export default AllNotificationsPage;