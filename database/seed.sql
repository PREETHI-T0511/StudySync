USE student_group_collaboration;

-- Replace these placeholders with password hashes before testing authentication.
INSERT INTO STUDENT
(student_name, email, password, department, semester, cgpa)
VALUES
('Aarav Sharma', 'aarav@gmail.com', 'REPLACE_WITH_PASSWORD_HASH', 'CSE', 5, 8.50),
('Ananya Rao', 'ananya@gmail.com', 'REPLACE_WITH_PASSWORD_HASH', 'CSE', 5, 9.10),
('Rahul Kumar', 'rahul@gmail.com', 'REPLACE_WITH_PASSWORD_HASH', 'ISE', 5, 7.80),
('Priya Nair', 'priya@gmail.com', 'REPLACE_WITH_PASSWORD_HASH', 'CSE', 5, 8.90),
('Karan Mehta', 'karan@gmail.com', 'REPLACE_WITH_PASSWORD_HASH', 'ECE', 5, 7.50);

INSERT INTO `GROUP`
(group_name, description, created_date, created_by, project_estimated_hrs)
VALUES
('Database Project Team', 'Working on the DBMS project', '2026-10-01', 1, 24),
('Web Development Team', 'Working on the web application', '2026-10-02', 2, 20);

INSERT INTO GROUP_MEMBER
(group_id, student_id, role, joined_date)
VALUES
(1, 1, 'Leader', '2026-10-01'),
(1, 2, 'Member', '2026-10-01'),
(1, 3, 'Member', '2026-10-01'),
(2, 2, 'Leader', '2026-10-02'),
(2, 4, 'Member', '2026-10-02'),
(2, 5, 'Member', '2026-10-02');

INSERT INTO AVAILABILITY
(student_id, available_date, start_time, end_time)
VALUES
(1, '2026-11-05', '10:00:00', '12:00:00'),
(2, '2026-11-05', '11:00:00', '13:00:00'),
(3, '2026-11-05', '10:30:00', '12:30:00'),
(4, '2026-11-06', '14:00:00', '16:00:00'),
(5, '2026-11-06', '15:00:00', '17:00:00');

INSERT INTO TASK
(group_id, task_title, task_description, deadline, priority, status, estimated_hrs)
VALUES
(1, 'Database Design', 'Design the database schema', '2026-11-10', 'High', 'In Progress', 10),
(1, 'SQL Queries', 'Write SQL queries for the project', '2026-11-12', 'Medium', 'Pending', 8),
(2, 'Frontend Design', 'Create the frontend interface', '2026-11-15', 'High', 'In Progress', 12),
(2, 'Testing', 'Test the web application', '2026-11-18', 'Low', 'Pending', 5);

INSERT INTO MEETING
(group_id, meeting_title, meeting_date, start_time, end_time, meeting_location)
VALUES
(1, 'Database Discussion', '2026-11-05', '10:00:00', '11:00:00', 'Lab 1'),
(2, 'Frontend Review', '2026-11-06', '14:00:00', '15:00:00', 'Online');

INSERT INTO MEETING_AGENDA
(meeting_id, agenda_title, agenda_description)
VALUES
(1, 'Schema Review', 'Discuss database tables and relationships'),
(1, 'Query Discussion', 'Review SQL queries'),
(2, 'UI Review', 'Review frontend design'),
(2, 'Testing Plan', 'Discuss testing activities');

INSERT INTO MEETING_PARTICIPANT
(meeting_id, student_id, attendance_status)
VALUES
(1, 1, 'Accepted'),
(1, 2, 'Accepted'),
(1, 3, 'Invited'),
(2, 2, 'Accepted'),
(2, 4, 'Accepted'),
(2, 5, 'Invited');

INSERT INTO TASK_ASSIGNMENT
(task_id, student_id, assigned_date, assigned_hours, assignment_status)
VALUES
(1, 1, '2026-11-01', 5, 'In Progress'),
(1, 2, '2026-11-01', 5, 'Assigned'),
(2, 3, '2026-11-01', 4, 'Assigned'),
(2, 1, '2026-11-01', 4, 'Assigned'),
(3, 4, '2026-11-02', 6, 'In Progress'),
(3, 5, '2026-11-02', 6, 'Assigned'),
(4, 4, '2026-11-02', 5, 'Assigned');
