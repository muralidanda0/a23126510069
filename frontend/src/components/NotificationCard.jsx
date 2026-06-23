import React from "react";
import { Card, CardContent, Typography, Chip, Box } from "@mui/material";

const TYPE_COLORS = {
  Placement: "success",
  Result: "warning",
  Event: "info",
};

const NotificationCard = ({ notification, isRead, onClick }) => {
  return (
    <Card
      onClick={onClick}
      sx={{
        mb: 1.5,
        cursor: "pointer",
        backgroundColor: isRead ? "#f9f9f9" : "#ffffff",
        borderLeft: isRead ? "4px solid #ccc" : "4px solid #1976d2",
        "&:hover": { boxShadow: 3 },
      }}
    >
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Chip
            label={notification.Type}
            color={TYPE_COLORS[notification.Type] || "default"}
            size="small"
          />
          {isRead && (
            <Chip label="Read" size="small" variant="outlined" />
          )}
        </Box>
        <Typography variant="body1">{notification.Message}</Typography>
        <Typography variant="caption" color="text.secondary">
          {new Date(notification.Timestamp).toLocaleString()}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default NotificationCard;