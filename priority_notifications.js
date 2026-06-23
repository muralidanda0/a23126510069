const axios = require("axios");

const ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJkYW5kYW11cmFsaWtyaXNobmEuMjMuY3NlQGFuaXRzLmVkdS5pbiIsImV4cCI6MTc4MjE5OTE0NiwiaWF0IjoxNzgyMTk4MjQ2LCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiMTFjZmNiNjEtNmViYS00YTc4LWEyNzAtOWVjMzYwMzhkMzlkIiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoiZGFuZGEgbXVyYWxpIGtyaXNobmEiLCJzdWIiOiJlZGIxNTJhNS1jZDA4LTRlYjQtYmVmMi0xNjZmMDhhNTFkYjQifSwiZW1haWwiOiJkYW5kYW11cmFsaWtyaXNobmEuMjMuY3NlQGFuaXRzLmVkdS5pbiIsIm5hbWUiOiJkYW5kYSBtdXJhbGkga3Jpc2huYSIsInJvbGxObyI6ImEyMzEyNjUxMDA2OSIsImFjY2Vzc0NvZGUiOiJNVHF4YXIiLCJjbGllbnRJRCI6ImVkYjE1MmE1LWNkMDgtNGViNC1iZWYyLTE2NmYwOGE1MWRiNCIsImNsaWVudFNlY3JldCI6InFHRGFCc2dZWm1oWVRVQ3cifQ.dbIfab8dHMU6T2--CLKwDFbGxMN-lk4ehhVkvuObi7Y";

const { Log } = require("./logging-middleware/logger");

const TYPE_WEIGHT = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

function getScore(notification) {
  const weight = TYPE_WEIGHT[notification.Type] || 1;
  const createdAt = new Date(notification.Timestamp).getTime();
  const now = Date.now();
  const hoursAgo = (now - createdAt) / (1000 * 60 * 60);
  const recency = 1 / (hoursAgo + 1);
  return weight + recency;
}

function getTopN(notifications, n) {
  const scored = notifications.map((notif) => ({
    ...notif,
    score: getScore(notif),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, n);
}

async function fetchNotifications() {
  await Log(
    "backend",
    "info",
    "service",
    "Fetching notifications from evaluation server"
  );

  const response = await axios.get(
    "http://4.224.186.213/evaluation-service/notifications",
    {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
    }
  );

  await Log(
    "backend",
    "info",
    "service",
    `Fetched ${response.data.notifications.length} notifications`
  );

  return response.data.notifications;
}

async function main() {
  await Log(
    "backend",
    "info",
    "handler",
    "Priority notification system started"
  );

  const notifications = await fetchNotifications();

  const top10 = getTopN(notifications, 10);

  await Log(
    "backend",
    "info",
    "handler",
    "Top 10 priority notifications calculated"
  );

  console.log("\nTOP 10 PRIORITY NOTIFICATIONS:\n");

  top10.forEach((notif, index) => {
    console.log(`${index + 1}. [${notif.Type}] ${notif.Message}`);
    console.log(`   Timestamp : ${notif.Timestamp}`);
    console.log(`   Score     : ${notif.score.toFixed(4)}`);
    console.log("");
  });

  await Log(
    "backend",
    "info",
    "handler",
    "Priority notifications displayed "
  );
}

main().catch(async (err) => {
  await Log(
    "backend",
    "fatal",
    "handler",
    `Error in priority notification system: ${err.message}`
  );
  console.error("Error:", err.message);
});