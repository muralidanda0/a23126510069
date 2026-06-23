import React from "react";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import Log from "../utils/logger";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNav = async (path) => {
    await Log("frontend", "info", "component", `Navigating to ${path}`);
    navigate(path);
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Campus Notifications
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            color="inherit"
            variant={location.pathname === "/" ? "outlined" : "text"}
            onClick={() => handleNav("/")}
          >
            All Notifications
          </Button>
          <Button
            color="inherit"
            variant={location.pathname === "/priority" ? "outlined" : "text"}
            onClick={() => handleNav("/priority")}
          >
            Priority Inbox
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;