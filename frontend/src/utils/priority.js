const TYPE_WEIGHT = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

function getScore(notification) {
  const weight = TYPE_WEIGHT[notification.Type] || 1;
  const hoursAgo =
    (Date.now() - new Date(notification.Timestamp).getTime()) /
    (1000 * 60 * 60);
  return weight + 1 / (hoursAgo + 1);
}

export function getTopN(notifications, n) {
  return [...notifications]
    .map((n) => ({ ...n, score: getScore(n) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}