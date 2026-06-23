import axios from "axios";
import Log from "../utils/logger";

const ACCESS_TOKEN = import.meta.env.VITE_ACCESS_TOKEN;

export const fetchNotifications = async (params = {}) => {
  await Log("frontend", "info", "api", "Fetching notifications");
  try {
    const response = await axios.get("/api/notifications", {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      params,
    });
    await Log("frontend", "info", "api", `Fetched ${response.data.notifications.length} notifications`);
    return response.data.notifications;
  } catch (err) {
    await Log("frontend", "error", "api", `Fetch failed: ${err.message}`);
    throw err;
  }
};