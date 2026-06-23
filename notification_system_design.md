stage 1:


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



stage 2:


Database Design

Which database and why?

I choose PostgreSQL for this platform. The reason is simple. Notifications have a fixed structure. Every notification will always have an id, a type, a message, a timestamp and a read or unread status tied to a student. When our data looks the same every time a relational database is the choice.

I considered MongoDB. Since we are not dealing with nested data structures, here there is no real advantage to using it. PostgreSQL handles the kind of queries we need. Filtering by type sorting by timestamp checking read status. Efficiently especially once indexes are in place.


Tables:


The students table stores information about each student.

id       - Unique identifier for each student

name     - Name

email    - College email, must be unique

roll_no  - Roll number, must be unique

created_at- When the record was created




The notifications table stores each notification that gets created.

id       - Unique identifier

type     - One of Placement, Event or Result

message  - The notification text

timestamp- When the notification was created

created_at- When the record was inserted into the database




The student_notifications table is the most important one. It connects students to notifications. Tracks whether each student has read each notification.

id             - Identifier

student_id     - Which student this is for

notification_id- Which notification this refers to

is_read        - True if the student has read it

read_at        - When they read it

created_at     - When it was delivered to the student

I kept notifications separate from student_notifications because one notification can go to many students. If HR posts a placement update it should reach all students. Storing it once in notifications and creating rows in student_notifications for each student is much cleaner than duplicating the notification content all times.




Problems that will come up as data grows:



The student_notifications table is going to get very large fast. If there are 50,000 students and each receives 100 notifications that is already 5 million rows. As more notifications come in every day this number keeps growing.

Without indexes every query that filters by student read status or notification type will scan the table. That becomes extremely slow at this scale.

Fetching the count on every page load is also a problem. If every student opens the app and triggers a COUNT query against 5 million rows the PostgreSQL database will struggle under that load.




How I would like to handle these problems:


Adding indexes on student_id and is_read is the most important fix. This makes filtering

For counts I would store them in Redis and update the count whenever a notification is marked as read instead of running a COUNT query every single time.

For data notifications older than 6 months can be moved to an archive table so the main table stays manageable in size.



Queries:


# Fetch all notifications for a student with type filter:



SELECT n.id, n.type, n.message, n.timestamp sn.is_read

FROM notifications n

JOIN student_notifications sn ON n.id = sn.notification_id

WHERE sn.student_id = 'student_id_here'

AND n.type = 'Placement'

ORDER BY n.timestamp DESC;


Remove the AND n.type line if no filter is applied.


# Get count for a student:


SELECT COUNT(*) as unread_count

, FROM student_notifications

WHERE student_id = 'student_id_here'

AND is_read = FALSE;

Mark one notification as read:

UPDATE student_notifications

SET is_read = TRUE read_at = NOW()

WHERE student_id = 'student_id_here'

AND notification_id = 'notification_id_here';




# Mark all as read:



UPDATE student_notifications

SET TRUE read_at = NOW()

WHERE student_id = 'student_id_here'

AND is_read = FALSE;




# Indexes to add:




CREATE INDEX idx_sn_student_id

ON student_notifications(student_id);

CREATE INDEX idx_sn_student_read

ON student_notifications(student_id is_read);

CREATE INDEX idx_notifications_type

ON notifications(type);

CREATE INDEX idx_notifications_timestamp

ON notifications(timestamp DESC);
