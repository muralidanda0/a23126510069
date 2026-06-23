import axios from "axios";

const Log = async (stack, level, pkg, message) => {
  try {
    await axios.post(
      `${import.meta.env.VITE_API_URL}/logs`,
      { stack, level, package: pkg, message },
      {
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (_) {}
};

export default Log;