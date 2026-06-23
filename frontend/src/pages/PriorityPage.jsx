import React, { useEffect, useState } from "react";
import {
  Container, Typography, Box, TextField,
  CircularProgress, Alert
} from "@mui/material";
import NotificationCard from "../components/NotificationCard";
import { fetchNotifications } from "../api/notificationApi";
import { getTopN } from "../utils/priority";
import Log from "../utils/logger";

const PriorityPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [topN, setTopN] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [readIds, setReadIds] = useState(() => {
    const saved = localStorage.getItem("readIds");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const load = async () => {
      await Log("frontend", "info", "page", "PriorityPage loaded");
      try {
        const data = await fetchNotifications();
        setNotifications(data);
      } catch (err) {
        setError("Failed to load notifications");
        await Log("frontend", "error", "page", `Failed: ${err.message}`);
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

  const priorityList = getTopN(notifications, topN);

  if (loading) {
    return (
      <Container sx={{ py: 4, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Priority Inbox
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Showing top notifications ranked by type importance and recency.
        Placement notifications rank highest, followed by Result and Event.
      </Typography>

      <Box sx={{ mb: 3 }}>
        <TextField
          label="Show top N notifications"
          type="number"
          value={topN}
          onChange={(e) => setTopN(Number(e.target.value))}
          inputProps={{ min: 1, max: 50 }}
          size="small"
        />
      </Box>

      {priorityList.map((notif, index) => (
        <Box key={notif.ID}>
          <Typography variant="caption" color="text.secondary">
            #{index + 1} — Score: {notif.score.toFixed(3)}
          </Typography>
          <NotificationCard
            notification={notif}
            isRead={readIds.includes(notif.ID)}
            onClick={() => handleClick(notif.ID)}
          />
        </Box>
      ))}
    </Container>
  );
};

export default PriorityPage;