

REST API Design — Notification Platform for campus

Core actions it should support:
- Fetch all notifications for a loggedin student
- Mark a notification as read
- Mark all notifications as read
- Fetch unread notification count
- Filter notifications by type 
(Placement, Event, Result)
- Real-time delivery of new notifications



REST API Endpoints

1. Get All Notifications
GET `/api/notifications`

Headers:
Authorization: Bearer <access_token>

Query Parameters:
| Parameter | Type | Required | Description |
|---|---|---|---|
| page | integer | No | Page number (default: 1) |
| limit | integer | No | Items per page (default: 20) |
| notification_type | string | No | Event, Result, Placement |

Response (200):
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "d146095a-0d86-4a34-9e69-3900a14576bc",
        "type": "Placement",
        "message": "CSX Corporation hiring",
        "timestamp": "2026-04-22T17:51:18Z",
        "isRead": false
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 20
  }
}


2. Mark One Notification as Read
PATCH `/api/notifications/:id/read`

Headers:
Authorization: Bearer <access_token>

Response (200):
{
  "success": true,
  "message": "Notification marked as read"
}


3. Mark All Notifications as Read
PATCH `/api/notifications/read-all`

Headers:
Authorization: Bearer <access_token>

Response (200):
{
  "success": true,
  "message": "All notifications marked as read"
}


 4. Get Unread Notification Count
GET `/api/notifications/unread-count`

Headers:
Authorization: Bearer <access_token>

Response (200):
{
  "success": true,
  "data": {
    "unreadCount": 15
  }
}



5. Get Priority Notifications (Top N)
GET `/api/notifications/priority`

Headers:
Authorization: Bearer <access_token>

Query Parameters:
| Parameter | Type | Required | Description |
|---|---|---|---|
| limit | integer | No | Top N notifications (default: 10) |

Response (200):
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "b283218f-ea5a-4b7c-93a9-1f2f240d64b0",
        "type": "Placement",
        "message": "CSX Corporation hiring",
        "timestamp": "2026-04-22T17:51:18Z",
        "isRead": false,
        "priorityScore": 95
      }
    ]
  }
}





Real-Time Notification Mechanism

Chosen Approach: Server-Sent Events (SSE)

Why SSE over WebSockets:
- Notifications are one-directional — server pushes to client only
- SSE is simpler to implement and works over plain HTTP
- Automatic reconnection is built into the browser
- WebSockets add unnecessary complexity for one-way data flow

SSE Endpoint:
GET `/api/notifications/stream`

Request Headers:
- Authorization: Bearer <access_token>
- Accept: text/event-stream

Response Headers:
- Content-Type: text/event-stream

Example event pushed from server:
data: {"id":"abc123","type":"Placement","message":"Google hiring","timestamp":"2026-06-23T10:00:00Z","isRead":false}

How it works:
1. Student opens the app — frontend connects to /api/notifications/stream
2. Server keeps the connection open permanently
3. When HR sends a notification, server pushes it through SSE to all connected students
4. Frontend receives it instantly and updates the UI without page refresh