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





Stage 3:




Query analysis and optimization:

# The original query:


SELECT * FROM notifications

WHERE studentID = 1042 AND isRead =

ORDER BY createdAt ASC;



# Is this query accurate?

It will return the correct results.
There are a couple of things to point out.
Using SELECT * is not an idea. It gets every column in the notifications table even if the frontend only needs the id, type, message and timestamp. This wastes memory and increases the amount of data that is transferred for no reason.



# Why is it slow?

The notifications table has grown to 50,000 students and 5,000,000 notifications. When this query runs the database does not have an index on studentID or isRead. It has to look at every single row in the notifications table to find the ones that match. This is called a full table scan. It gets worse as the notifications table grows.

The ORDER BY createdAt ASC adds work because the database has to sort the results after filtering them.

At 5 million rows this kind of query can take seconds to complete which is not acceptable for something that runs every time a student opens the app.


# What I would change

First, select only the columns you actually need instead of using SELECT *.

Second, add a composite index on studentID and isRead together. A composite index works well here because both columns appear in the WHERE clause every time this query runs.

    CREATE INDEX idx_notifications_student_read 
    ON notifications(studentID, isRead, createdAt);

Including createdAt in the index also helps avoid a separate sort step since the data comes out already ordered.

The improved query would look like this:

    SELECT id, type, message, createdAt, isRead
    FROM notifications
    WHERE studentID = 1042 AND isRead = false
    ORDER BY createdAt ASC;

# What would the computation cost look like?

Before the index, the database does a full table scan which is O(n) where n is the total number of rows. At 5 million rows this is very expensive.

After adding the index, the database can jump directly to the rows for studentID 1042 and filter by isRead in O(log n) time. The difference is massive at scale.

# Should we add indexes on every column to be safe?

No

Every index you add takes up disk space and slows down INSERT and UPDATE operations because the index has to be updated every time data changes. If you index every column, your write performance will suffer significantly.

The right approach is to add indexes only on columns that appear frequently in WHERE clauses, JOIN conditions, or ORDER BY clauses. Index based on your actual query patterns, not just to be safe.



# Query to find all students who received a Placement:

notification in the last 7 days

    SELECT DISTINCT studentID
    FROM notifications
    WHERE notificationType = 'Placement'
    AND createdAt >= NOW() - INTERVAL '7 days';

This query finds every unique student who got at least one Placement notification in the past week.

Adding an index on notificationType and createdAt together will make this query fast as the table grows:

    CREATE INDEX idx_notifications_type_date
    ON notifications(notificationType, createdAt DESC);




Stage 4:


# Handling Database Overload on Page Load:

The problem here is that every time a student opens the app,it hits the database to fetch notifications. With 50,000 students all doing this at the same time, the database gets overwhelmed.

The solution I would go with is caching using Redis.

The idea is simple. The first time a student fetches their notifications, we get the data from the database and store a copy of it in Redis with an expiry time of around 60 seconds. The next time the same student loads the page within that 60 seconds, we return the data from Redis instead of hitting the database again.

This means the database only gets queried once per minute per student instead of every single time they load the page.

For the unread count specifically, we store it in Redis and only update it when a notification is marked as read. This avoids running a COUNT query on millions of rows repeatedly.

The tradeoff is that the data might be slightly outdated for up to 60 seconds. For example if a new notification arrives, the student might not see it immediately. But for a campus notification platform this is completely acceptable. Nobody needs to see a notification within the exact second it was created.

Another option is to keep the database queries but add read replicas. Write operations go to the primary database and read operations go to the replicas. This spreads the load but adds infrastructure complexity and cost. Redis caching is simpler and more effective for our use case.




Stage 5:

Redesigning the Notify All Feature

# The original approach and its problems:

The current pseudocode does this for each student one by one:

    send_email(student_id, message)
    save_to_db(student_id, message)
    push_to_app(student_id, message)

The problem with this is that it runs synchronously for each of the 50,000 students. If sending an email for one student takes even 100ms, doing it for 50,000 students takes over an hour. That is completely unusable.

The logs also showed that send_email failed for 200 students midway. With the current design there is no retry mechanism. Those 200 students simply never get the email and nobody knows about it.

# Should saving to DB and sending email happen together?

No they should not. These are two different operations with different failure modes. The email service might be slow or down at that moment but that should not stop us from saving the notification to the database. The student should still see the notification in the app even if the email failed.


# Redesigned approach using a message queue

Instead of processing all 50,000 students in one synchronous loop, we push jobs into a queue and process them in the background.

    function notify_all(student_ids, message):
        for student_id in student_ids:
            push_to_queue(student_id, message)

    function queue_worker(job):
        student_id = job.student_id
        message = job.message
        
        save_to_db(student_id, message)
        push_to_app(student_id, message)
        
        result = send_email(student_id, message)
        
        if result == failed:
            retry_later(job, attempts=3)


The notify_all function now just pushes jobs into the queue and returns immediately. Multiple workers process the queue in parallel so 50,000 emails go out much faster.

If an email fails, the worker retries it up to 3 times before marking it as failed and logging it for manual review.

Saving to DB and pushing to app happen first because they are reliable and fast. Email is attempted after and failures do not affect the other two operations.



